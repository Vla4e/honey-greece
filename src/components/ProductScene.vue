<template>
  <div class="scene-container" ref="sceneContainer">
    <canvas v-show="true" ref="webGl" class="webGl" />
    <div v-if="false" class="loading-indicator-container">
      <LoadingIndicator style="width: 100px; height: 100px" class="jar-loading" />
    </div>

    <div :style="false ? 'pointer-events: none;' : ''" class="size-selection">
      <button
        v-if="currentBrand === 'okto'"
        @click="selectJarSize('450g')"
        :class="currentJarSize === '450g' ? 'selected' : ''"
        class="large-jar"
      >
        450g
      </button>
      <button @click="cycleColors()">CYCLE HONEY TYPE: {{ currentHType }}</button>
      <button
        @click="selectJarSize('300g')"
        :class="currentJarSize === '300g' ? 'selected' : ''"
        class="medium-jar"
      >
        300g
      </button>
      <button
        v-if="currentBrand !== 'okto'"
        @click="selectJarSize('150g')"
        :class="currentJarSize === '150g' ? 'selected' : ''"
        class="small-jar"
      >
        150g
      </button>
      <!-- <button @click="startWipe = !startWipe" style="position:absolute; top: 80%; left: 50%;">TEXTURE</button> -->
    </div>

    <div style="position: absolute; top: 0%; left: -50%; display: flex; width: 55%">
      <!-- <PositionSliders  class="target" :jarSmall="jarSmall" :jarMedium="jarMedium"/> -->
      <!-- <div class="sliders">
        <label for="xSlider">X Position:</label>
        <input type="range" id="xSlider" min="-100" max="100" step="1" v-model="x" @input="updatePosition('x', x)">
        
        <label for="ySlider">Y Position:</label>
        <input type="range" id="ySlider" min="-100" max="100" step="1" v-model="y" @input="updatePosition('y', y)">
        
        <label for="zSlider">Z Position:</label>
        <input type="range" id="zSlider" min="-100" max="100" step="1" v-model="z" @input="updatePosition('z', z)">
      </div> -->
    </div>
  </div>
</template>

<script>
import {
  Scene,
  SphereGeometry,
  LineBasicMaterial,
  BufferGeometry,
  Line,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PMREMGenerator,
  Mesh,
  PointLight,
  PerspectiveCamera,
  WebGLRenderer,
  TextureLoader,
  Cache,
  HemisphereLight,
  Vector2,
  Vector3,
  Quaternion,
  Box3,
  Box3Helper,
  AxesHelper,
  CameraHelper,
  BoxHelper,
  Clock,
  Color,
  ShaderMaterial,
  NormalBlending,
  CubeCamera,
  WebGLCubeRenderTarget,
  BackSide,
  BoxGeometry,
  SRGBColorSpace,
  NoToneMapping,
  ACESFilmicToneMapping,
  LinearToneMapping,
  CineonToneMapping,
  ReinhardToneMapping,
  CubeTexture,
  CanvasTexture,
  EquirectangularReflectionMapping,
  DoubleSide,
  ColorManagement,
} from "three";
ColorManagement.enabled = true;
// Postprocessing
import { addPostProcessing, addNativePostProcessing }  from "@/helpers/JarScene/PostProcessing.js";

import {
  watch,
  onMounted,
  onUnmounted,
  onBeforeUnmount,
  ref,
  computed,
  nextTick,
  inject,
  toRaw,
} from "vue";
import { get, objectEntries, useWindowSize } from "@vueuse/core";
import { useProductStore } from "@/store/product.js";
import { useGlobalStore } from "@/store/global.js";
import { storeToRefs } from "pinia";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import brandConfigs from "@/assets/brand-information/index.js";
// let brandSizes = {}

//Loader imports
import {
  initializeGLTFLoader,
  loadGlb,
  loadGlbReturnParts,
  loadTexture,
  loadEnvironment,
} from "@/helpers/loaders.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";

//Animation imports
import { initializeMixer, setupAnimations } from "@/helpers/AnimationControls.js";
import { initiateObjectRotation } from "@/helpers/3DObjectPan.js";

import { debounce, parabolicPathCoordinate } from "@/helpers/globalFunctions.js";

import Stats from "stats.js";
import PositionSliders from "./PositionSliders.vue";
import LoadingIndicator from "./LoadingIndicator.vue";

//ShaderMaterial imports
//Honey
import {
  oldHoneyMaterial,
  playfulMaterial2,
  playfulMaterial3,
} from "../helpers/JarScene/HoneyMaterials.js";

//Label

/* "ENUMS" */
// IMPORTANT: JAR HEIGHTS and WIDTHS are 0.3 < n < 1 in World Scale //
const jarConfigs = Object.freeze({
  "150g": {
    name: "150g",
    source: "/assets/glb/jar-150g-v8.glb",
    position: {
      x: 0,
      y: 0,
      z: 0.02,
    },
  },
  "300g": {
    name: "300g",
    source: "/assets/glb/jar-300g-v4.glb",
    position: {
      x: 0,
      y: 0,
      z: 0.02,
    },
  },
  "400g": {
    name: "400g",
    source: "/assets/glb/jar-450g-v4.glb",
    position: {
      x: 0,
      y: 0,
      z: 0.02,
    },
  },
});

import * as TWEEN from "@tweenjs/tween.js";
import { zoomIn, zoomOut } from "@/helpers/cameraZoom.js";
import jarPositions from "@/assets/boxCenters.js";
import {
  moveSceneToGridPosition,
  revertScenePosition,
} from "../helpers/JarScene/MoveSceneByOffset.js";
import { useMeshStore } from "../store/meshes.js";
const cameraConfigs = Object.freeze({
  x: 0.35,
  y: 0.06, // 0.06 for small set. 0.075
  z: 0,
  // x: 0.56,
  // y: 0,
  // z: 0.045
});
const cameraConfigsMobile = Object.freeze({
  x: 0.22,
  y: 0.06,
  z: 0,
  x450g: 0.28,
});
let animatingCamera = false;

Cache.enabled = true;

import {
  WebGLRenderTarget,
  NearestFilter,
  LinearFilter,
  RGBAFormat,
  Vector4,
  PlaneGeometry,
  Texture
} from 'three';
export default {
  setup() {

    function createDebugPlane(renderTarget) {
      const geometry = new PlaneGeometry(1, 1);
      const material = new MeshBasicMaterial({ 
        map: renderTarget.texture,
        side: DoubleSide
      });
      const plane = new Mesh(geometry, material);
      
      // Position the debug plane somewhere visible
      plane.position.set(-2, 0, 0);
      
      return plane;
    }
    async function setupRenderToTexture(renderer, mainScene, camera, cylinderA, cylinderB) {
      console.log("Setting up render-to-texture");
      console.log("Cylinder A:", cylinderA);
      console.log("Cylinder B:", cylinderB);
      
      // Create a higher-resolution render target
      const renderTarget = new WebGLRenderTarget(2048, 2048, {
        format: RGBAFormat,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        colorSpace: SRGBColorSpace, // Match your renderer's encoding
        generateMipmaps: true
      });
      
      // Create a separate scene that matches the lighting of the main scene
      const cylinderAScene = new Scene();
      cylinderAScene.background = mainScene.background;
      cylinderAScene.environment = mainScene.environment;
      
      // Clone cylinder A and add any necessary lights from main scene
      const cylinderAClone = cylinderA.clone();
      cylinderAClone.material = cylinderA.material.clone();
      cylinderAScene.add(cylinderAClone);
      
      // Copy any relevant lights from the main scene
      mainScene.children.forEach(child => {
        if (child.isLight) {
          cylinderAScene.add(child.clone());
        }
      });
      
      // Calculate height ratio
      let heightRatio = 1.5; // Default fallback
      
      if (cylinderA.geometry.parameters && cylinderB.geometry.parameters) {
        heightRatio = cylinderB.geometry.parameters.height / cylinderA.geometry.parameters.height;
        console.log("Height ratio calculated:", heightRatio);
      } else {
        // Alternative calculation if parameters aren't available
        const boxA = new Box3().setFromObject(cylinderA);
        const boxB = new Box3().setFromObject(cylinderB);
        const heightA = boxA.max.y - boxA.min.y;
        const heightB = boxB.max.y - boxB.min.y;
        heightRatio = heightB / heightA;
        console.log("Height ratio calculated from bounding box:", heightRatio);
      }
      
      // Create a special material for cylinder B that uses the rendered texture
      const cylinderBMaterial = new ShaderMaterial({
        uniforms: {
          cylinderATexture: { value: renderTarget.texture },
          heightRatio: { value: heightRatio },
          debug: { value: 0.0 } // Add debug uniform (0.0 = off, 1.0 = on)
        },
        vertexShader: `
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D cylinderATexture;
          uniform float heightRatio;
          uniform float debug;
          varying vec2 vUv;
          
          void main() {
            // Remap UVs to maintain center alignment while stretching
            vec2 remappedUv = vUv;
            
            // This transformation maps the center of cylinder A to the center of cylinder B
            // and stretches accordingly from the center
            remappedUv.y = (remappedUv.y - 0.5) / heightRatio + 0.5;
            
            // Debug visualization - color based on UV coordinates
            if (debug > 0.5) {
              gl_FragColor = vec4(remappedUv, 0.0, 1.0);
              return;
            }
            
            // Sample the texture with our remapped UVs
            if (remappedUv.y >= 0.0 && remappedUv.y <= 1.0) {
              vec4 texColor = texture2D(cylinderATexture, remappedUv);
              
              // Check if we're getting valid texture data
              if (texColor.r <= 0.0 && texColor.g <= 0.0 && texColor.b <= 0.0 && texColor.a <= 0.0) {
                // If texture is completely black/transparent, show a warning color
                gl_FragColor = vec4(1.0, 0.0, 1.0, 0.5); // Magenta for debug
              } else {
                gl_FragColor = texColor;
              }
            } else {
              // For areas outside our rendered texture
              gl_FragColor = vec4(0.2, 0.2, 0.2, 0.5); // Semi-transparent gray for debug
            }
          }
        `,
        transparent: true
  });
  
  // Store original material
  const originalMaterial = cylinderB.material;
  
  // Apply the new material to cylinder B
  cylinderB.material = cylinderBMaterial;
  
  // Create debug plane and add to scene
  const debugPlane = createDebugPlane(renderTarget);
  
  // Return objects needed for the render function
  return {
    renderTarget,
    cylinderAScene,
    cylinderAClone,
    cylinderBMaterial,
    debugPlane,
    originalMaterial
  };
    }
    function renderCylinderAToTexture(renderer, rtObjects, camera, mainScene) {
      // Store current renderer state
      const currentRenderTarget = renderer.getRenderTarget();
      
      // Position the clone properly in view of the camera
      // This ensures it's fully visible when rendering to texture
      rtObjects.cylinderAClone.position.set(0, 0, -5); // Position in front of camera
      rtObjects.cylinderAClone.rotation.set(0, 0, 0);  // Reset rotation
      
      // Ensure the camera is properly set up for the render target
      const aspectRatio = rtObjects.renderTarget.width / rtObjects.renderTarget.height;
      const tmpCamera = camera.clone();
      tmpCamera.aspect = aspectRatio;
      tmpCamera.position.set(0, 0, 5);
      tmpCamera.lookAt(0, 0, 0);
      tmpCamera.updateProjectionMatrix();
      
      // Make sure the cylinderAClone has the latest material parameters
      if (rtObjects.cylinderAClone.material.uniforms) {
        // Copy all uniforms from original material
        Object.keys(rtObjects.cylinderAClone.material.uniforms).forEach(key => {
          const origUniform = rtObjects.cylinderAOriginalMaterial.uniforms[key];
          if (origUniform && origUniform.value !== undefined) {
            rtObjects.cylinderAClone.material.uniforms[key].value = origUniform.value;
          }
        });
      }
      
      // Add a debug light to ensure the object is visible
      if (!rtObjects.debugLight) {
        rtObjects.debugLight = new THREE.DirectionalLight(0xffffff, 1);
        rtObjects.debugLight.position.set(1, 1, 1);
        rtObjects.cylinderAScene.add(rtObjects.debugLight);
      }
      
      // Render cylinder A to our texture
      console.log("Rendering to texture...");
      renderer.setRenderTarget(rtObjects.renderTarget);
      renderer.clear();
      renderer.render(rtObjects.cylinderAScene, tmpCamera);
      
      // Force texture update
      rtObjects.renderTarget.texture.needsUpdate = true;
      
      // Restore original render target
      renderer.setRenderTarget(currentRenderTarget);
      
      // Add console debug to check texture
      console.log("Render target texture:", rtObjects.renderTarget.texture);
      console.log("Texture in uniform:", rtObjects.cylinderBMaterial.uniforms.cylinderATexture.value);
    }

    function createTestTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      // Create a gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'red');
      gradient.addColorStop(0.5, 'green');
      gradient.addColorStop(1, 'blue');
      
      // Fill with gradient
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add some stripes
      ctx.fillStyle = 'white';
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.fillRect(0, i, canvas.width, 10);
      }
      
      // Create texture from canvas
      const texture = new CanvasTexture(canvas);
      texture.needsUpdate = true;
      
      return texture;
    }

    // Modify your shader to use this test texture
    function applyTestTexture(cylinderB) {
      const testTexture = createTestTexture();
      
      const testMaterial = new ShaderMaterial({
        uniforms: {
          cylinderATexture: { value: testTexture },
          heightRatio: { value: 1.5 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D cylinderATexture;
          uniform float heightRatio;
          varying vec2 vUv;
          
          void main() {
            vec2 remappedUv = vUv;
            remappedUv.y = (remappedUv.y - 0.5) / heightRatio + 0.5;
            
            if (remappedUv.y >= 0.0 && remappedUv.y <= 1.0) {
              gl_FragColor = texture2D(cylinderATexture, remappedUv);
            } else {
              gl_FragColor = vec4(0.5, 0.0, 0.5, 1.0);
            }
          }
        `,
        transparent: true
      });
      
      cylinderB.material = testMaterial;
    }

    function toggleDebugMode(rtObjects, isDebug) {
      if (!rtObjects) return;
      
      // Toggle debug uniform in shader
      rtObjects.cylinderBMaterial.uniforms.debug.value = isDebug ? 1.0 : 0.0;
      
      // Toggle visibility of debug plane
      rtObjects.debugPlane.visible = isDebug;
    }
    let composer = null; // addPostprocessing, animate
    let renderScene;

    let jarMedium = ref([]);
    let jarSmall = ref([]);

    let isLoading = ref(false);
    //--------------------------------------------------------- DELETE ABOVE
    let stats = new Stats();
    //ref to canvas, window size
    stats.showPanel(0);
    // document.body.appendChild(stats.dom)
    let emitter = inject("emitter");

    let globalOrbitControls;

    const webGl = ref();
    const sceneContainer = ref();
    const productStore = useProductStore();

    //Loading Circle
    const globalStore = useGlobalStore();

    let textureUrlSlugs = {
      brand: "haa",
      productLine: "monoflorals",
      size: "300g",
      flavour: "fir_limited",
      fileType: "png",
    };
    let jarTextures = {};
    let currentBrand = ref("");

    const containerWidth = ref(0);
    const containerHeight = ref(0);

    const aspectRatio = computed(() => {
      return containerWidth.value / containerHeight.value;
    });

    /*Loaders + configuration of loaders*/
    const loader = initializeGLTFLoader(true, true, true); //args: draco, ktx2, meshopt decoder

    /**
     * @type {THREE.PerspectiveCamera | null}
     */
    let globalCamera = null;

    /**
     * @type {THREE.WebGLRenderer | null}
     */
    let globalRenderer = null;

    /**
     * @type {THREE.Scene | null}
     */
    let globalScene = null;
    let tempScene = ref(new Scene());
    watch(
      () => globalScene,
      (newValue) => {
        tempScene.value = globalScene;
      }
    );
    let labelSceneL = null;
    let labelSceneR = null;

    /**
     * @type {THREE.PointLight | null}
     */
    let globalPointLight = null;

    /**
     * @type {THREE.CameraHelper | null}
     */
    let cameraHelper = null;

    /**
     * @type {THREE.AxesHelper | null}
     */
    let axesHelper = null;

    /**
     * @type {THREE.Vector3 | null}
     */
    let initialLeftWorld = null;

    /**
     * @type {THREE.Vector3 | null}
     */
    let initialRightWorld = null;

    /**
     * @type {THREE.Quaternion | null}
     */
    let globalQuaternion = null;
    let initialMeshQuaternion;
    let initialMeshRotation;
    let initialCameraPosition;
    let initialCameraQuaternion;
    let initialZoom;

    let LOGTIMER = 0;
    let animationDONE = false;
    let isLoadingTexture = false;
    let isAnimationYActive = false;
    let isFirstLoad = true;
    let isResettingRotation = false;
    let resetStartTime = 0;
    const resetDuration = 1000;

    /**
     * @type {THREE.Scene | null}
     */

    let currentJarScene = null;
    let upcomingJarScene = null;
    let currentJarSize = ref(jarConfigs["300g"].name);
    let previousJarSize = ref(null);
    let currentJarSizeGrams = ref(null);
    let upcomingJarSize = ref("");
    let jarScenes = {}; // store loaded model to avoid reloading

    let currentJarLabel = null;
    let upcomingJarLabel = null;

    let mouseX = 0;
    let mouseY = 0;

    let mixer;
    let clipActions = [];
    let animationState = new Map();

    let jarSizes = [];

    let loadedText = false;
    let labelTest;
    let matcapId = ref(1);
    let globalTextureLoader = new TextureLoader();
    const { isMobile } = inject("screenSize");

    let alreadyLoadedProductLines = [];
    async function loadAllTextures() {
      console.log(
        alreadyLoadedProductLines.length
      );
      if (alreadyLoadedProductLines.length) {
        console.log("HUH");
      }
      let wtf = alreadyLoadedProductLines.find((line) => {
        return line === textureUrlSlugs.productLine;
      });

      if (wtf) {
        return;
      }

      let hardcodedPDLs = {
        Okto: ["Multiflorals", "Monoflorals"],
        HAA: ["Monoflorals", "Blends"],
      };
      let hardcodedPDLUrls = {
        Okto: ["multiflorals", "monoflorals"],
        HAA: ["monoflorals", "blends"],
      };
      let hardcodedSizes = {
        Okto: ["450g", "300g"],
        HAA: ["300g", "150g"],
      };

      let brandUrl = textureUrlSlugs.brand === "okto" ? "Okto" : "HAA";
      let productLineUrl =
        textureUrlSlugs.productLine.charAt(0).toUpperCase() +
        textureUrlSlugs.productLine.slice(1);
      let tempFlavors1 =
        brandConfigs[brandUrl].brandProductLines[hardcodedPDLs[brandUrl][0]].flavours;
      let tempFlavors2 =
        brandConfigs[brandUrl].brandProductLines[hardcodedPDLs[brandUrl][1]].flavours;
      let allTextures = [];

      // Loop over both flavor lists sequentially
      [tempFlavors1, tempFlavors2].forEach((flavours, index) => {
        let pdlUrl = hardcodedPDLUrls[brandUrl][index];

        flavours.forEach(async (flavour, flavourIndex) => {
          let tempTexture = await loadTexture(
            `/assets/label-textures-3/${textureUrlSlugs.brand}/${pdlUrl}/${hardcodedSizes[brandUrl][0]}/${flavour.urlSlug}.png`
          );
          let tempTexture2 = await loadTexture(
            `/assets/label-textures-3/${textureUrlSlugs.brand}/${pdlUrl}/${hardcodedSizes[brandUrl][1]}/${flavour.urlSlug}.png`
          );

          tempTexture.name = flavour.urlSlug;
          tempTexture.flipY = false;

          allTextures.push(tempTexture, tempTexture2);
        });
      });
      alreadyLoadedProductLines.push(textureUrlSlugs.productLine);
      return allTextures;
    }
    async function changeMat() {
      // let textureLoad = await loadTexture('/assets/label-textures-3/haa/monoflorals/300g/fir_limited.png')
      // textureLoad.flipY = false;
      // let textureLoad2 = await loadTexture('/assets/label-textures-3/haa/monoflorals/300g/pine_limited.png')
      // textureLoad2.flipY = false;
      // // // console.log("BRAND CONFIGS", brandConfigs[textureUrlSlugs.brand.toUpperCase()].brandProductLines['Monoflorals'].flavours)
      let tempFlavors =
        brandConfigs[textureUrlSlugs.brand.toUpperCase()].brandProductLines["Monoflorals"]
          .flavours;

      await loadAllTextures();

      loadedText = true;
    }

    let matcapType = ref(true);

    async function renderMatcap() {
      await changeHoneyShader();
      return;
    }

    let honeyTypesArr = [
      "cotton",
      "fir",
      "master",
      "forest",
      "mediterranean",
      "afficionado",
      "natural",
      "oak",
      "pine",
      "thyme",
      "chestnut",
    ];
    let honeyId = 0;
    let currentHType = ref("cotton");
    async function cycleColors() {
      if (honeyId == 10) {
        honeyId = 0;
      } else honeyId++;
      currentHType.value = honeyTypesArr[honeyId];
      await changeHoneyShader(honeyTypesArr[honeyId]);
    }
    // Replace changeMatcapFinal with a new function that uses createComplexMaterialOptions
    async function changeHoneyShader(type = "cotton", id, color) {
      // const material2 = await honeyMaterialPositionInput(
      //   honeyMeshes,
      //   globalTextureLoader,
      //   globalScene.environment,
      //   type
      // )

      // const material2 = await honeyMaterial(
      //   honeyMeshes,
      //   globalTextureLoader,
      //   globalScene.environment,
      //   type
      // )
      await revertScenePosition(globalScene, globalCamera);
      console.log("1. Will move to pos");
      await moveSceneToGridPosition(globalScene, globalCamera, honeyMesh1.position, type);
      console.log("2. Moved to POS");
      // const material2 = await oldHoneyMaterial(
      //   globalTextureLoader,
      //   globalScene.environment,
      //   type,
      //   '300g',
      //   honeyMeshes
      // )
      // const material3 = await oldHoneyMaterial(
      //   globalTextureLoader,
      //   globalScene.environment,
      //   type,
      //   '450g',
      //   honeyMeshes
      // )
      // const honeyMaterials = {
      //   [jarSizes[0]]:  await playfulMaterial2(
      //     globalTextureLoader,
      //     globalScene.environment,
      //     type,
      //     jarSizes[0],
      //     honeyMeshes,
      //     currentBrand.value,
      //     globalCamera
      //   ),
      //   [jarSizes[1]]: await playfulMaterial2(
      //     globalTextureLoader,
      //     globalScene.environment,
      //     type,
      //     jarSizes[1],
      //     honeyMeshes,
      //     currentBrand.value,
      //     globalCamera
      //   )
      // }
      const honeyMaterials = {
        [jarSizes[0]]: await playfulMaterial3(
          globalTextureLoader,
          globalScene.environment,
          type,
          jarSizes[0],
          honeyMeshes,
          currentBrand.value,
          globalCamera
        ),
        [jarSizes[1]]: await playfulMaterial3(
          globalTextureLoader,
          globalScene.environment,
          type,
          jarSizes[1],
          honeyMeshes,
          currentBrand.value,
          globalCamera
        ),
      };

      console.log("Materials:", honeyMaterials);
      console.log("HONEYMESHES:::::", honeyMeshes);
      Object.values(honeyMeshes).forEach((mesh) => {
        mesh.material = honeyMaterials[mesh.size];
        mesh.material.needsUpdate = true;
      });
      rtObjects = await setupRenderToTexture(
        globalRenderer, 
        globalScene, 
        globalCamera, 
        honeyMeshes["300g"], 
        honeyMeshes["450g"]
      );
      // Object.values(honeyMeshes).forEach((mesh) => {
      //   console.log("HONEY MESH : : : : : : : : :", mesh.name)
      //   if(mesh.name.includes('300')){
      //     mesh.material = material2;
      //     mesh.material.needsUpdate = true;
      //   } else if (mesh.name.includes('450')){
      //     mesh.material = material3;
      //     mesh.material.needsUpdate = true;
      //   }
      // })

      isLoading.value = false;
      return true;
    }

    let currentLoadedJars;
    let frontJarSize;
    let frontJarLabel;
    let frontJarGlass;
    let frontJarLabelClone;
    let backJarSize;
    let backJarLabel;
    let backJarGlass;
    let backJarLabelClone;
    function setTrackingVariables(setting, front = "300g", back = "150g") {
      // setting = 1 = default, 2 = manual
      if (setting === 1) {
        if (currentBrand.value === "okto") {
          frontJarSize = "300g";
          backJarSize = "150g";
        } else {
          frontJarSize = "300g";
          backJarSize = "450g";
        }
      } else {
        frontJarSize = front;
        backJarSize = back;
      }

      frontJarLabel = labelMeshes[frontJarSize];
      frontJarLabelClone = labelMeshesClones[frontJarSize];
      frontJarGlass = glassMeshes[frontJarSize];

      backJarLabel = labelMeshes[backJarSize];
      backJarLabelClone = labelMeshes[backJarSize];
      backJarGlass = glassMeshes[backJarSize];
    }
    let labelMeshes;
    let labelMeshesClones;
    let glassMeshes;
    let honeyMeshes;
    let honeyMesh1;
    let honeyMesh2;
    let honeyMesh3;

    let globalObj150g;
    let globalObj300g;
    let globalObj450g;

    let globalGlass150g;
    let globalGlass300g;
    let globalGlass450g;

    const setCanvas = async () => {
      globalStore.toggleLoadingCircle(true);
      let tempSize = frontJarSize.value || "300g"; //values used are in grams

      // Create Scene
      isLoading.value = true;
      globalScene = new Scene();

      // let sceneUrl =
      //   currentBrand.value === "okto"
      //     ? '/assets/glb/newJars/uvfixed4.glb':
      //       // '/assets/glb/newJars/450-300-animation-choppy-v2.glb':
      //       // '/assets/glb/newJars/uvfixed4.glb':
      //       "/assets/glb/newJars/300-150-animation-choppy-v6.glb";

      let sceneUrl =
        currentBrand.value === "okto"
          ? "/assets/glb/300-450.glb"
          : // '/assets/glb/newJars/uvfixed4.glb':
            // '/assets/glb/newJars/450-300-animation-choppy-v2.glb':
            // '/assets/glb/newJars/uvfixed4.glb':
            "/assets/glb/150-300.glb";
      let sceneParts = await loadGlbReturnParts(loader, sceneUrl);
      console.log("SceneParts:", sceneParts)
      // reference to mesh within loaded Scene - changes affect scene directly
      labelMeshes = sceneParts.labelMeshes;
      glassMeshes = sceneParts.glassMeshes;
      labelMeshesClones = sceneParts.labelMeshesClones;
      honeyMeshes = sceneParts.honeyMeshes;
      honeyMesh1 = honeyMeshes["300g"];
      honeyMesh2 = honeyMeshes["450g"];
      if (honeyMeshes["150g"]) {
        honeyMesh3 = honeyMeshes["150g"];
      }
      setTrackingVariables(1);

      mixer = initializeMixer(sceneParts.scene);
      // sceneParts.scene.position.set(0.25, -0.15, 0.1)
      globalScene.add(sceneParts.scene);

      // TEST remove label glass jar
      globalScene.traverse((obj) => {
        if (obj.isMesh) {
          if (obj.name.includes("honey_object")) {
            // label
            // obj.material.transparent = true;
            // obj.material.opacity = 0;
          }
          if (obj.name === "honey_object_300g") {
            // changeMatcap(obj)
            // globalObj300g = obj
          } else if (obj.name === "honey_object_150g") {
            // globalObj150g = obj;
          } else if (obj.name.includes("jar")) {
            // obj.material.roughness = 0.3;
            // obj.material.transparent = true;
            // obj.material.opacity = 0;
            if (obj.name === "jar_object_150g") {
              // globalGlass150g = obj
            } else {
              // globalGlass300g = obj
            }
            // obj.material.transparent = true;
            // obj.material.opacity = 0;
          }
          if (obj.name.includes("150g")) {
            // used for targeting of position sliders
            jarSmall.value.push(obj);
          } else if (obj.name.includes("300g")) {
            jarMedium.value.push(obj);
          }
          if (obj.name.includes("label")) {
            obj.material.transparent = true;
            obj.material.opacity = 0;
            if (obj.name.includes(tempSize)) {
              currentJarLabel = obj;
            } else upcomingJarLabel = obj;
          }
        }
      });

      let setupAnimationProps = await setupAnimations(mixer, sceneParts.gltf.animations);
      // destructuring makes globalScene.add throw error?
      // ({ clipActions, animationState } = setupAnimations(mixer, jarAnimation3.gltf.animations))
      clipActions = setupAnimationProps.clipActions;
      animationState = setupAnimationProps.animationState;

      currentJarScene = sceneParts.scene; //Scene to be loaded

      jarScenes[currentJarSize.value] = currentJarScene;

      let meshes = currentJarScene.children;
      let targetMesh = meshes[1];

      //Add jar scene to global scene
      // globalScene.add(currentJarScene)

      // Lights (added to camera below)
      globalPointLight = new PointLight(0xffffff, 1);
      globalPointLight.position.set(
        targetMesh.position.x,
        targetMesh.position.y,
        targetMesh.position.z + 0.5
      );

      // Camera
      // globalCamera = new PerspectiveCamera(25, aspectRatio.value, 0.001, 5);
      // if( isMobile.value ){
      //   // // // // console.log("ISMOBILE")
      //   globalCamera = new PerspectiveCamera(30, aspectRatio.value, 0.001, 3);
      //   // globalCamera.initialZoom = 1.4;
      //   globalCamera.position.set(cameraConfigsMobile.x, cameraConfigsMobile.y, cameraConfigsMobile.z)
      //   // globalCamera.position.set(cameraConfigs.x, cameraConfigs.y, cameraConfigs.z);
      //   // globalCamera.lookAt(0, 1, 0)
      // } else {
      //   globalCamera.position.set(cameraConfigs.x, cameraConfigs.y, cameraConfigs.z); // Position the camera in front of the mesh
      // }
      // globalCamera.lookAt(0, cameraConfigs.y , 0)
      // globalCamera.zoomFactor = 10;
      // targetMesh.add(axesHelper2)
      // globalCamera.add(globalPointLight); //add pointlight to camera
      globalCamera = new PerspectiveCamera(25, aspectRatio.value, 0.001, 10);
      // globalCamera.zoomFactor = 10;
      let axesHelper2 = new AxesHelper(5);
      axesHelper2.setColors("blue", "green", "red");
      // targetMesh.add(axesHelper2)
      globalCamera.position.set(0.35, 0.06, 0); // Position the camera in front of the mesh
      globalCamera.lookAt(0, 0.06, 0);
      // globalCamera.add(globalPointLight); //add pointlight to camera
      globalScene.add(globalCamera);

      // development axes helpers
      axesHelper = new AxesHelper(5);
      axesHelper.setColors("red", "blue", "green");
      cameraHelper = new CameraHelper(globalCamera);
      // globalScene.add(cameraHelper)
      // globalScene.add(axesHelper)

      // Renderer
      const canvas = webGl.value;
      globalRenderer = new WebGLRenderer({
        canvas,
        powerPreference: "high-performance",
        antialias: true,
        stencil: true, //used for postprocessing
        depth: true, //used for postprocessing
        alpha: true,
        // preserveDrawingBuffer: false
      });
      globalRenderer.setSize(containerWidth.value, containerHeight.value);
      globalRenderer.setClearColor(0x000000, 0);
      globalRenderer.setPixelRatio(window.devicePixelRatio);
      globalRenderer.shadowMap.enabled = false;
      globalRenderer.outputColorSpace = SRGBColorSpace;
      // globalRenderer.toneMapping = NoToneMapping;

      // globalRenderer.toneMapping = ACESFilmicToneMapping
      // globalRenderer.toneMapping = LinearToneMapping
      // globalRenderer.toneMapping = CineonToneMapping
      // globalRenderer.toneMapping = ReinhardToneMapping
      // globalRenderer.toneMappingExposure = 1.0;
      // globalRenderer.useLegacyLights = false;
      // globalRenderer.render(globalScene, globalCamera);

      // updateTexture()

      await setLightingEXR(globalRenderer);
      // await setLighting(globalRenderer)
      // globalStore.toggleLoadingCircle();
    };

    /* TEXTURE */
    let currentTexture = null;
    let upcomingTexture = null;
    // let currentTexture = { textures: [], name: "" };
    // let upcomingTexture = { textures: [], name: "" };
    async function computeTexture() {
      console.log("Computing texture");
      isFirstLoad = false;
      const baseTextureUrl = "/assets/label-textures-3";

      // load if not
      let jarTexturesLocal = [];
      for (const size of jarSizes) {
        console.log("Loading tex for size.");
        let textureUrl = `${baseTextureUrl}/${textureUrlSlugs.brand}/${textureUrlSlugs.productLine}/${size}/${textureUrlSlugs.flavour}_resized.png`;
        // console.log("url - > ", textureUrl)
        let texture = await loadTexture(textureUrl);
        texture.name = textureUrlSlugs.flavour;
        texture.flipY = false;
        texture.generateMipMaps = true;
        texture.needsUpdate = true;
        jarTexturesLocal.push({ texture, size, name: textureUrlSlugs.flavour });
      }

      return jarTexturesLocal;
    }

    // CLAUDE PROVIDED
    async function createTextureShader(previousTexture, nextTexture, clonedProperties) {
      // Copy glb mesh properties into shader
      previousTexture[0].texture.encoding = SRGBColorSpace;
      nextTexture[0].texture.encoding = SRGBColorSpace;

      // previousTexture[0].texture.colorSpace = SRGBColorSpace;
      // nextTexture[0].texture.colorSpace = SRGBColorSpace;
      let tempEnv = globalScene.environment;
      let originalMaterial = clonedProperties;
      let baseColor = originalMaterial.color;
      let roughness = originalMaterial.roughness;
      let metalness = originalMaterial.metalness;
      let material = new ShaderMaterial({
        uniforms: {
          currentTexture: { value: previousTexture[0].texture },
          nextTexture: { value: nextTexture[0].texture },
          transitionProgress: { value: 0 },
          envMap: { value: globalScene.environment },
          roughness: { value: roughness },
          metalness: { value: metalness },
          baseColor: { value: baseColor },
          envMapIntensity: { value: 1 },
          side: DoubleSide,
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying vec3 vWorldPosition;
          varying float vSide;

          void main() {
              vUv = uv;
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
              vWorldPosition = worldPosition.xyz;
              
              vec3 transformedNormal = normalMatrix * normal;
              vNormal = normalize(transformedNormal);
              
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              vViewPosition = -mvPosition.xyz;
              gl_Position = projectionMatrix * mvPosition;
              
              vSide = dot(transformedNormal, vViewPosition) > 0.0 ? -1.0 : 1.0;
          }
        `,
        fragmentShader: `
          #define PI 3.14159265359

          uniform float transitionProgress;
          uniform sampler2D currentTexture;
          uniform sampler2D nextTexture;
          uniform samplerCube envMap;
          uniform float roughness;
          uniform float metalness;
          uniform vec3 baseColor;
          uniform float envMapIntensity;

          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying float vSide;

          void main() {
              // Basic texture blending for the wipe effect
              float alpha = step(vUv.x, transitionProgress);
              vec4 texColorCurrent = texture2D(currentTexture, vUv);
              vec4 texColorNext = texture2D(nextTexture, vUv);
              vec4 texColor = mix(texColorCurrent, texColorNext, alpha);
              
              // Get base color with texture
              vec3 color = texColor.rgb;  // Removed baseColor multiplication for now
              
              // Basic lighting setup
              vec3 N = normalize(vNormal) * vSide;
              vec3 V = normalize(vViewPosition);
              vec3 R = reflect(-V, N);
              
              // Sample environment map
              vec3 envSample = textureCube(envMap, R).rgb;
              
              // Simplified lighting calculation
              float fresnel = pow(1.0 - max(dot(N, V), 0.0), 5.0);
              vec3 specularColor = mix(vec3(0.04), color, metalness);
              
              // Mix diffuse and specular
              vec3 diffuse = color * (1.0 - metalness);
              vec3 specular = envSample * mix(specularColor, vec3(1.0), fresnel);
              
              // Combine everything
              vec3 finalColor = (diffuse + specular * (1.0 - roughness)) * envMapIntensity;
              
              // Ensure we have some minimal lighting
              finalColor = max(finalColor, color * 0.2);  // Add ambient term
              
              gl_FragColor = vec4(finalColor, texColor.a);
          }
        `,

        transparent: true,
        alphaTest: 0.05,
        // Adjust this value as needed
      });

      let material2 = new ShaderMaterial({
        uniforms: {
          currentTexture: { value: previousTexture[1].texture }, // Start with the first texture
          nextTexture: { value: nextTexture[1].texture }, // Initially set to the second texture
          transitionProgress: { value: 0 }, // Transition not started
          envMap: { value: globalScene.environment },
          roughness: { value: roughness },
          metalness: { value: metalness },
          baseColor: { value: baseColor },
          envMapIntensity: { value: 1 },
          // exposure: {value: 0.2},
          side: DoubleSide,
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying vec3 vWorldPosition;
          varying float vSide;

          void main() {
              vUv = uv;
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
              vWorldPosition = worldPosition.xyz;
              
              vec3 transformedNormal = normalMatrix * normal;
              vNormal = normalize(transformedNormal);
              
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              vViewPosition = -mvPosition.xyz;
              gl_Position = projectionMatrix * mvPosition;
              
              vSide = dot(transformedNormal, vViewPosition) > 0.0 ? -1.0 : 1.0;
          }
        `,
        fragmentShader: `#define PI 3.14159265359

      uniform float transitionProgress;
      uniform sampler2D currentTexture;
      uniform sampler2D nextTexture;
      uniform samplerCube envMap;
      uniform float roughness;
      uniform float metalness;
      uniform vec3 baseColor;
      uniform float envMapIntensity;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying float vSide;

      void main() {
          // Basic texture blending for the wipe effect
          float alpha = step(vUv.x, transitionProgress);
          vec4 texColorCurrent = texture2D(currentTexture, vUv);
          vec4 texColorNext = texture2D(nextTexture, vUv);
          vec4 texColor = mix(texColorCurrent, texColorNext, alpha);
          
          // Get base color with texture
          vec3 color = texColor.rgb;  // Removed baseColor multiplication for now
          
          // Basic lighting setup
          vec3 N = normalize(vNormal) * vSide;
          vec3 V = normalize(vViewPosition);
          vec3 R = reflect(-V, N);
          
          // Sample environment map
          vec3 envSample = textureCube(envMap, R).rgb;
          
          // Simplified lighting calculation
          float fresnel = pow(1.0 - max(dot(N, V), 0.0), 5.0);
          vec3 specularColor = mix(vec3(0.04), color, metalness);
          
          // Mix diffuse and specular
          vec3 diffuse = color * (1.0 - metalness);
          vec3 specular = envSample * mix(specularColor, vec3(1.0), fresnel);
          
          // Combine everything
          vec3 finalColor = (diffuse + specular * (1.0 - roughness)) * envMapIntensity;
          
          // Ensure we have some minimal lighting
          finalColor = max(finalColor, color * 0.2);  // Add ambient term
          
          gl_FragColor = vec4(finalColor, texColor.a);
      }`,
        transparent: true,
        alphaTest: 0.05, // Adjust this value as needed
      });
      return [
        { material: material, size: previousTexture[0].size },
        { material: material2, size: previousTexture[1].size },
      ];
    }
    
    let firstTextureLoad = true;
    async function updateTexture() {
      globalStore.toggleLoadingCircle(true);
      isLoadingTexture = true;

      // console.log("URL SLUGS:", textureUrlSlugs.flavour)
      // console.log("URL SLUGS:", textureUrlSlugs.brand)
      // console.log("URL SLUGS:", textureUrlSlugs.productLine)
      // console.log("URL SLUGS:", textureUrlSlugs.size)
      if (!currentJarScene) {
        // console.log("EXITING")
        isLoadingTexture = false;
        return;
      }

      let clonedProperties = null;
      Object.values(labelMeshesClones).forEach((clone) => {
        clonedProperties = clone.material;
      });
      Object.values(labelMeshes).forEach((mesh) => {
        if (mesh.material && mesh.material.map) {
          // Dispose of the current texture to free up memory
          mesh.material.map.dispose();
        }
      });

      let textures = await computeTexture();
      let shaderTextures = null;
      // console.log("IF FOR CREATING SHADER", currentTexture, textureUrlSlugs.flavour)
      if (!currentTexture) {
        currentTexture = { textures, name: textureUrlSlugs.flavour };
        shaderTextures = await createTextureShader(
          currentTexture.textures,
          currentTexture.textures,
          clonedProperties
        );
      } else {
        // console.log("COMPARISON", currentTexture.name === textureUrlSlugs.flavour )
        if (!(currentTexture.name === textureUrlSlugs.flavour)) {
          // console.log("CREATING NEW SHADER TEXS", textures)
          upcomingTexture = { textures, name: textureUrlSlugs.flavour };
          shaderTextures = await createTextureShader(
            currentTexture.textures,
            upcomingTexture.textures,
            clonedProperties
          );
          currentTexture = { textures, name: textureUrlSlugs.flavour };
        }
      }
      // // // console.log("TEXTURES", shaderTextures, currentTexture, upcomingTexture)
      // console.log("LABEL MESHES", !!labelMeshes)
      // console.log("SHADER MATS", shaderTextures)
      if (labelMeshes) {
        let mesh1 = labelMeshes[shaderTextures[0].size];
        mesh1.material = shaderTextures[0].material;
        mesh1.material.side = DoubleSide;
        mesh1.material.needsUpdate = true;

        let mesh2 = labelMeshes[shaderTextures[1].size];
        mesh2.material = shaderTextures[1].material;
        mesh2.material.side = DoubleSide;
        mesh2.material.needsUpdate = true;

        globalStore.toggleLoadingCircle(false);
      }
      // labelMesh.material.map = texture;
      // labelMesh.material.needsUpdate = true;
      setTimeout(() => {
        isLoadingTexture = false;
      }, 250);
      // console.log("Before if for StartWipe", firstTextureLoad, startWipe.value)
      if (!firstTextureLoad) {
        // console.log("initiating startWipe", labelMeshes[jarSizes[0]].material.uniforms.transitionProgress.value)
        startWipe.value = true;
      } else {
        firstTextureLoad = false;
      }
    }

    /* Jar size*/
    const selectJarSize = async (size) => {
      console.log("Attempting selectJarSize");
      previousJarSize.value = currentJarSize.value;
      if (size === currentJarSize.value) {
        return;
      } else {
        textureUrlSlugs.size = size;
        // let texture = await loadTexture()
        // let movement = calculateJarMovement(currentJarScene)
        // await prepareSceneForSwitch(size, movement)
        // animateJarOut(currentJarScene, movement, texture)

        clipActions.forEach((action) => {
          animationState.get(clipActions[0]).isFinished = false;
          action.play();
          currentJarSize.value = size;
        });
        console.log("initiated obj ROTATION");
        initiateObjectRotation(globalScene, webGl.value, currentJarSize.value);
        console.log("CJS", currentJarSize.value);
        if (isMobile.value) {
          if (size === "450g") {
            console.log("Zooming out");
            animatingCamera = true;
            zoomOut(globalCamera, 1000, 1.1, cameraConfigsMobile);
            setTimeout(() => {
              animatingCamera = false;
            }, 1100);
          } else if (previousJarSize.value === "450g" && previousJarSize.value !== size) {
            console.log("Zooming in");
            animatingCamera = true;
            zoomIn(globalCamera, 1000, 1.1, cameraConfigsMobile);
            setTimeout(() => {
              animatingCamera = false;
            }, 1100);
          }
        }
      }
    };

    const updateCamera = (newWidth, newHeight) => {
      globalCamera.aspect = newWidth / newHeight;
      globalCamera.updateProjectionMatrix();
    };

    const updateRenderer = (newWidth, newHeight) => {
      globalRenderer.setSize(newWidth, newHeight);
      globalRenderer.render(globalScene, globalCamera);
    };
    const debouncedUpdateSize = debounce(function () {
      if (isMobile) return;
      updateContainerSize();
      if (containerWidth.value && containerHeight.value) {
        updateCamera(containerWidth.value, containerHeight.value);
        updateRenderer(containerWidth.value, containerHeight.value);
        getDistanceFromCanvas(globalScene.children[0].children[0]);
      }
    }, 600);

    // const debouncedJarPan = debounce(function(event) {
    //   rotateObject(event, currentJarScene)
    // }, 200)
    function updateContainerSize() {
      if (webGl.value && webGl.value.parentElement) {
        containerWidth.value = webGl.value.parentElement.clientWidth;
        containerHeight.value = webGl.value.parentElement.clientHeight;
      }
    }
    async function setLighting(renderer){
      let pmremGenerator = new PMREMGenerator( renderer );
      // let rgbeTexture = await new RGBELoader().loadAsync('/assets/HDR/garden.hdr')
      let rgbeTexture = await loadEnvironment('/assets/HDR/output2.hdr')
      var envMap = pmremGenerator.fromEquirectangular( rgbeTexture ).texture;
      globalScene.background = null;
      globalScene.environment = envMap;
      globalScene.environmentIntensity = 1.0;
      globalScene.toneMappingExposure = 1.0;
      rgbeTexture.dispose();
      pmremGenerator.dispose();
      pmremGenerator.compileEquirectangularShader();
    }
    async function setLightingEXR(renderer) {
      let pmremGenerator = new PMREMGenerator(renderer);
      let exrTexture = await new EXRLoader().loadAsync(
        "/assets/exr/brown_photostudio_02_1k.exr"
      );
      console.log("EXRTEX", exrTexture);
      let envMap = pmremGenerator.fromEquirectangular(exrTexture).texture;
      console.log(envMap.type);
      console.log(envMap.mapping);
      console.log("envMap", envMap);
      // envMap.intensity = 0.2;
      // pmremGenerator.compileEquirectangularShader();
      globalScene.background = null;
      globalScene.environment = envMap;
      globalScene.environmentIntensity = 1.0;
      globalScene.toneMappingExposure = 1.0;
      // // console.log("FINISHED SETTING LIGHTING ===========>")
      pmremGenerator.dispose();
      exrTexture.dispose();
    }

    const clock = new Clock();
    const clockTexture = new Clock();
    const testClock = new Clock();
    testClock.start();
    let isAnimating = false;
    let animateTextureChange = false;
    let startWipe = ref(false);
    let wipeStep = 0.01;
    let count = 0;
    const animate = () => {
      // console.count("animate called")
      if (!isAnimating) return;
      stats.begin();
      // if(labelTest){
      //   if(loadedText){ //Honey loadedTexture, apply oscillations based on time through shader.
      //     const elapsedTime = clockTexture.getElapsedTime();
      //     const linePosition = (Math.sin(elapsedTime) + 1) / 2; // Oscillate between 0 and 1
      //     labelTest.material.uniforms.linePosition.value = linePosition;
      //   }
      // }

      // let elapsedTimeHoney = clockTexture.getElapsedTime();
      // honeyMesh1.material.uniforms.time.value = elapsedTimeHoney;

      if (animatingCamera) {
        TWEEN.update();
      }

      if (startWipe.value) {
        // console.log("WIPING")
        // Assuming you start the transitionProgress at 0
        let label1 = labelMeshes[jarSizes[0]];
        let label2 = labelMeshes[jarSizes[1]];
        // // // console.log("WIPING", label1.material.uniforms.transitionProgress.value)
        label1.material.uniforms.transitionProgress.value += wipeStep;
        label2.material.uniforms.transitionProgress.value += wipeStep; // Adjust this rate as needed

        // Clamp the transition progress at 1 to stop the transition
        if (label1.material.uniforms.transitionProgress.value > 1) {
          // console.log("Progress done.")
          label1.material.uniforms.transitionProgress.value = 1;
          label2.material.uniforms.transitionProgress.value = 1;
          startWipe.value = false; // Stop the wipe effect
        }
      }
      if (rtObjects) {
        // Update any time-based uniforms to keep animations in sync
        if (honeyMeshes['300g'].material.uniforms && honeyMeshes['300g'].material.uniforms.time) {
          const elapsedTime = clockTexture.getElapsedTime();
          honeyMeshes['300g'].material.uniforms.time.value = elapsedTime;
          rtObjects.cylinderAClone.material.uniforms.time.value = elapsedTime;
        }
        
        renderCylinderAToTexture(globalRenderer, rtObjects, globalCamera, globalScene);
      }
      renderScene();
      // if(count%200 == 0){
      //   console.log("ENCODING:", composer.outputColorSpace, composer.outputEncoding, 
      //   composer.inputBuffer.texture, 
      //   composer.outputBuffer.texture,
      //   composer
      // )
      //   count++
      // }
      // console.log("Encoding", isLoading.value, composer.outputEncoding)
      let delta = clock.getDelta();
      if (!animationState.get(clipActions[0]).isFinished) {
        mixer.update(delta);
      }
      if (LOGTIMER === 0 && animationDONE) {
        LOGTIMER++;
      }

      stats.end();
      // globalOrbitControls.update();
      requestAnimationFrame(animate);
    };

    function toggleDebugVisuals() {
      const isDebugMode = !rtObjects.debugPlane.visible;
      toggleDebugMode(rtObjects, isDebugMode);
      console.log("Debug mode:", isDebugMode);
    }
    window.toggleRenderToTextureDebug = toggleDebugVisuals;
    function triggerTextureTransition(newTextureIndex) {
      // if (newTextureIndex === globalObj300g.material.uniforms.currentTextureIndex.value) {
      //     console.warn("Already displaying this texture.");
      //     return; // Avoid transitioning to the same texture
      // }
      newTextureIndex = 1;
      // Set the next texture index to the new target
      globalObj300g.material.uniforms.nextTextureIndex.value = newTextureIndex;

      // Flag to start the transition in the animation loop
      animateTextureChange = true;
    }

    function getDistanceFromCanvas(target) {
      const distanceToOrigin = globalCamera.position.distanceTo(target.position);
      // Ensure the camera and target are updated (important if anything has changed)
      globalCamera.updateMatrixWorld();
      globalCamera.updateProjectionMatrix();
      target.updateMatrixWorld();

      // Bounding box in world coordinates
      const box = new Box3().setFromObject(target);
      const size = new Vector3();
      const center = new Vector3();
      box.getSize(size);
      box.getCenter(center);

      // Project the center to NDC
      center.project(globalCamera);

      // Calculate screen coordinates of the center
      const widthHalf = 0.5 * globalRenderer.domElement.width;
      const centerScreenX = center.x * widthHalf + widthHalf;

      // Calculate the mesh width in screen space (approximate)
      const frustumHeight =
        2.0 * distanceToOrigin * Math.tan((globalCamera.fov * 0.5 * Math.PI) / 180);
      const frustumWidth = frustumHeight * globalCamera.aspect;
      const meshWidthScreen = (size.x / frustumWidth) * globalRenderer.domElement.width;

      // Calculate the left edge of the mesh in screen coordinates
      const leftEdgeScreenX = centerScreenX - meshWidthScreen / 2;

      // Ensure the distance is non-negative.
      const edgeDistance = Math.max(
        0,
        Math.min(leftEdgeScreenX, globalRenderer.domElement.width)
      );
      emitter.emit("meshEdges", { leftEdge: edgeDistance, rightEdge: edgeDistance });
    }

    let rtObjects = null;
    onMounted(async () => {
      await nextTick();
      updateContainerSize(); // Set initial size
      window.addEventListener("resize", debouncedUpdateSize);
      // webGl.value.parentElement.addEventListener('mousedown', debouncedJarPan);
      // webGl.value.parentElement.addEventListener('mousemove', )

      await setCanvas();
      await nextTick();

      //If composer fails or is commented out, revert to regular renderer
      let frontJarPosition = new Vector3();
      honeyMeshes['300g'].getWorldPosition(frontJarPosition)
      // composer = await addPostProcessing(globalRenderer, globalScene, globalCamera, frontJarPosition)
      // composer = await addNativePostProcessing(globalRenderer, globalScene, globalCamera, frontJarPosition)
      if (composer) {
        renderScene = () => composer.render();
      } else {
        renderScene = () => globalRenderer.render(globalScene, globalCamera);
      }
      // initializeEdges(globalScene.children[0]);
      await initiateObjectRotation(globalScene, webGl.value, currentJarSize.value);
      await nextTick();
      // getDistanceFromCanvas(globalScene.children[0].children[0])
      // initSliderInteraction();
      isAnimating = true;
      await renderMatcap()
      
      let rtObjects = null;
      await nextTick();
      animate();
    });

    onBeforeUnmount(() => {
      // stop animating, effectively stop requestAnimationFrame
      isAnimating = false;
    });
    onUnmounted(() => {
      window.removeEventListener("resize", debouncedUpdateSize);

      // animationMixer cleanup
      if (mixer) {
        mixer.stopAllAction();
        mixer.uncacheRoot(mixer.getRoot());
        mixer = null;
      }

      // dispose of stats.js
      if (stats && stats.dom && stats.dom.parentNode) {
        stats.dom.parentNode.removeChild(stats.dom);
      }

      // dispose all scene nodes/materials
      function disposeNode(node) {
        if (node.geometry) {
          node.geometry.dispose();
        }

        if (node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach((material) => disposeMaterial(material));
          } else {
            disposeMaterial(node.material);
          }
        }
      }

      function disposeMaterial(material) {
        Object.keys(material).forEach((prop) => {
          if (!material[prop]) return;
          if (material[prop] !== null && typeof material[prop].dispose === "function") {
            material[prop].dispose();
          }
        });
        material.dispose();
      }

      if (globalScene) {
        globalScene.traverse(disposeNode);
        globalScene = null;
      }

      // dispose renderer, force WebGL context loss
      if (globalRenderer) {
        const gl = globalRenderer.getContext();
        if (gl && gl.getExtension("WEBGL_lose_context")) {
          gl.getExtension("WEBGL_lose_context").loseContext();
        }
        globalRenderer.dispose();
        globalRenderer = null;
      }

      if (globalCamera) {
        globalCamera = null;
      }

      // threejs given cache clear method
      Cache.clear();

      // clear references
      currentJarScene = null;
      upcomingJarScene = null;
      jarScenes = {};
      currentJarLabel = null;
      upcomingJarLabel = null;
      globalPointLight = null;
      cameraHelper = null;
      axesHelper = null;
      initialLeftWorld = null;
      initialRightWorld = null;
      globalQuaternion = null;
      labelMeshes = null;
      globalObj300g = null;
      globalObj150g = null;
      // matcapMaterial = null;
      labelTest = null;
      clipActions = [];
      animationState.clear();

      // force garbage collection - only some browsers support this
      if (window.gc) {
        window.gc();
      }
    });

    watch(
      () => ({
        flavour: productStore.getFlavourSlug,
        productLine: productStore.getProductLineSlug,
        brand: productStore.getBrandSlug,
        size: currentJarSize.value,
      }),
      async (newValues) => {
        console.log(
          "Triggered hny params WATCHER:",
          JSON.parse(JSON.stringify(newValues))
        );
        // console.log("-------- old values", JSON.parse(JSON.stringify(textureUrlSlugs)))

        /* Logs for debugging */

        // console.log("JSIZES", jarSizes)
        // console.log("PROPS WATCHER ===============================");
        // console.log("newValues.flavour |", newValues.flavour, ";'\n'TUS.flavour |", textureUrlSlugs.flavour, ";'\n'comparison |", newValues.flavour !== textureUrlSlugs.flavour);
        // console.log("newValues.brand |", newValues.brand, ";'\n'TUS.brand |", textureUrlSlugs.brand, ";'\n'comparison |", newValues.brand !== textureUrlSlugs.brand);
        // console.log("newValues.productLine |", newValues.productLine, ";'\n'TUS.productLine |", textureUrlSlugs.productLine, ";'\n'comparison |", newValues.productLine !== textureUrlSlugs.productLine);
        // console.log("setting gramsize to :", newValues.size)
        // console.log("newValues.size |", newValues.size, ";'\n'TUS.size |", textureUrlSlugs.size, ";'\n'comparison |", gramSize !== textureUrlSlugs.size);
        // console.log("PROPS WATCHER ===============================");
        // console.log("Current Brand value:", currentBrand.value, newValues.brand !== currentBrand.value)

        //Set local size to grams, set global values of jar sizes
        let gramSize = newValues.size;
        currentJarSize.value = newValues.size;
        currentJarSizeGrams.value = gramSize;

        if (newValues.brand !== currentBrand.value) {
          console.log("Brand !== currentBrand");
          if (newValues.brand === "okto") {
            jarSizes = ["450g", "300g"];
            currentLoadedJars = ["450g", "300g"];
            frontJarSize = currentLoadedJars[1]; //300g is forefront on okto
            backJarSize = currentLoadedJars[0]; //450g is back on okto
            currentBrand.value = newValues.brand;
          } else {
            jarSizes = ["300g", "150g"];
            currentLoadedJars = ["300g", "150g"];
            frontJarSize = currentLoadedJars[0]; //300g is forefront on haa
            backJarSize = currentLoadedJars[1]; //150g is back on haa
            currentBrand.value = newValues.brand;
          }
        }

        if (
          newValues.brand !== textureUrlSlugs.brand ||
          gramSize !== textureUrlSlugs.size
        ) {
          textureUrlSlugs = {
            ...textureUrlSlugs,
            brand: newValues.brand,
            size: gramSize,
          };
          firstTextureLoad = true;
          // allCurrentTextures[newValues.productLine] = await loadAllTextures(newValues.productLine);
        }

        if (newValues.productLine !== textureUrlSlugs.productLine) {
          textureUrlSlugs = {
            ...textureUrlSlugs,
            productLine: newValues.productLine,
          };
          // firstTextureLoad = true
          // console.log("FTL", firstTextureLoad)

          // allCurrentTextures[newValues.productLine] = await loadAllTextures(newValues.productLine);
        }

        if (newValues.flavour !== textureUrlSlugs.flavour) {
          textureUrlSlugs = {
            ...textureUrlSlugs,
            flavour: newValues.flavour,
          };
          // updateTexture();
          // allCurrentTextures = await loadAllTextures()
        }
      },
      {
        immediate: true,
        deep: true,
      }
    );

    return {
      webGl,
      sceneContainer,
      currentJarSize,
      currentBrand,
      selectJarSize,
      updateTexture,
      changeMat,
      matcapId,
      renderMatcap,
      matcapType,
      jarSmall,
      jarMedium,
      isLoading,
      triggerTextureTransition,
      startWipe,
      cycleColors,
      currentHType,
    };
  },
};
</script>

<style lang="scss" scoped>
.scene-container {
  position: relative;
  width: 100%;
  height: 80%;
  @media (max-width: 767px) {
    height: 100% !important;
    min-height: 300px !important;
    display: flex;
    flex-direction: column;
  }
}
.reset-button {
  position: absolute;
  top: 5%;
  right: 10%;
  background: none;
  // border: 1px solid gray;
  outline: none !important;
  border: none !important;
  color: #000;
  &:hover,
  &:active {
    font-weight: 700;
  }
}
.size-selection {
  display: flex;
  width: 100%;
  justify-content: center;
  position: absolute;
  z-index: 2000000;
  bottom: 0%;
  button:not(:last-child) {
    margin-right: 15px;
  }
  button {
    color: #000;
    font-family: "DMSans";
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    letter-spacing: 2.72px;
    text-transform: uppercase;
    background: transparent;
    outline: none !important;
    border: none !important;
    &:hover,
    &:active {
      font-weight: 700;
      transition: font-weight ease-in-out 0.15s;
    }
    &.selected {
      font-weight: 700;
      // background: red;
    }
  }
}
.webGl {
  width: 100%;
  height: 100%;
  @media (max-width: 767px) {
    // min-height: 350px;
    margin-bottom: 30px;
  }
}
.loading-indicator-container {
  width: 100%;
  height: 100%;
  @media (max-width: 767px) {
    // min-height: 350px;
    margin-bottom: 30px;
    flex-grow: 1;
  }
}
// .slider-container{
//   width: 100%;
//   height: 100%;
//   position: absolute;
//   .slider{
//     position: absolute;
//     cursor: ew-resize;
//     width: 40px;
//     height: 40px;
//     background-color: #F32196;
//     opacity: 0.7;
//     border-radius: 50%;
//     top: calc(50% - 20px);
//     left: calc(50% - 20px);
//     z-index: 20000;
//   }
// }
</style>
