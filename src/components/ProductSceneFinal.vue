<template>
  <div class="scene-container" ref="sceneContainer">

    <canvas v-show="!isLoading" ref="webGl" class="webGl" />
    <LoadingIndicator style="width: 100px; height: 100px;" v-if="isLoading" class="jar-loading"/>

    <!-- <button class="reset-button" @click="resetScene">X</button> -->

    <div class="size-selection">
      <button v-if="currentBrand === 'okto'" @click="selectJarSize('450g')" :class="currentJarSize === '450g' ? 'selected': ''" class="large-jar">
        450g
      </button>
      <button @click="selectJarSize('300g')" :class="currentJarSize === '300g' ? 'selected': ''" class="medium-jar">
        300g
      </button>
      <button v-if="currentBrand !== 'okto'" @click="selectJarSize('150g')" :class="currentJarSize === '150g' ? 'selected': ''" class="small-jar">
        150g
      </button>
      <!-- <button @click="startWipe = !startWipe" style="position:absolute; top: 80%; left: 50%;">TEXTURE</button> -->
    </div>

    <div style="position: absolute; top: 0%; left: -50%; display: flex; width: 55%;">
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
  CubeCamera,
  WebGLCubeRenderTarget,
  BackSide,
  BoxGeometry,
  SRGBColorSpace,
  WebGLRenderTarget,
  CubeTexture,
  CanvasTexture,
  EquirectangularReflectionMapping,
  DoubleSide
} from "three";

import { watch, onMounted, onUnmounted, onBeforeUnmount,  ref, computed, nextTick, inject, toRaw  } from "vue";
import { get, objectEntries, useWindowSize } from "@vueuse/core";
import { useProductStore } from '@/store/product.js';
import { useGlobalStore } from '@/store/global.js'
import { storeToRefs } from 'pinia'

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import brandConfigs from "@/assets/brand-information/index.js"
// let brandSizes = {}

//Loader imports
import {
  initializeGLTFLoader,
  loadGlb,
  loadGlbReturnParts,
  loadTexture,
  loadEnvironment
} from '@/helpers/loaders.js'

//Animation imports
import {
  initializeMixer,
  setupAnimations
} from '@/helpers/AnimationControls.js'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

import { debounce, parabolicPathCoordinate } from '@/helpers/globalFunctions.js'
import { initiateObjectRotation } from '@/helpers/3DObjectPan.js'


import Stats from "stats.js";
import PositionSliders from "./PositionSliders.vue";
import LoadingIndicator from "./LoadingIndicator.vue";


/* "ENUMS" */
// IMPORTANT: JAR HEIGHTS and WIDTHS are 0.3 < n < 1 in World Scale //
const jarConfigs = Object.freeze({
  "150g":   { name: "150g", source: "/assets/glb/jar-150g-v8.glb", position: {
    x: 0,
    y: 0,
    z: 0.02,
  } },
  "300g":  { name: "300g", source: "/assets/glb/jar-300g-v4.glb", position: {
    x: 0,
    y: 0,
    z: 0.02,
  } },
  "400g": { name: "400g", source: "/assets/glb/jar-450g-v4.glb", position: {
    x: 0,
    y: 0,
    z: 0.02,
  }  }
});

const cameraConfigs = Object.freeze({
  x: 0.35,
  y: 0.06,
  z: 0
  // x: 0.56,
  // y: 0,
  // z: 0.045
})
const cameraConfigsMobile = Object.freeze({
  x: 0.25,
  y: 0.06,
  z: 0
})

Cache.enabled = true;

export default {
  setup() {
    let jarMedium = ref([]);
    let jarSmall = ref([]);


    let isLoading = ref(false)
    //--------------------------------------------------------- DELETE ABOVE
    let stats = new Stats();
    //ref to canvas, window size
    stats.showPanel(0);
    // document.body.appendChild(stats.dom)
    let emitter = inject('emitter')

    let globalOrbitControls;

    const webGl = ref();
    const sceneContainer = ref();
    const productStore = useProductStore();

    //Loading Circle
    const globalStore = useGlobalStore()

    let textureUrlSlugs = {
      brand: 'haa',
      productLine: 'monoflorals',
      size: '300g',
      flavour: 'fir_limited',
      fileType: 'png'
    }
    let jarTextures = {};
    let currentBrand = ref('')

    const containerWidth = ref(0);
    const containerHeight = ref(0);

    const aspectRatio = computed(() => {
      // // // console.log("COMPUTING AR")
      return containerWidth.value / containerHeight.value;
    });
    
    /*Loaders + configuration of loaders*/
    const loader = initializeGLTFLoader(true, true, true) //args: draco, ktx2, meshopt decoder

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
    let tempScene = ref(new Scene())
    watch(() => globalScene, (newValue) => {
      // // // console.log("NEW VALUE", newValue)
      tempScene.value = globalScene
    })
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
    let currentJarSizeGrams = ref(null);
    let upcomingJarSize = ref('');
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
    let globalTextureLoader = new TextureLoader()
    const { isMobile } = inject('screenSize')


///////////////////////////

    // function sampleEnvironmentMap(direction) {
    //     // Create a temporary scene and camera
    //     const tempScene = new Scene();
    //     const tempCamera = new CubeCamera(0.1, 10, 1);
    //     // // // console.log(!!globalScene.environment)
    //     tempScene.background = globalScene.environment;

    //     // Update the cube camera to the position we want to sample
    //     tempCamera.position.copy(direction);
    //     tempCamera.update(globalRenderer, tempScene);

    //     // Create a render target
    //     const renderTarget = new WebGLRenderTarget(1, 1);

    //     // Render the scene
    //     globalRenderer.setRenderTarget(renderTarget);
    //     globalRenderer.render(tempScene, tempCamera);

    //     // Read the pixel value
    //     const pixelBuffer = new Uint8Array(4);
    //     globalRenderer.readRenderTargetPixels(renderTarget, 0, 0, 1, 1, pixelBuffer);

    //     // Convert to normalized RGB
    //     const color = new Color(
    //         pixelBuffer[0] / 255,
    //         pixelBuffer[1] / 255,
    //         pixelBuffer[2] / 255
    //     );

    //     // Clean up
    //     renderTarget.dispose();

    //     return color;
    // }


/////////////////////



    async function loadAllTextures(){
      // // console.log(textureUrlSlugs)
      // // console.log("TEXTURE URL SLUGS", brandConfigs[textureUrlSlugs.brand.toUpperCase()])
      let tempFlavors = brandConfigs['Okto'].brandProductLines['Monoflorals'].flavours
      let allTextures = []
      for (let i = 0; i<5; i++) {
        // // // console.log("Loading texture:", tempFlavors[i].urlSlug)
        let tempTexture = await loadTexture(`/assets/label-textures-2/okto/monoflorals/300g/${tempFlavors[i].urlSlug}.png`)
        // // // console.log("FINISHED LOADING")
        tempTexture.name = tempFlavors[i].urlSlug
        tempTexture.flipY = false
        allTextures.push(tempTexture)
      }
      return allTextures
    }
    async function changeMat(){
      // let textureLoad = await loadTexture('/assets/label-textures-2/haa/monoflorals/300g/fir_limited.png')
      // textureLoad.flipY = false;
      // let textureLoad2 = await loadTexture('/assets/label-textures-2/haa/monoflorals/300g/pine_limited.png')
      // textureLoad2.flipY = false;
      // // // console.log("BRAND CONFIGS", brandConfigs[textureUrlSlugs.brand.toUpperCase()].brandProductLines['Monoflorals'].flavours)
      let tempFlavors = brandConfigs[textureUrlSlugs.brand.toUpperCase()].brandProductLines['Monoflorals'].flavours

      
      await loadAllTextures();
      
      loadedText = true
    }

    let matcapType = ref(true);
    

    function renderMatcap(){
      changeComplexMatcap()
      return
    }

    let tempColor;


    async function testMaterial(
      id
    ) {
      
      // // console.log("Creating material")
      // const idl = 11
      // const fixedGridPositionl = new Vector3(-0.55, 0.1, 0)
      // const densityl = 9.06;
      // const lightl = 0.7;
      // const viscosityl = 0.82
      // const hPositionl =  0.50
      // const hIntensityl = 0.50
      // const envMapIntensityl = 1.00
      // const viscosityWavinessl = 20.00
      const idl = 12
      const fixedGridPositionl = new Vector3(
    0.6325000000000001,
    0.23,
    0)
      const densityl = 9.68;
      const lightl = 0.32;
      const viscosityl = 0.85
      const hPositionl =  0.50
      const hIntensityl = 0.50
      const envMapIntensityl = 1.00
      const viscosityWavinessl = 17.00
      // // // // console.log("Creating material with parameters:", 
      //   idl,
      //   densityl, 
      //   lightl, 
      //   viscosityl, 
      //   hPositionl, 
      //   hIntensityl, 
      //   envMapIntensityl, 
      //   viscosityWavinessl,
      //   fixedGridPositionl
      // )
      try {
        const matcapTexture = await globalTextureLoader.loadAsync(`/assets/matcaps/${idl}.png`);
        // // // console.log("TEXTURETEXTURE", matcapTexture)

        // // // console.log("Environment map:", globalScene.environment);

        // let testColor = new Color("#c17710");
        let testColor = new Color("#fbac23");
        let material = new ShaderMaterial({
        uniforms: {
          matcap: { value: matcapTexture },
          colorAdjust: { value: testColor },
          time: { value: 0 },
          envMap: { value: globalScene.environment },
          IOR: { value: densityl },
          subSurfaceScatter: { value: lightl },
          viscosity: { value: viscosityl },
          viscosityWaviness: { value: viscosityWavinessl },
          highlightPosition: { value: hPositionl },
          highlightIntensity: { value: hIntensityl },
          envMapIntensity: { value: envMapIntensityl },
          fixedGridPosition: { value: fixedGridPositionl } // New uniform
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          uniform vec3 fixedGridPosition;

          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D matcap;
          uniform vec3 colorAdjust;
          uniform vec3 fixedGridPosition;
          uniform float time;
          uniform samplerCube envMap;
          uniform float envMapIntensity;
          uniform float IOR;
          uniform float subSurfaceScatter;
          uniform float viscosity;
          uniform float highlightIntensity;
          uniform float highlightPosition;
          uniform float viscosityWaviness;

          varying vec3 vNormal;
          varying vec3 vViewPosition;

          //OLD
          // vec3 getEnvironmentReflection(vec3 viewDir, vec3 normal) {
          //   vec3 reflectVec = reflect(viewDir, normal);
          //   vec3 envMapCoord = fixedGridPosition + reflectVec * 20.0;
          //   return textureCube(envMap, envMapCoord).rgb;
          // }

          vec3 getEnvironmentReflection(vec3 viewDir, vec3 normal) {
            vec3 reflectVec = reflect(viewDir, normal);
            // Use fixedGridPosition to determine the sampling direction, not as an offset
            vec3 samplingDir = normalize(fixedGridPosition + reflectVec);
            return textureCube(envMap, samplingDir).rgb;
          }

          void main() {
            vec3 viewDir = normalize(vViewPosition);
            vec3 normal = normalize(vNormal);

            // Refraction
            vec3 refractColor = refract(viewDir, normal, 1.0 / IOR);
            vec2 matcapUV = refractColor.xy * 0.5 + 0.5;
            vec3 matcapColor = texture2D(matcap, matcapUV).rgb;

            // Check matcapColor
            if (any(isnan(matcapColor)) || any(isinf(matcapColor))) {
              gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
              return;
            }

            // Environment reflection
            vec3 reflColor = getEnvironmentReflection(viewDir, normal) * envMapIntensity;

            // Check reflColor
            if (any(isnan(reflColor)) || any(isinf(reflColor))) {
              gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
              return;
            }

            // Fresnel effect
            float fresnelPower = 3.0;
            float fresnel = pow(1.0 - dot(viewDir, normal), fresnelPower);

            // Subsurface scattering
            vec3 scatterColor = colorAdjust * (1.0 - fresnel) * subSurfaceScatter;

            // Viscosity effect
            // float viscosityEffect = sin(time * viscosityWaviness) * viscosity;
            //OLD
            float viscosityEffect = sin(fixedGridPosition.y * viscosityWaviness + time * 0.1) * viscosity;
            matcapColor += vec3(viscosityEffect);

            // Vertical highlight
            // float verticalHighlight = smoothstep(highlightPosition - 0.1, highlightPosition + 0.1, fract(time * 0.1));
            //OLD
            float verticalHighlight = smoothstep(highlightPosition - 0.1, highlightPosition + 0.1, abs(fixedGridPosition.y));
            verticalHighlight = pow(verticalHighlight, 2.0) * highlightIntensity * 2.0;

            // Blend colors
            vec3 baseColor = mix(matcapColor, reflColor, fresnel * 0.8);
            vec3 finalColor = mix(baseColor, colorAdjust, 0.5);
            finalColor += scatterColor;
            finalColor += vec3(verticalHighlight);

            // Color depth simulation
            // float depth = 0.5 + sin(time * 0.1) * 0.5;
            //OLD
            float depth = (fixedGridPosition.y + 1.0) * 0.5;
            finalColor *= mix(vec3(1.0), colorAdjust, depth);

            // Transparency effect
            float transparency = smoothstep(0.2, 0.8, abs(dot(viewDir, normal)));
            finalColor = mix(finalColor, reflColor, transparency * 0.2);

            // Final check
            if (any(isnan(finalColor)) || any(isinf(finalColor))) {
              gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
              return;
            }

            gl_FragColor = vec4(finalColor, 1.0);
          }
          `
        });
        // // console.log("returning mat", material)
        return material
      } catch (e) {
        // // // console.log("Error while loading matcap texture", e)
      }
    }
    // Define reactive variables
    const density = ref(9.05);
    const light = ref(0.74);
    const viscosity = ref(0.82)
    const hPosition =  ref(0.50)
    const hIntensity = ref(0.50)
    const envMapIntensity = ref(1.00)
    const viscosityWaviness = ref(20.00)

    // Replace changeMatcapFinal with a new function that uses createComplexMaterialOptions
    async function changeComplexMatcap(id, color) {
      let tempFixed = new Vector3(
        0.6325000000000001,
        0.23,
        0
      )
      let fixedPosition = new Vector3(-0.55, 0.1, 0)
      // let pos = new Vector3(0, 0, 0)
      let testId = 41;

      // globalScene.traverse((obj) => {
      //   if(obj.isMesh){
      //     if(obj.name.includes("450")){
      //       obj.position.copy(tempFixed)
      //     }
      //   }
      // })
      let positionStore = {};
      Object.values(honeyMeshes).forEach((mesh) => {
        positionStore[mesh.size] = mesh.position.clone()
        // mesh.position.copy(fixedPosition)
      })
      // // // console.log("STORED POS", positionStore)
      // let sampledEnvMapColor = sampleEnvironmentMap(position)
      // function createUniformEnvironmentMap(color) {
      //   const size = 1;
      //   const canvas = document.createElement('canvas');
      //   canvas.width = size;
      //   canvas.height = size;
      //   const ctx = canvas.getContext('2d');
      //   ctx.fillStyle = `rgb(${color.r * 255},${color.g * 255},${color.b * 255})`;
      //   ctx.fillRect(0, 0, size, size);

      //   const uniformEnvMap = new CanvasTexture(canvas);
      //   uniformEnvMap.mapping = EquirectangularReflectionMapping;
      //   return uniformEnvMap;
      // }
      // globalGlass300g.material.envMap = createUniformEnvironmentMap(sampledEnvMapColor);
      // globalGlass300g.material.needsUpdate = true;
      const material2 = await testMaterial(
        testId,
        fixedPosition,
        density, 
        light, 
        viscosity, 
        hPosition, 
        hIntensity, 
        envMapIntensity, 
        viscosityWaviness // viscosityWaviness
      )
      // // console.log("Got material", material2)
      Object.values(honeyMeshes).forEach((mesh) => {
        // // console.log("MESH :", mesh)
        mesh.material = material2;
        mesh.material.needsUpdate = true;
      })
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
    function setTrackingVariables(setting, front = '300g', back = '150g'){ // setting = 1 = default, 2 = manual
      if(setting === 1){
        if(currentBrand.value === 'okto'){
          frontJarSize = '300g'
          backJarSize = '150g'
        } else {
          frontJarSize = '300g'
          backJarSize = '450g'
        }
      } else {
        frontJarSize = front
        backJarSize = back
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

    let globalObj150g;
    let globalObj300g;
    let globalObj450g;

    let globalGlass150g;
    let globalGlass300g;
    let globalGlass450g;


    const setCanvas = async () => {
      globalStore.toggleLoadingCircle(true)
      // // console.log("ATTEMPTING SETCANVAS ==================================================")

      let tempSize = frontJarSize.value || '300g' //values used are in grams

      // Create Scene
      isLoading.value = true
      globalScene = new Scene();

      let sceneUrl = currentBrand.value === 'okto' ?  
      '/assets/glb/newJars/450-300-animation-choppy-v2.glb':
      '/assets/glb/newJars/300-150-animation-choppy-v6.glb' 

      let sceneParts = await loadGlbReturnParts(loader, sceneUrl)
      console.log("scene parts", sceneParts)
      // reference to mesh within loaded Scene - changes affect scene directly
      labelMeshes = sceneParts.labelMeshes
      glassMeshes = sceneParts.glassMeshes
      labelMeshesClones = sceneParts.labelMeshesClones
      honeyMeshes = sceneParts.honeyMeshes
      
      // // // console.log("LABEL MESHES +++++++++++++++++++++++++++++++++++++++++++++++++++++", labelMeshes)
      // // // console.log("GLASS MESHES -----------------------------------------------------", glassMeshes)
      setTrackingVariables(1)

      mixer = initializeMixer(sceneParts.scene)
      // sceneParts.scene.position.set(0.25, -0.15, 0.1)
      globalScene.add(sceneParts.scene)


      // TEST remove label glass jar
      globalScene.traverse((obj)=>{
        if(obj.isMesh){
          if(obj.name.includes('honey_object')){
            // label
            // obj.material.transparent = true;
            // obj.material.opacity = 0;
          }
          if(obj.name === 'honey_object_300g'){
            // changeMatcap(obj)
            // globalObj300g = obj
          } else if (obj.name === 'honey_object_150g'){
            // globalObj150g = obj;
          } else if (obj.name.includes('jar')){
            // // // console.log("OBJ TRANSMISSION", obj.name)
            // obj.material.transparent = true;
            // obj.material.opacity = 0;
            if(obj.name === "jar_object_150g"){
              // globalGlass150g = obj
            } else {
              // globalGlass300g = obj
            }
            // obj.material.transparent = true;
            // obj.material.opacity = 0;
          }
          if(obj.name.includes('150g')){ // used for targeting of position sliders
            jarSmall.value.push(obj)
          } else if (obj.name.includes('300g')){
            jarMedium.value.push(obj)
          }
          if(obj.name.includes('label')){
            // obj.material.transparent = true;
            // obj.material.opacity = 0;
            if(obj.name.includes(tempSize)){
              currentJarLabel = obj
            } else upcomingJarLabel = obj
          }
        }
      })

      let setupAnimationProps = setupAnimations(mixer, sceneParts.gltf.animations)
      // destructuring makes globalScene.add throw error?
      // ({ clipActions, animationState } = setupAnimations(mixer, jarAnimation3.gltf.animations))
      clipActions = setupAnimationProps.clipActions
      animationState = setupAnimationProps.animationState
      

      currentJarScene = sceneParts.scene; //Scene to be loaded

      jarScenes[currentJarSize.value] = currentJarScene; 


      let meshes = currentJarScene.children;
      let targetMesh = meshes[1]

      //Add jar scene to global scene
      // globalScene.add(currentJarScene)

      // Lights (added to camera below)
      globalPointLight = new PointLight(0xffffff, 1);
      globalPointLight.position.set(targetMesh.position.x, targetMesh.position.y, targetMesh.position.z + 0.5);

      // Camera
      globalCamera = new PerspectiveCamera(25, aspectRatio.value, 0.001, 5);
      if( isMobile.value ){
        // // // // console.log("ISMOBILE")
        globalCamera = new PerspectiveCamera(25, aspectRatio.value, 0.001, 3);
        // globalCamera.initialZoom = 1.4;
        globalCamera.position.set(cameraConfigsMobile.x, cameraConfigsMobile.y, cameraConfigsMobile.z)
        // globalCamera.position.set(cameraConfigs.x, cameraConfigs.y, cameraConfigs.z);
        // globalCamera.lookAt(0, 1, 0)
      } else {
        globalCamera.position.set(cameraConfigs.x, cameraConfigs.y, cameraConfigs.z); // Position the camera in front of the mesh
      }
      globalCamera.lookAt(0, cameraConfigs.y , 0)
      // globalCamera.zoomFactor = 10;
      let axesHelper2 = new AxesHelper(5);
      axesHelper2.setColors('blue', 'green', 'red')
      // targetMesh.add(axesHelper2)
      // globalCamera.add(globalPointLight); //add pointlight to camera
      globalScene.add(globalCamera);


      // development axes helpers
      axesHelper = new AxesHelper(5);
      axesHelper.setColors('red', 'blue', 'green')
      cameraHelper = new CameraHelper(globalCamera);
      // globalScene.add(cameraHelper)
      // globalScene.add(axesHelper)

      // Renderer
      const canvas = webGl.value;
      globalRenderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
      globalRenderer.setSize(containerWidth.value, containerHeight.value);
      globalRenderer.setClearColor(0x000000, 0)
      globalRenderer.setPixelRatio(window.devicePixelRatio);
      // globalRenderer.setScissorTest( true );
      globalRenderer.shadowMap.enabled = false;
      globalRenderer.render(globalScene, globalCamera);
      updateTexture()
      // globalOrbitControls = new OrbitControls(globalCamera, canvas);
      // globalOrbitControls.enableDamping = true; // Add smooth damping
      // globalOrbitControls.dampingFactor = 0.05;
      // globalOrbitControls.minDistance = 0.1;
      // globalOrbitControls.maxDistance = 10;
      // globalOrbitControls.maxPolarAngle = Math.PI / 2;
      await setLightingEXR(globalRenderer)
      // await setLighting(globalRenderer)
      // globalStore.toggleLoadingCircle();
    };
    

    /* TEXTURE */
    let currentTexture = null;
    let upcomingTexture = null;
    // let currentTexture = { textures: [], name: "" };
    // let upcomingTexture = { textures: [], name: "" };
    async function computeTexture() {
      isFirstLoad = false;
      const baseTextureUrl = '/assets/label-textures-2';


      // load if not
      let jarTexturesLocal = []
      for (const size of jarSizes) {
        let textureUrl = `${baseTextureUrl}/${textureUrlSlugs.brand}/${textureUrlSlugs.productLine}/${size}/${textureUrlSlugs.flavour}.png`;
        // console.log("url - > ", textureUrl)
        let texture = await loadTexture(textureUrl);
        texture.name = textureUrlSlugs.flavour
        texture.flipY = false;
        texture.generateMipMaps = true;
        texture.needsUpdate = true;
        jarTexturesLocal.push({ texture, size, name: textureUrlSlugs.flavour });
      }

      return jarTexturesLocal
    }
    async function createTextureShader(previousTexture, nextTexture, clonedProperties){
      // console.log("CALLED CTS func")
      // Copy glb mesh properties into shader
      let tempEnv = globalScene.environment
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
            side: DoubleSide
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying float vSide;

          void main() {
              vUv = uv;
              vec3 transformedNormal = normalMatrix * normal;
              vNormal = normalize(transformedNormal);
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              vViewPosition = -mvPosition.xyz;
              gl_Position = projectionMatrix * mvPosition;
              
              // Determine if this is a front or back face
              vSide = dot(transformedNormal, vViewPosition) > 0.0 ? -1.0 : 1.0;
          }
              `,
        fragmentShader: `
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
              float alpha = step(vUv.x, transitionProgress);
              vec4 texColorCurrent = texture2D(currentTexture, vUv);
              vec4 texColorNext = texture2D(nextTexture, vUv);
              vec4 texColor = mix(texColorCurrent, texColorNext, alpha);

              vec3 color = baseColor * texColor.rgb;

              vec3 normal = normalize(vNormal) * vSide;
              vec3 viewDir = normalize(vViewPosition);
              
              // Calculate environment reflection
              vec3 reflectVec = reflect(-viewDir, normal);
              vec3 envColor = texture(envMap, reflectVec).rgb;

              // Apply environment mapping
              vec3 envMapColor = envColor * envMapIntensity;
              
              // Mix base color with environment reflection based on roughness and metalness
              vec3 finalColor = mix(color, envMapColor, (1.0 - roughness) * metalness);
              finalColor += envMapColor * (1.0 - metalness) * (1.0 - roughness) * 0.5;

              // Use the alpha from the texture
              float finalAlpha = texColor.a;

              gl_FragColor = vec4(finalColor, finalAlpha);
          }
              `,
              transparent: true,
              alphaTest: 0.05,  // Adjust this value as needed
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
        envMapIntensity: { value: 1.0 },
        // exposure: {value: 0.2},
        side: DoubleSide
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying float vSide;

          void main() {
              vUv = uv;
              vec3 transformedNormal = normalMatrix * normal;
              vNormal = normalize(transformedNormal);
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              vViewPosition = -mvPosition.xyz;
              gl_Position = projectionMatrix * mvPosition;
              
              // Determine if this is a front or back face
              vSide = dot(transformedNormal, vViewPosition) > 0.0 ? -1.0 : 1.0;
          }
        `,
        fragmentShader: `
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
              float alpha = step(vUv.x, transitionProgress);
              vec4 texColorCurrent = texture2D(currentTexture, vUv);
              vec4 texColorNext = texture2D(nextTexture, vUv);
              vec4 texColor = mix(texColorCurrent, texColorNext, alpha);

              vec3 color = baseColor * texColor.rgb;

              vec3 normal = normalize(vNormal) * vSide;
              vec3 viewDir = normalize(vViewPosition);
              
              // Calculate environment reflection
              vec3 reflectVec = reflect(-viewDir, normal);
              vec3 envColor = texture(envMap, reflectVec).rgb;

              // Apply environment mapping
              vec3 envMapColor = envColor * envMapIntensity;
              
              // Mix base color with environment reflection based on roughness and metalness
              vec3 finalColor = mix(color, envMapColor, (1.0 - roughness) * metalness);
              finalColor += envMapColor * (1.0 - metalness) * (1.0 - roughness) * 0.5;

              // Use the alpha from the texture
              float finalAlpha = texColor.a;

              gl_FragColor = vec4(finalColor, finalAlpha);
          }
        `,
        transparent: true,
        alphaTest: 0.05,  // Adjust this value as needed
      });
      // console.log("about to return mats")
      return [
        {material: material, size: previousTexture[0].size}, 
        {material: material2, size: previousTexture[1].size}
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
      if(!currentJarScene){
        // console.log("EXITING")
        isLoadingTexture = false
        return
      }

      let clonedProperties = null
      Object.values(labelMeshesClones).forEach((clone) => {
        clonedProperties = clone.material
      })
      Object.values(labelMeshes).forEach((mesh) => {
        if (mesh.material && mesh.material.map) {
          // Dispose of the current texture to free up memory
          mesh.material.map.dispose();
        }
      })
      
      let textures = await computeTexture();
      let shaderTextures = null;
      // console.log("IF FOR CREATING SHADER", currentTexture, textureUrlSlugs.flavour)
      if(!currentTexture){
        currentTexture = {textures, name: textureUrlSlugs.flavour}
        shaderTextures = await createTextureShader(currentTexture.textures, currentTexture.textures, clonedProperties)
      } else {
        // console.log("COMPARISON", currentTexture.name === textureUrlSlugs.flavour )
        if(!(currentTexture.name === textureUrlSlugs.flavour)){
          // console.log("CREATING NEW SHADER TEXS", textures)
          upcomingTexture = {textures, name: textureUrlSlugs.flavour}
          shaderTextures = await createTextureShader(currentTexture.textures, upcomingTexture.textures, clonedProperties)
          currentTexture = {textures, name: textureUrlSlugs.flavour}
        }
      }
      // // // console.log("TEXTURES", shaderTextures, currentTexture, upcomingTexture)
      // console.log("LABEL MESHES", !!labelMeshes)
      // console.log("SHADER MATS", shaderTextures)
      if(labelMeshes){
        let mesh1 = labelMeshes[shaderTextures[0].size]
        mesh1.material = shaderTextures[0].material
        mesh1.material.side = DoubleSide;
        mesh1.material.needsUpdate = true;
        
        let mesh2 = labelMeshes[shaderTextures[1].size]
        mesh2.material = shaderTextures[1].material
        mesh2.material.side = DoubleSide;
        mesh2.material.needsUpdate = true;
        
        globalStore.toggleLoadingCircle(false)
      }
        // labelMesh.material.map = texture;
        // labelMesh.material.needsUpdate = true;
      isLoadingTexture = false
      // console.log("Before if for StartWipe", firstTextureLoad, startWipe.value)
      if(!firstTextureLoad){
        // console.log("initiating startWipe", labelMeshes[jarSizes[0]].material.uniforms.transitionProgress.value)
        startWipe.value = true
      } else {
        firstTextureLoad = false
      }
    }

    /* Jar size*/
    const selectJarSize = async (size) => {
      if(size === currentJarSize.value){
        return
      } else {
        textureUrlSlugs.size = size
        // let texture = await loadTexture()
        // let movement = calculateJarMovement(currentJarScene)
        // await prepareSceneForSwitch(size, movement)
        // animateJarOut(currentJarScene, movement, texture)
        
        clipActions.forEach((action) => {
          animationState.get(clipActions[0]).isFinished = false;
          action.play()
          currentJarSize.value = size;
        })
        initiateObjectRotation(globalScene, webGl.value.parentElement, currentJarSize.value)
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
    const debouncedUpdateSize = debounce(function() {
      if(isMobile) return
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
    async function setLightingEXR(renderer){
      
      let pmremGenerator = new PMREMGenerator(renderer);
      let exrTexture = await new EXRLoader().loadAsync("/assets/exr/brown_photostudio_02_1k.exr")
      console.log("EXRTEX", exrTexture)
      let envMap = pmremGenerator.fromEquirectangular(exrTexture).texture;
      console.log(envMap.type);
      console.log(envMap.mapping);
      console.log(envMap.width, envMap.height);
      console.log("envMap", envMap)
      // envMap.intensity = 0.2;
      // pmremGenerator.compileEquirectangularShader();
      globalScene.background = null;
      globalScene.environment = envMap;
      // globalScene.environment.intensity = 0.2;
      // // console.log("FINISHED SETTING LIGHTING ===========>")
      pmremGenerator.dispose()
      exrTexture.dispose();
      isLoading.value = false;
    }
    // async function setLightingEXR(renderer, options = {}) {
    //   const {
    //     exrPath = "/assets/exr/brown_photostudio_02_1k.exr",
    //     exposure = 1.0,
    //     backgroundBlurriness = 0,
    //     backgroundIntensity = 1.0,
    //     useAsBackground = false,
    //     maxTexSize = 256
    //   } = options;

    //   let pmremGenerator = new PMREMGenerator(renderer);
    //   pmremGenerator.compileEquirectangularShader();
    //   pmremGenerator.maxTexSize = maxTexSize;

    //   let exrTexture = await new EXRLoader().loadAsync(exrPath);
    //   exrTexture.colorSpace = SRGBColorSpace;

    //   let envMap = pmremGenerator.fromEquirectangular(exrTexture).texture;

    //   if (useAsBackground) {
    //     globalScene.background = envMap;
    //     globalScene.backgroundBlurriness = backgroundBlurriness;
    //     globalScene.backgroundIntensity = backgroundIntensity;
    //   } else {
    //     globalScene.background = null;
    //   }

    //   globalScene.environment = envMap;
    //   renderer.toneMappingExposure = exposure;

    //   pmremGenerator.dispose();
    //   exrTexture.dispose();

    //   return envMap; // In case you need to use it elsewhere
    // }

    async function setLighting(renderer){
      let pmremGenerator = new PMREMGenerator( renderer );
      // let rgbeTexture = await new RGBELoader().loadAsync('/assets/HDR/garden.hdr')
      let rgbeTexture = await loadEnvironment('/assets/HDR/garden.hdr')
      var envMap = pmremGenerator.fromEquirectangular( rgbeTexture ).texture;
      globalScene.background = null;
      globalScene.environment = envMap;
      rgbeTexture.dispose();
      pmremGenerator.dispose();
      pmremGenerator.compileEquirectangularShader();
    }
    
    // async function attachLightToCamera(cam){
    //   light = new PointLight(0xffffff, 1);
    //   light.position.set(targetMesh.position.x, targetMesh.position.y, targetMesh.position.z + 0.5);
    //   cam.add(light)
    // }

    async function resetScene(){
      // await setCanvas();
      // animate();
      // let tempPos;
      // // const meshAxes = new AxesHelper(5);
      // // scene.add(meshAxes)
      // let iterations = 0;
      // globalScene.traverse((obj) => {
      //   if(obj.isMesh){
      //     let tempAxes = new AxesHelper(5)
      //     if(iterations === 0){
      //       tempAxes.setColors('red', 'green', 'blue')
      //     }else if(iterations === 1){
      //       tempAxes.setColors('purple', 'yellow', 'blue')
      //     }else if(iterations === 2){
      //       tempAxes.setColors('pink', 'brown', 'blue')
      //       tempPos = obj.position
      //     }else if(iterations === 3){
      //       tempAxes.setColors('black', 'skyblue', 'blue')
      //     }
      //     obj.add(tempAxes)
      //     iterations++
      //   }
      // })
      // globalCamera.position.set(0, 0, 0.6)
      // globalCamera.lookAt(tempPos)
      // globalCamera.updateProjectionMatrix();
    }

    const clock = new Clock();
    const clockTexture = new Clock();
    const testClock = new Clock()
    testClock.start()
    let isAnimating = false
    let animateTextureChange = false;
    let startWipe = ref(false);
    let wipeStep = 0.01;
    const animate = () => {
      if(!isAnimating) return
      stats.begin();
      if(labelTest){
        if(loadedText){ //Honey loadedTexture, apply oscillations based on time through shader.
          const elapsedTime = clockTexture.getElapsedTime();
          const linePosition = (Math.sin(elapsedTime) + 1) / 2; // Oscillate between 0 and 1
          labelTest.material.uniforms.linePosition.value = linePosition;
        }
      }

      if (startWipe.value) {
        // console.log("WIPING")
        // Assuming you start the transitionProgress at 0
        let label1 = labelMeshes[jarSizes[0]]
        let label2 = labelMeshes[jarSizes[1]]
        // // // console.log("WIPING", label1.material.uniforms.transitionProgress.value)
          label1.material.uniforms.transitionProgress.value += wipeStep;
          label2.material.uniforms.transitionProgress.value += wipeStep;// Adjust this rate as needed

          // Clamp the transition progress at 1 to stop the transition
          if (label1.material.uniforms.transitionProgress.value > 1) {
            // console.log("Progress done.")
            label1.material.uniforms.transitionProgress.value = 1;
            label2.material.uniforms.transitionProgress.value = 1;
            startWipe.value = false; // Stop the wipe effect
          }
      }

      globalRenderer.render(globalScene, globalCamera);
      

      let delta = clock.getDelta();
      if(!animationState.get(clipActions[0]).isFinished){
        mixer.update(delta);
      }
      if(LOGTIMER === 0 && animationDONE){
        LOGTIMER++
      }
    
      stats.end()
      // globalOrbitControls.update();
      requestAnimationFrame(animate);
    };
    function triggerTextureTransition(newTextureIndex) {
      // if (newTextureIndex === globalObj300g.material.uniforms.currentTextureIndex.value) {
      //     console.warn("Already displaying this texture.");
      //     return; // Avoid transitioning to the same texture
      // }
      newTextureIndex = 1
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
      const centerScreenX = (center.x * widthHalf) + widthHalf;

      // Calculate the mesh width in screen space (approximate)
      const frustumHeight = 2.0 * distanceToOrigin * Math.tan(globalCamera.fov * 0.5 * Math.PI / 180);
      const frustumWidth = frustumHeight * globalCamera.aspect;
      const meshWidthScreen = size.x / frustumWidth * globalRenderer.domElement.width;

      // Calculate the left edge of the mesh in screen coordinates
      const leftEdgeScreenX = centerScreenX - meshWidthScreen / 2;

      // Ensure the distance is non-negative.
      const edgeDistance = Math.max(0, Math.min(leftEdgeScreenX, globalRenderer.domElement.width));
      emitter.emit('meshEdges', {leftEdge: edgeDistance, rightEdge: edgeDistance})
    }

  
    onMounted( async () => {
      await nextTick();
      updateContainerSize(); // Set initial size
      window.addEventListener('resize', debouncedUpdateSize);
      // webGl.value.parentElement.addEventListener('mousedown', debouncedJarPan);
      // webGl.value.parentElement.addEventListener('mousemove', )

      await setCanvas();
      // initializeEdges(globalScene.children[0]);
      console.log("SCENE BEFORE BEING PASSED", globalScene)
      await initiateObjectRotation(globalScene, webGl.value.parentElement, currentJarSize.value)
      await nextTick()
      // getDistanceFromCanvas(globalScene.children[0].children[0])
      // initSliderInteraction();
      isAnimating = true;
      animate();
      // changeMat();
      renderMatcap()
    });

    onBeforeUnmount(() => {
      // stop animating, effectively stop requestAnimationFrame
      isAnimating = false;
    })
    onUnmounted(() => {
      window.removeEventListener('resize', debouncedUpdateSize);

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
            node.material.forEach(material => disposeMaterial(material));
          } else {
            disposeMaterial(node.material);
          }
        }
      }

      function disposeMaterial(material) {
        Object.keys(material).forEach(prop => {
          if (!material[prop]) return;
          if (material[prop] !== null && typeof material[prop].dispose === 'function') {
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
        if (gl && gl.getExtension('WEBGL_lose_context')) {
          gl.getExtension('WEBGL_lose_context').loseContext();
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
      tempColor = null;
      labelTest = null;
      clipActions = [];
      animationState.clear();

      // force garbage collection - only some browsers support this
      if (window.gc) {
        window.gc();
      }
    });

    
    watch(() => ({
      flavour: productStore.getFlavourSlug,
      productLine: productStore.getProductLineSlug,
      brand: productStore.getBrandSlug,
      size: currentJarSize.value
    }), async (newValues) => {
      // console.log("Triggered WATCHER:", JSON.parse(JSON.stringify(newValues)))
      //Set local size to grams, set global values of jar sizes
      let gramSize = newValues.size
      currentJarSize.value = newValues.size
      currentJarSizeGrams.value = gramSize
      if(newValues.brand !== currentBrand.value){
        // // console.log("HMph")
        if(newValues.brand === 'okto'){
          jarSizes = ['450g', '300g']
          currentLoadedJars = ['450g', '300g']
          frontJarSize = currentLoadedJars[1] //300g is forefront on okto
          backJarSize = currentLoadedJars[0] //450g is forefront on okto
          currentBrand.value = newValues.brand
        } else {
          jarSizes = ['300g', '150g']
          currentLoadedJars = ['300g', '150g']
          frontJarSize = currentLoadedJars[0] //300g is forefront on haa
          backJarSize = currentLoadedJars[1] //150g is forefront on haa
          currentBrand.value = newValues.brand
        } 
      }

      // // // // console.log("JSIZES", jarSizes)
      // // // // console.log("PROPS WATCHER ===============================");
      // // // // console.log("flavour |", newValues.flavour, textureUrlSlugs.flavour, newValues.flavour !== textureUrlSlugs.flavour);
      // // // // console.log("brand |", newValues.brand, textureUrlSlugs.brand, newValues.brand !== textureUrlSlugs.brand);
      // // // // console.log("productLine |", newValues.productLine, textureUrlSlugs.productLine, newValues.productLine !== textureUrlSlugs.productLine);
      // // // // console.log("size |", gramSize, textureUrlSlugs.size, gramSize !== textureUrlSlugs.size);
      // // // // console.log("PROPS WATCHER ===============================");

      if ( 
        newValues.brand !== textureUrlSlugs.brand ||
        gramSize !== textureUrlSlugs.size 
      )
      {
        textureUrlSlugs = {
          ...textureUrlSlugs,
          brand: newValues.brand,
          size: gramSize
        }
        firstTextureLoad = true
      }

      if ( newValues.productLine !== textureUrlSlugs.productLine )
      {
        textureUrlSlugs = {
          ...textureUrlSlugs,
          productLine: newValues.productLine
        }
        // firstTextureLoad = true
        // console.log("FTL", firstTextureLoad)
      }

      if(newValues.flavour !== textureUrlSlugs.flavour){
        textureUrlSlugs = {
          ...textureUrlSlugs,
          flavour: newValues.flavour
        }
        // console.log("SETTING TEXTUREURL SLUGS VALUES", newValues.flavour !== textureUrlSlugs.flavour)
        updateTexture();
      }
      
    }, 
    {
      immediate: true,
      deep: true
    });



    return { 
      webGl, 
      sceneContainer,
      currentJarSize,
      currentBrand,
      resetScene,
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
      startWipe
    };
  },
};
</script>

<style lang="scss" scoped>
.scene-container{
  position: relative;
  width: 100%;
  height: 80%;
  @media(max-width: 767px){
    height: 100% !important;
    min-height: 300px !important;
  }
}
.reset-button{
  position: absolute;
  top:5%;
  right:10%;
  background: none;
  // border: 1px solid gray;
  outline: none !important;
  border: none !important;
  color: #000;
  &:hover, &:active{
    font-weight: 700;
  }
}
.size-selection{
  display: flex;
  width: 100%;
  justify-content: center;
  // position: absolute;
  bottom: 0%;
  button:not(:last-child){
    margin-right: 15px;
  }
  button{
    color: #000;
    font-family: 'DMSans';
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    letter-spacing: 2.72px;
    text-transform: uppercase;
    background: transparent;
    outline: none !important;
    border: none !important;
    &:hover, &:active{
      font-weight: 700;
      transition: font-weight ease-in-out 0.15s;
    }
    &.selected{
      font-weight: 700;
      // background: red;
    }
  }
}
.webGl{
  width: 100%;
  height: 100%;
  @media(max-width: 767px){
    // min-height: 350px;
    margin-bottom: 30px;
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
