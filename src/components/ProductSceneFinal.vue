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
      <!-- <button @click="changeHoneyShader()">CYCLE HONEY TYPE: {{ currentHType }}</button> -->
      <button
        @click="selectJarSize('300g')"
        :class="currentJarSize === '300g' ? 'selected' : ''"
        class="medium-jar"
      >
        300g
      </button>
      <button @click="addBox()">ADD BOX</button>
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

    <div class="searchtarget" style="position: absolute; top: 0%; left: -50%; display: flex; width: 55%">
      <!-- <UniformEditor :honeyMeshes="tempHoneyMeshes" /> -->
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
  WebGLRenderTarget,
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
  reactive
} from "vue";
import { useProductStore } from "@/store/product.js";
import { useGlobalStore } from "@/store/global.js";

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
import { initiateObjectRotation, startAutoRotation } from "@/helpers/3DObjectPan.js";
import { initCameraParallax, updateCameraParallax } from '@/helpers/Parallax.js';
import { getDistanceToRightEdge } from "../helpers/JarScene/ObjectToCanvasEdgeDistance.js";
import { debounce, parabolicPathCoordinate } from "@/helpers/globalFunctions.js";

import { updateCrossFades, crossFadeMesh } from "../helpers/JarScene/CrossFadeMaterials.js";
import { crossFadeTasks } from "../helpers/JarScene/CrossFadeTasks.js";

import PositionSliders from "./PositionSliders.vue";
import LoadingIndicator from "./LoadingIndicator.vue";
import { performanceMonitor, memoryMonitor } from "../helpers/WebGLCapabilities/performanceMonitor.js";

//ShaderMaterial imports
//Honey
import {
  oldHoneyMaterial,
  playfulMaterial2,
  playfulMaterial3,
  playfulMaterial4,
  playfulMaterial5
} from "../helpers/JarScene/HoneyMaterials.js";

import { createLabelMaterial } from "../helpers/JarScene/LabelMaterials.js";
import { createWipeMaterial } from "../helpers/JarScene/LabelMaterials2.js";

// import UniformEditor from "./UniformEditor.vue";

//Label

/* "ENUMS" */
// IMPORTANT: JAR HEIGHTS and WIDTHS are 0.3 < n < 1 in World Scale //

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

export default {
  setup() {
    let composer = null; // addPostprocessing, animate
    let renderScene;

    let jarMedium = ref([]);
    let jarSmall = ref([]);

    let isLoading = ref(false);
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
    let currentJarSize = ref('450g');
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
      if (alreadyLoadedProductLines.length) {
        // console.log("HUH");
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
      // // // // console.log("BRAND CONFIGS", brandConfigs[textureUrlSlugs.brand.toUpperCase()].brandProductLines['Monoflorals'].flavours)
      let tempFlavors =
        brandConfigs[textureUrlSlugs.brand.toUpperCase()].brandProductLines["Monoflorals"]
          .flavours;

      await loadAllTextures();

      loadedText = true;
    }

    let matcapType = ref(true);

    async function renderMatcap() {
      console.log("RENDERING MATCAP", textureUrlSlugs.flavour)
      await changeHoneyShader(textureUrlSlugs.flavour);
      honeyShaderInitialized = true
      console.log("222222222222222222", honeyShaderInitialized)
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

    // Replace changeMatcapFinal with a new function that uses createComplexMaterialOptions

    let tempHoneyMeshes = ref({})
    let honeyShaderInitialized = false;
    async function changeHoneyShader(type = "cotton_honey", id, color) {
      console.log("About to revert POS", globalScene)
      await revertScenePosition(globalScene, globalCamera);
      // console.log("1. Will move to pos");
      const offset = await moveSceneToGridPosition(globalScene, globalCamera, honeyMesh1.position, type);
      // console.log("2. Moved to POS");
      const honeyMaterials = {
        [jarSizes[0]]: await playfulMaterial5(
          globalTextureLoader,
          globalScene.environment,
          type,
          jarSizes[0],
          honeyMeshes,
          currentBrand.value,
          globalCamera,
          globalScene
        ),
        [jarSizes[1]]: await playfulMaterial5(
          globalTextureLoader,
          globalScene.environment,
          type,
          jarSizes[1],
          honeyMeshes,
          currentBrand.value,
          globalCamera,
          globalScene
        ),
      };

      // console.log("Materials:", honeyMaterials);
      console.log("HONEYMESHES:::::", honeyMeshes);
      Object.values(honeyMeshes).forEach((mesh) => {
        mesh.material = honeyMaterials[mesh.size];
        mesh.material.needsUpdate = true;
        console.log("Attempting to crossfade: ", mesh.name)
        console.log("using material: ", honeyMaterials[mesh.size])
        // crossFadeMesh(mesh, honeyMaterials[mesh.size], globalScene, 0.5);
      });
      tempHoneyMeshes.value = honeyMeshes

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
    let updateParallax;
    const setCanvas = async () => {
      globalStore.toggleLoadingCircle(true);
      let tempSize = frontJarSize.value || "300g"; //values used are in grams

      // Create Scene
      isLoading.value = true;
      globalScene = new Scene();

      // let sceneUrl =
      //   currentBrand.value === "okto"
      //     ? '/assets/glb/300-450-baked-2.glb':
      //       // '/assets/glb/newJars/450-300-animation-choppy-v2.glb':
      //       // '/assets/glb/newJars/uvfixed4.glb':
      //       "/assets/glb/newJars/300-150-animation-choppy-v6.glb";

      let sceneUrl =
        currentBrand.value === "okto"
          ? "/assets/glb/300-450-v3.glb"
          : // '/assets/glb/newJars/uvfixed4.glb':
            // '/assets/glb/newJars/450-300-animation-choppy-v2.glb':
            // '/assets/glb/newJars/uvfixed4.glb':
            // "/assets/glb/300-150-v2.glb";
            "/assets/glb/300-150-v3.glb";
            // "/assets/glb/150-300-2.glb";
      let sceneParts = await loadGlbReturnParts(loader, sceneUrl);
      // console.log("SceneParts:", sceneParts)
      
      // reference to mesh within loaded Scene - changes affect scene directly
      labelMeshes = sceneParts.labelMeshes;
      glassMeshes = sceneParts.glassMeshes;
      labelMeshesClones = sceneParts.labelMeshesClones;
      honeyMeshes = sceneParts.honeyMeshes;
      honeyMesh1 = honeyMeshes["300g"];
      honeyMesh2 = honeyMeshes["450g"];
      // // console.log("MESHBOX", meshBox)
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
            obj.material.roughness = 0.01;
            obj.material.transparent = true;
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


      globalCamera = new PerspectiveCamera(25, aspectRatio.value, 0.001, 1);
      let axesHelper2 = new AxesHelper(5);
      axesHelper2.setColors("blue", "green", "red");
      // targetMesh.add(axesHelper2)
      globalCamera.position.set(0.35, 0.06, 0); // Position the camera in front of the mesh
      globalCamera.lookAt(0, 0.06, 0);
      globalScene.add(globalCamera);

      // updateParallax = initCameraParallax(globalCamera, new Vector3(0, 0.06, 0), {
      //   intensity: 0.005,
      //   damping: 0.008,
      //   bounds: 0.03
      // });
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
        // maxSamples: 8
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

      updateTexture()

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
      // console.log("Computing texture");
      isFirstLoad = false;
      const baseTextureUrl = "/assets/label-textures-3";

      // load if not
      let jarTexturesLocal = [];
      for (const size of jarSizes) {
        // console.log("Loading tex for size.");
        let textureUrl = `${baseTextureUrl}/${textureUrlSlugs.brand}/${textureUrlSlugs.productLine}/${size}/${textureUrlSlugs.flavour}_resized.png`;
        // // console.log("url - > ", textureUrl)
        let texture = await loadTexture(textureUrl);
        texture.name = textureUrlSlugs.flavour;
        texture.flipY = false;
        texture.generateMipMaps = true;
        texture.needsUpdate = true;
        texture.colorSpace = SRGBColorSpace;
        // console.log("TEXTURE:", texture)
        jarTexturesLocal.push({ texture, size, name: textureUrlSlugs.flavour });
      }

      return jarTexturesLocal;
    }

    async function addBox() {
      if(isMobile.value) return
      // console.log("ADDING BOX +=++++++++++++++++++++++++++++++++++++++++++++++++++++",labelMeshes['450g'])
      let distance = await getDistanceToRightEdge(labelMeshes['450g'], globalCamera, globalRenderer)
      // console.log("DISTANCE", globalScene.children[0].children[0])
      // let newBoxHelper = new BoxHelper(globalScene.children[0].children[0])
      // newBoxHelper.update();
      // globalScene.add(newBoxHelper)
      // globalScene.add(distanceObj.boxHelper)
      emitter.emit("meshEdges", { leftEdge: 0, rightEdge: distance})
    }

    let firstTextureLoad = true;
    async function updateTexture() {
      globalStore.toggleLoadingCircle(true);
      isLoadingTexture = true;

      if (!currentJarScene) {
        isLoadingTexture = false;
        return;
      }

      let clonedProperties = null;
      Object.values(labelMeshesClones).forEach((clone) => {
        // console.log("Clone MAT:", clone.geometry.attributes.uv)
        clonedProperties = clone.material;
      });
      Object.values(labelMeshes).forEach((mesh) => {
        if (mesh.material && mesh.material.map) {
          mesh.material.map.dispose();
        }
      });

      let textures = await computeTexture();
      let shaderTextures = null;
      // // console.log("CLONED PROPS____________", clonedProperties)
      if (!currentTexture) {
        currentTexture = { textures, name: textureUrlSlugs.flavour };
        // Pass environment map from globalScene
        shaderTextures = await createWipeMaterial(
            currentTexture.textures,
            currentTexture.textures,
            globalScene.environment,
            clonedProperties,
        );
        // shaderTextures = await createTextureShader(
        //   currentTexture.textures,
        //   currentTexture.textures,
        //   clonedProperties
        // );
      } else {
        if (!(currentTexture.name === textureUrlSlugs.flavour)) {
          upcomingTexture = { textures, name: textureUrlSlugs.flavour };
          // shaderTextures = await createTextureShader(
          //   currentTexture.textures,
          //   upcomingTexture.textures,
          //   clonedProperties
          // );
          // Pass environment map from globalScene
          shaderTextures = await createWipeMaterial(
            currentTexture.textures,
            upcomingTexture.textures,
            globalScene.environment,
            clonedProperties,
          );
          currentTexture = { textures, name: textureUrlSlugs.flavour };
        }
      }

      if (labelMeshes && shaderTextures) {
        // Apply materials to each mesh based on size
        shaderTextures.forEach(({ size, material }) => {
          if (labelMeshes[size]) {
            const mesh = labelMeshes[size];
            mesh.material = material;
            mesh.material.needsUpdate = true;
          }
        });

        globalStore.toggleLoadingCircle(false);
      }
      
      setTimeout(() => {
        isLoadingTexture = false;
      }, 250);
      
      if (!firstTextureLoad) {
        startWipe.value = true;
      } else {
        firstTextureLoad = false;
      }
    }

    /* Jar size*/
    const selectJarSize = async (size) => {
      // console.log("Attempting selectJarSize");
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
        // console.log("initiated obj ROTATION", currentJarSize.value);
        initiateObjectRotation(globalScene, webGl.value, currentJarSize.value);
        // console.log("CJS", currentJarSize.value);
        if (isMobile.value) {
          if (size === "450g") {
            // console.log("Zooming out");
            animatingCamera = true;
            zoomOut(globalCamera, 1000, 1.1, cameraConfigsMobile);
            setTimeout(() => {
              animatingCamera = false;
            }, 1100);
          } else if (previousJarSize.value === "450g" && previousJarSize.value !== size) {
            // console.log("Zooming in");
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
        // getDistanceFromCanvas(globalScene.children[0].children[0]);
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
      let rgbeTexture = await loadEnvironment('/assets/HDR/output-2.hdr')
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
      // console.log("EXRTEX", exrTexture);
      let envMap = pmremGenerator.fromEquirectangular(exrTexture).texture;
      // console.log(envMap.type);
      // console.log(envMap.mapping);
      // console.log("envMap", envMap);
      // envMap.intensity = 0.2;
      // pmremGenerator.compileEquirectangularShader();
      globalScene.background = null;
      globalScene.environment = envMap;
      globalScene.environmentIntensity = 0.85;
      globalScene.toneMappingExposure = 1.0;
      // // // console.log("FINISHED SETTING LIGHTING ===========>")
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
    let wipeStep = 0.05;
    let count = 0;
  
    const animate = (time) => {
      if (!isAnimating) return;
      
      const performanceOK = performanceMonitor.update(time);
      const memoryOK = memoryMonitor.check(time);
      // console.log("performanceOK", performanceOK)
      // console.log("memoryOK", memoryOK)
      if (animatingCamera) {
        TWEEN.update();
      }

      if (startWipe.value) {
        let label1 = labelMeshes[jarSizes[0]];
        let label2 = labelMeshes[jarSizes[1]];
        label1.material.userData.transitionProgress.value += wipeStep;
        label2.material.userData.transitionProgress.value += wipeStep;
        if (label1.material.userData.transitionProgress.value > 1) {
          label1.material.userData.transitionProgress.value = 1;
          label2.material.userData.transitionProgress.value = 1;
          startWipe.value = false; // Stop the wipe effect
        }
      }

      renderScene();
      let delta = clock.getDelta();
      if (!animationState.get(clipActions[0]).isFinished) {
        mixer.update(delta);
      }

      // const now = performance.now();
      // updateCrossFades(now);

      // updateParallax(globalCamera, new Vector3(0, 0.06, 0));
      requestAnimationFrame(animate);
    };

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

    onMounted(async () => {

      // emitter.on('rotatingJar', (flag) => {
      //   isAnimating = flag
      // })
      await nextTick();
      updateContainerSize(); // Set initial size
      window.addEventListener("resize", debouncedUpdateSize);
      // webGl.value.parentElement.addEventListener('mousedown', debouncedJarPan);
      // webGl.value.parentElement.addEventListener('mousemove', )

      await setCanvas();
      await nextTick();

      //If composer fails or is commented out, revert to regular renderer
      let frontJarPosition = new Vector3();
      let backJarPos = new Vector3();
      
      if(productStore.getBrandSlug === 'haa'){
        honeyMeshes['150g'].getWorldPosition(frontJarPosition)
      } else{
        honeyMeshes['450g'].getWorldPosition(frontJarPosition)
      } 
      honeyMeshes['300g'].getWorldPosition(backJarPos)
      composer = await addPostProcessing(globalRenderer, globalScene, globalCamera, frontJarPosition, backJarPos)
      // composer = await addNativePostProcessing(globalRenderer, globalScene, globalCamera, frontJarPosition)
      if (composer) {
        renderScene = () => composer.render();
      } else {
        renderScene = () => globalRenderer.render(globalScene, globalCamera);
      }
      // initializeEdges(globalScene.children[0]);
      console.log("Current Jar size: ", currentJarSize.value)
      await initiateObjectRotation(globalScene, webGl.value, currentJarSize.value);
      startAutoRotation();
      await nextTick();
      // getDistanceFromCanvas(globalScene.children[0].children[0])
      // initSliderInteraction();
      isAnimating = true;
      console.log("Gonna CALL RENDER MATCAP", globalScene)
      await renderMatcap()
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
        // // console.log("-------- old values", JSON.parse(JSON.stringify(textureUrlSlugs)))

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
        console.log("WATCHERJARSIZEEEEEEEE", newValues.size, currentJarSize.value)
        if (newValues.brand !== currentBrand.value) {
          // console.log("Brand !== currentBrand");
          if (newValues.brand === "okto") {
            jarSizes = ["450g", "300g"];
            currentLoadedJars = ["450g", "300g"];
            frontJarSize = currentLoadedJars[1]; //300g is forefront on okto
            backJarSize = currentLoadedJars[0]; //450g is back on okto
            currentBrand.value = newValues.brand;
            currentJarSize.value = '450g'
          } else {
            jarSizes = ["300g", "150g"];
            currentLoadedJars = ["300g", "150g"];
            frontJarSize = currentLoadedJars[0]; //300g is forefront on haa
            backJarSize = currentLoadedJars[1]; //150g is back on haa
            currentBrand.value = newValues.brand;
            currentJarSize.value = '150g'
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
          // // console.log("FTL", firstTextureLoad)

          // allCurrentTextures[newValues.productLine] = await loadAllTextures(newValues.productLine);
        }

        if (newValues.flavour !== textureUrlSlugs.flavour) {
          textureUrlSlugs = {
            ...textureUrlSlugs,
            flavour: newValues.flavour,
          };
          updateTexture();
          if(honeyShaderInitialized){
            await changeHoneyShader(newValues.flavour);
            setTimeout( async () => {
              await addBox()
            }, 1500)
          }
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
      tempHoneyMeshes,
      addBox
    };
  },
};
</script>

<style lang="scss" scoped>
.scene-container {
  position: relative;
  width: 100%;
  height: 80%;
  @media (max-width: 768px) {
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
  z-index: 2000000;
  position: absolute;
  bottom: 0%;
  @media(max-width: 1024px) and (min-width: 768px){
    bottom: -10%;
  }
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
  @media (max-width: 1024px) {
    // min-height: 350px;
    margin-bottom: 30px;
  }
}
.loading-indicator-container {
  width: 100%;
  height: 100%;
  @media (max-width: 768px) {
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
