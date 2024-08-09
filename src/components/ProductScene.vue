<template>
  <div class="scene-container" ref="sceneContainer">

    <canvas v-show="!isLoading" ref="webGl" class="webGl" />
    <LoadingIndicator style="width: 100px; height: 100px;" v-if="isLoading" class="jar-loading"/>

    <!-- <button class="reset-button" @click="resetScene">X</button> -->

    <!-- <div class="size-selection">
    {{ currentBrand }} TEST
      <button v-if="currentBrand === 'okto'" @click="selectJarSize('450g')" :class="currentJarSize === '450g' ? 'selected': ''" class="large-jar">
        450g
      </button>
      <button @click="selectJarSize('300g')" :class="currentJarSize === '300g' ? 'selected': ''" class="medium-jar">
        300g
      </button>
      <button v-if="currentBrand !== 'okto'" @click="selectJarSize('150g')" :class="currentJarSize === '150g' ? 'selected': ''" class="small-jar">
        150g
      </button>
      <button @click="triggerTextureTransition()" style="position:absolute; top: 80%; left: 50%;">TEXTURE</button>
    </div> -->

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


<script setup>
import { watch, onBeforeMount, onMounted, onUnmounted, onBeforeUnmount,  ref, computed, nextTick, inject, toRaw  } from "vue";
import { useProductStore } from '@/store/product.js';


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

/* Loader imports */
import {
  initializeGLTFLoader,
  loadGlb,
  loadGlbReturnParts,
  loadTexture,
  loadEnvironment
} from '@/helpers/loaders.js'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';


/* Animation imports */
import {
  initializeMixer,
  setupAnimations
} from '@/helpers/AnimationControls.js'

//Orbit controls
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Helper functions
import { debounce, parabolicPathCoordinate } from '@/helpers/globalFunctions.js'
import { initiateObjectRotation } from '@/helpers/3DObjectPan.js'

// Stat tracking
import Stats from "stats.js";

import PositionSliders from "./PositionSliders.vue";



/* CONFIGS */ // IMPORTANT: JAR HEIGHTS and WIDTHS are 0.3 < n < 1 in World Scale //
import brandConfigs from "@/assets/brand-information/index.js"

const jarConfigs = Object.freeze({
  "150g":   { name: "150g", source: "/assets/glb/jar-150g-v8.glb"},
  "300g":  { name: "300g", source: "/assets/glb/jar-300g-v4.glb"},
  "400g": { name: "400g", source: "/assets/glb/jar-450g-v4.glb"}
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

/* Three.js AUTOMATIC CACHE */
Cache.enabled = true;


/**************************** HELL BELOW  *****************************/

const { isMobile } = inject('screenSize')
const productStore = useProductStore();

const webGl = ref();

const sceneContainer = ref();
const containerWidth = ref(0);
const containerHeight = ref(0);
const aspectRatio = computed(() => {
  return containerWidth.value / containerHeight.value;
});

/* global variables - current, previous, upcoming */
let globalCamera = null;
let globalRenderer = null;
let globalScene = null;
let globalOrbitControls;
let globalPointLight = null;

//texture
let isFirstLoadTexture = true;
let globalTextureLoader = new TextureLoader()
let isLoadingTexture = false;
let loadedTexture = false;

//statuses
let isLoadingScene = ref(false);
let isResettingRotation = false;
let resetStartTime = 0;
const resetDuration = 1000;

// Helpers
let axesHelper;
let cameraHelper;

//animations
let mixer;
let clipActions = [];
let animationState = new Map();
let isAnimating = false;

// tracking variables - current, previous, upcoming
let currentBrand = ref(null)

let currentScene;

let frontJarSize;
let frontJarGlass;
let frontJarLabel;
let frontJarLabelClone;

let backJarSize;
let backJarLabel;
let backJarLabelClone;
let backJarGlass;

let labelMeshes;
let labelMeshesClones;
let glassMeshes;

function setTrackingVariables(setting, front, back){ // setting = 1 = default, 2 = manual
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
  backJarGlass = glassMeshes[backJarSize];
}


// Initalization
const loader = initializeGLTFLoader(true, true, true)

async function setLightingEXR(renderer){
  let pmremGenerator = new PMREMGenerator(renderer);
  let exrTexture = await new EXRLoader().loadAsync("/assets/exr/brown_photostudio_02_1k.exr")
  let envMap = pmremGenerator.fromEquirectangular(exrTexture).texture;
  // pmremGenerator.compileEquirectangularShader();
  globalScene.background = null;
  globalScene.environment = envMap;
  // globalScene.environmentIntensity = 0.2;
  pmremGenerator.dispose()
  exrTexture.dispose();
  isLoadingScene.value = false;
}

async function prepareToSetCanvas(){
  console.log("ATTEMPTING SETCANVAS ==================================================")
  isLoadingScene.value = true

  let tempSize = frontJarSize || '300g' //values used are in grams

  // Initiate Scene
  globalScene = new Scene();

  let sceneUrl = currentBrand.value === 'okto' ?  
  '/assets/glb/newJars/300-150-animation-choppy-v6.glb' : 
  '/assets/glb/newJars/450-300-animation-choppy-v2.glb'

  let sceneParts = await loadGlbReturnParts(loader, sceneUrl)

  currentScene = sceneParts.scene; //store reference to used scene
  globalScene.add(sceneParts.scene)

  // reference to mesh within loaded Scene - changes affect scene directly
  labelMeshes = sceneParts.labelMeshes
  glassMeshes = sceneParts.glassMeshes
  labelMeshesClones = sceneParts.labelMeshesClones

  console.log("LABEL +++++++++++++++++++++++++++++++++++++++++++++++++++++", labelMeshes)
  console.log("GLASS -----------------------------------------------------", glassMeshes)

  mixer = initializeMixer(sceneParts.scene)
  let setupAnimationProps = setupAnimations(mixer, sceneParts.gltf.animations)
  clipActions = setupAnimationProps.clipActions
  animationState = setupAnimationProps.animationState


  // Camera
  globalCamera = new PerspectiveCamera(25, aspectRatio.value, 0.001, 5);
  if( isMobile.value ){
      globalCamera = new PerspectiveCamera(25, aspectRatio.value, 0.001, 3);
      globalCamera.position.set(cameraConfigsMobile.x, cameraConfigsMobile.y, cameraConfigsMobile.z)
  } else {
      globalCamera.position.set(cameraConfigs.x, cameraConfigs.y, cameraConfigs.z)
  }
  globalCamera.lookAt(0, cameraConfigs.y , 0)
  let axesHelper2 = new AxesHelper(5);
  axesHelper2.setColors('blue', 'green', 'red')
  globalScene.add(globalCamera);

  // development axes helpers
  // axesHelper = new AxesHelper(5);
  // axesHelper.setColors('red', 'blue', 'green')
  // cameraHelper = new CameraHelper(globalCamera);
  // globalScene.add(cameraHelper)
  // globalScene.add(axesHelper)
}

async function setCanvas(){
    const canvas = webGl.value;
    globalRenderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    globalRenderer.setSize(containerWidth.value, containerHeight.value);
    globalRenderer.setClearColor(0x000000, 0)
    globalRenderer.setPixelRatio(window.devicePixelRatio);
    globalRenderer.shadowMap.enabled = false;
    globalRenderer.render(globalScene, globalCamera);
    // updateTexture()

    // globalOrbitControls = new OrbitControls(globalCamera, canvas);
    // globalOrbitControls.enableDamping = true; // Add smooth damping
    // globalOrbitControls.dampingFactor = 0.05;
    // globalOrbitControls.minDistance = 0.1;
    // globalOrbitControls.maxDistance = 10;
    // globalOrbitControls.maxPolarAngle = Math.PI / 2;

    await setLightingEXR(globalRenderer)
    // await setLighting(globalRenderer)
};

const updateRenderer = (newWidth, newHeight) => {
  globalRenderer.setSize(newWidth, newHeight);
  globalRenderer.render(globalScene, globalCamera);
};
const updateCamera = (newWidth, newHeight) => {
  globalCamera.aspect = newWidth / newHeight;
  globalCamera.updateProjectionMatrix();
};
function updateContainerSize() {
  if (webGl.value && webGl.value.parentElement) {
    containerWidth.value = webGl.value.parentElement.clientWidth;
    containerHeight.value = webGl.value.parentElement.clientHeight;
  }
}
const debouncedUpdateSize = debounce(function() {
  if(isMobile) return
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

onBeforeMount( async () => {
  await prepareToSetCanvas()
})

//Animate function
let clock = new Clock()
const animate = () => {
  if(!isAnimating) return
  // stats.begin();

  globalRenderer.render(globalScene, globalCamera);
  let delta = clock.getDelta();
  if(!animationState.get(clipActions[0]).isFinished){
    mixer.update(delta);
  }
  // stats.end()
  // globalOrbitControls.update();
  requestAnimationFrame(animate);
};

onMounted( async () => {
  console.log("on Mounted")
  await nextTick();
  updateContainerSize(); // Set initial size
  window.addEventListener('resize', debouncedUpdateSize);
  // webGl.value.parentElement.addEventListener('mousedown', debouncedJarPan);
  // webGl.value.parentElement.addEventListener('mousemove', )
  await setCanvas();
  // initializeEdges(globalScene.children[0]);
  // initiateObjectRotation(currentJarScene, webGl.value.parentElement)
  await nextTick()
  // getDistanceFromCanvas(globalScene.children[0].children[0])
  // initSliderInteraction();
  isAnimating = true;
  animate();
  // changeMat();
  // renderMatcap()
});


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
