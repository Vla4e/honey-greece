<template>
  <div class="scene-container" ref="sceneContainer">

    <canvas ref="webGl" class="webGl" />

    <!-- <button class="reset-button" @click="resetScene">X</button> -->
    <div class="size-selection">
      <button v-if="currentBrand === 'okto'" @click="selectJarSize('large')" :class="currentJarSize === 'large' ? 'selected': ''" class="large-jar">
        450g
      </button>
      <button @click="selectJarSize('medium')" :class="currentJarSize === 'medium' ? 'selected': ''" class="medium-jar">
        300g
      </button>
      <button v-if="currentBrand !== 'okto'" @click="selectJarSize('small')" :class="currentJarSize === 'small' ? 'selected': ''" class="small-jar">
        150g
      </button>
      <!-- <button @click="changeMat()" style="position:absolute; top: 80%; left: 50%;">TEXTURE</button> -->
    </div>
    <div class="target" style="position: absolute; top: 5%; left: 6%; display: flex; width: 100%;">
      <button style="margin-right: 10px;" @click="cycleMatcap(0)">prev</button>
      <button style="margin-right: 10px;" @click="toggleShader()">toggle shader: {{ matcapType ? 'keep original color' : 'force honey color' }}</button>
      <button style="margin-right: 10px;" @click="renderMatcap()">RENDER: {{ matcapId }}</button>
      <button style="margin-right: 10px;" @click="cycleMatcap(1)">next</button>
    </div>
    <div style="position: absolute; top: 0%; left: -50%; display: flex; width: 40%;">
      <PositionSliders  class="target" :jarSmall="jarSmall" :jarMedium="jarMedium"/>
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
ShaderMaterial
} from "three";

import {
  AnimationMixer,
  LoopOnce,
} from "three";

import { watch, onMounted, onUnmounted,  ref, computed, nextTick, inject, toRaw  } from "vue";
import { get, objectEntries, useWindowSize } from "@vueuse/core";
import { useProductStore } from '@/store/product.js';

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
import TWEEN, { update } from '@tweenjs/tween.js';


import Stats from "stats.js";
import PositionSliders from "./PositionSliders.vue";


/* "ENUMS" */
// IMPORTANT: JAR HEIGHTS and WIDTHS are 0.3 < n < 1 in World Scale //
const jarConfigs = Object.freeze({
  small:   { name: "small", source: "/assets/glb/jar-150g-v8.glb", position: {
    x: 0,
    y: 0,
    z: 0.02,
  } },
  medium:  { name: "medium", source: "/assets/glb/jar-300g-v4.glb", position: {
    x: 0,
    y: 0,
    z: 0.02,
  } },
  large: { name: "large", source: "/assets/glb/jar-450g-v4.glb", position: {
    x: 0,
    y: 0,
    z: 0.02,
  }  }
});

const cameraConfigs = Object.freeze({
  x: 0.35,
  y: 0.06,
  z: 0
})

Cache.enabled = true;

export default {
  setup() {
    let jarMedium = ref([]);
    let jarSmall = ref([]);

    //--------------------------------------------------------- DELETE ABOVE
    let stats = new Stats();
    //ref to canvas, window size
    stats.showPanel(0);
    document.body.appendChild(stats.dom)
    let emitter = inject('emitter')

    const webGl = ref();
    const sceneContainer = ref();
    const productStore = useProductStore();
    let slugs = {
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
      console.log("NEW VALUE", newValue)
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
    let currentJarSize = ref(jarConfigs.medium.name);
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
    async function changeMat(){
      let textureLoad = await loadTexture('/assets/label-textures-2/haa/monoflorals/300g/fir_limited.png')
      textureLoad.flipY = false;
      let textureLoad2 = await loadTexture('/assets/label-textures-2/haa/monoflorals/300g/pine_limited.png')
      textureLoad2.flipY = false;

      globalScene.traverse((obj)=>{
        if(obj.isMesh){
          if(obj.name.includes('150g')){
            jarSmall.value.push(obj)
          } else if (obj.name.includes('300g')){
            jarMedium.value.push(obj)
          }
          if(obj.name === 'label_object_300g'){
            labelTest = obj
            labelTest.material = new ShaderMaterial({
              uniforms: {
                  textureA: { type: 't', value: textureLoad },
                  textureB: { type: 't', value: textureLoad2 },
                  linePosition: { type: 'f', value: 0.0 }
              },
              vertexShader: `
                  varying vec2 vUv;
                  void main() {
                      vUv = uv;
                      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                  }
              `,
              fragmentShader: `
                  uniform sampler2D textureA;
                  uniform sampler2D textureB;
                  uniform float linePosition;
                  varying vec2 vUv;
                  void main() {
                      vec4 colorA = texture2D(textureA, vUv);
                      vec4 colorB = texture2D(textureB, vUv);
                      float blendFactor = step(linePosition, vUv.x);
                      gl_FragColor = mix(colorA, colorB, blendFactor);
                  }
              `,
              transparent: true
            });
          }
        }
      })
      console.log("SMALL", jarSmall.value)
      console.log("MEDIUM", jarMedium.value)
      loadedText = true
    }
    let matcapType = ref(true);
    function toggleShader(){
      matcapType.value = !matcapType.value
      renderMatcap()
    }
    

    let matcapMaterial;
    function renderMatcap(){
      if(matcapType.value){
        changeMatcap(tempColor)
      } else changeMatcap2(tempColor)
    }
    let tempColor;
    function switchColor(newColorHex) {
      tempColor = new Color(newColorHex)
      if (matcapMaterial) {
        const newColor = new Color(newColorHex);
        if (matcapType.value) {
          changeMatcap(newColor);
        } else {
          changeMatcap2(newColor);
        }
      }
    }

    async function changeMatcap(color){
      const textureLoader = new TextureLoader();
      const matcapTexture = textureLoader.load(`/assets/matcaps/${matcapId.value}.png`);

      // Step 2: Create a Shader Material with Color Adjustment
      // const honeyColor = new Color(0xffc107); // Example color for honey (golden yellow)
      const honeyColor = new Color(0xbf9000)

      matcapMaterial = new ShaderMaterial({
          uniforms: {
              matcap: { value: matcapTexture },
              colorAdjust: { value: color || new Color(0xbf9000) }
          },
          vertexShader: `
              varying vec3 viewDir;
              varying vec3 worldNormal;

              void main() {
                  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                  viewDir = normalize(-mvPosition.xyz);

                  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                  worldNormal = normalize(mat3(modelMatrix) * normal);

                  gl_Position = projectionMatrix * mvPosition;
              }
          `,
          fragmentShader: `
              uniform sampler2D matcap;
              uniform vec3 colorAdjust; // RGB multiplier for color adjustment
              varying vec3 viewDir;
              varying vec3 worldNormal;

              void main() {
                  vec3 normal = normalize(worldNormal);
                  vec3 reflected = reflect(viewDir, normal);

                  float m = 2.0 * sqrt(reflected.z + 1.0);
                  vec2 uv = reflected.xy / m + 0.5;

                  vec4 texColor = texture2D(matcap, uv);
                  // Apply the color adjustment
                  vec3 tintedColor = texColor.rgb * colorAdjust;
                  gl_FragColor = vec4(tintedColor, texColor.a);
              }
          `
      });
      globalObj300g.material = matcapMaterial
      globalObj300g.material.needsUpdate = true;
      globalObj150g.material = matcapMaterial
      globalObj150g.material.needsUpdate = true;
    }
    async function changeMatcap2(color){
      const textureLoader = new TextureLoader();
      const matcapTexture = textureLoader.load(`/assets/matcaps/${matcapId.value}.png`);

      // Step 2: Create a Shader Material with Full Color Override
      const desiredColor = new Color(0xffc107); // Example color for honey (golden yellow)

      matcapMaterial = new ShaderMaterial({
          uniforms: {
              matcap: { value: matcapTexture },
              colorAdjust: { value: color || new Color(0xffc107) }
          },
          vertexShader: `
              varying vec3 viewDir;
              varying vec3 worldNormal;

              void main() {
                  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                  viewDir = normalize(-mvPosition.xyz);

                  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                  worldNormal = normalize(mat3(modelMatrix) * normal);

                  gl_Position = projectionMatrix * mvPosition;
              }
          `,
          fragmentShader: `
              uniform sampler2D matcap;
              uniform vec3 colorAdjust; // RGB color for full override
              varying vec3 viewDir;
              varying vec3 worldNormal;

              void main() {
                  vec3 normal = normalize(worldNormal);
                  vec3 reflected = reflect(viewDir, normal);

                  float m = 2.0 * sqrt(reflected.z + 1.0);
                  vec2 uv = reflected.xy / m + 0.5;

                  vec4 texColor = texture2D(matcap, uv);

                  // Convert to grayscale to extract lighting and shading info
                  float grayscale = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));

                  // Apply the new color fully
                  vec3 fullyColored = grayscale * colorAdjust;

                  gl_FragColor = vec4(fullyColored, texColor.a);
              }
          `
      });
      // Step 3: Apply the Shader Material to Your Mesh
      // Assuming you have an existing mesh
      globalObj300g.material = matcapMaterial;
      globalObj300g.material.needsUpdate = true;
      globalObj150g.material = matcapMaterial
      globalObj150g.material.needsUpdate = true;
    }
    function cycleMatcap(direction) {
      if (direction) {
          matcapId.value = (matcapId.value % 29) + 1;
      } else {
          matcapId.value = (matcapId.value - 2 + 29) % 29 + 1;
      }
      renderMatcap();
    }
    let labelMeshes;
    let globalObj300g;
    let globalObj150g;
    const setCanvas = async () => {
      // Create Scene
      globalScene = new Scene();

      // let jarPromise = await loadGlbReturnParts(loader, jarConfigs.medium.source)
      let mediumSmallScene = await loadGlbReturnParts(loader, '/assets/glb/newJars/300-150-animation-choppy-v1.glb')
      // let largeMediumScene = await loadGlbReturnParts(loader, '/assets/glb/newJars/450-300-animation-choppy-v1.glb')
      labelMeshes = mediumSmallScene.labelMeshes
      // for (let mesh of mediumSmallScene.meshes){
      //     globalScene.add(mesh)
      // }

      if(mediumSmallScene.jarSizes){
        jarSizes = mediumSmallScene.jarSizes
      }
      mixer = initializeMixer(mediumSmallScene.scene)
      globalScene.add(mediumSmallScene.scene)
      globalScene.traverse((obj)=>{
        if(obj.isMesh){
          if(obj.name === 'honey_object_300g'){
            // changeMatcap(obj)
            globalObj300g = obj
          } else if (obj.name === 'honey_object_150g'){
            globalObj150g = obj;
          } else if (obj.name.includes('label')){
            // obj.material.transparent = true;
            // obj.material.opacity = 0;
          }
        }
      })
      let setupAnimationProps = setupAnimations(mixer, mediumSmallScene.gltf.animations)
      // destructuring makes globalScene.add throw error?
      // ({ clipActions, animationState } = setupAnimations(mixer, jarAnimation3.gltf.animations))
      clipActions = setupAnimationProps.clipActions
      animationState = setupAnimationProps.animationState
      

      currentJarScene = mediumSmallScene.scene; //Scene to be loaded

      jarScenes[currentJarSize.value] = currentJarScene; 

      // let behindJarScene = await loadGlbReturnParts(loader, jarConfigs.large.source)
      // behindJarScene.scene.position.set(-0.8, 0, -0.1)
      // // await updateTexture()
      // // globalScene.add(behindJarScene.scene)
      // // setTimeout(()=>{
      // //   jarBackToFront(behindJarScene.scene, 1200, 800)
      // // }, 2000)
      let meshes = currentJarScene.children;
      console.log("MESHES", meshes)
      let targetMesh = meshes[1]

      //Add jar scene to global scene
      // globalScene.add(currentJarScene)

      // Lights (added to camera below)
      globalPointLight = new PointLight(0xffffff, 1);
      globalPointLight.position.set(targetMesh.position.x, targetMesh.position.y, targetMesh.position.z + 0.5);

      // Camera
      globalCamera = new PerspectiveCamera(25, aspectRatio.value, 0.001, 5);
      // globalCamera.zoomFactor = 10;
      let axesHelper2 = new AxesHelper(5);
      axesHelper2.setColors('blue', 'green', 'red')
      // targetMesh.add(axesHelper2)
      globalCamera.position.set(cameraConfigs.x, cameraConfigs.y, cameraConfigs.z); // Position the camera in front of the mesh
      globalCamera.lookAt(0, cameraConfigs.y , 0)
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
      
      await setLightingEXR(globalRenderer)
      // await setLighting(globalRenderer)
    };

    async function computeTexture() {
      isFirstLoad = false;
      const baseTextureUrl = '/assets/label-textures-2';
      isLoadingTexture = true;

      // initialize nested object CACHE IS ENABLED - dont need this unless manual control
      // if (!jarTextures[slugs.brand]) {
      //     jarTextures[slugs.brand] = {};
      // }
      // if (!jarTextures[slugs.brand][slugs.productLine]) {
      //     jarTextures[slugs.brand][slugs.productLine] = {};
      // }
      // if (!jarTextures[slugs.brand][slugs.productLine][slugs.size]) {
      //     jarTextures[slugs.brand][slugs.productLine][slugs.size] = {};
      // }

      // // check if texture exists, return it
      // if (jarTextures[slugs.brand][slugs.productLine][slugs.size][slugs.flavour]) {
      //     return jarTextures[slugs.brand][slugs.productLine][slugs.size][slugs.flavour];
      // }

      // load if not
      let jarTexturesLocal = []
      for (const size of jarSizes) {
        let textureUrl = `${baseTextureUrl}/${slugs.brand}/${slugs.productLine}/${size}/${slugs.flavour}.png`;
        let texture = await loadTexture(textureUrl);
        texture.flipY = false;
        texture.generateMipMaps = true;
        texture.needsUpdate = true;
        jarTexturesLocal.push({ texture, size });
      }
      // jarSizes.forEach(async (size) => {
      //   let textureUrl = `${baseTextureUrl}/${slugs.brand}/${slugs.productLine}/${size}/${slugs.flavour}.png`;
      //   let texture = await loadTexture(textureUrl);
      //   texture.flipY = false;
      //   texture.generateMipMaps = true
      //   texture.needsUpdate = true;
      //   jarTexturesLocal.push({texture, size})
      // })
      // let textureUrl = `${baseTextureUrl}/${slugs.brand}/${slugs.productLine}/${slugs.size}/${slugs.flavour}.png`;
      // let texture = await loadTexture(textureUrl);
      // texture.flipY = false;
      // texture.generateMipMaps = true
      // texture.needsUpdate = true;
      // jarTextures[slugs.brand][slugs.productLine][slugs.size][slugs.flavour] = texture;
      return jarTexturesLocal
      return texture;
    }

    async function updateTexture(preLoadedTexture = null) {
      let stopLoading = preLoadedTexture ? true : false;
      if(isLoadingTexture && stopLoading) return
      let labelMesh = null;

      let tempSize = currentJarSize.value === 'medium' ? '300g' : currentJarSize.value === 'large' ? '450g' : '150g' 
      currentJarScene.traverse((obj) => {
        if(obj.isMesh){
          if(obj.name.includes('label')){
            if(obj.jarSize === tempSize){
              currentJarLabel = obj
            } else upcomingJarLabel = obj.clone()
          }
        }
      })
      
      // Check if the mesh and its material support textures
      if (currentJarLabel) {
        if (currentJarLabel.material && currentJarLabel.material.map) {
          // Dispose of the current texture to free up memory
          currentJarLabel.material.map.dispose();
        }
      } else return
      if (upcomingJarLabel) {
        if (upcomingJarLabel.material && upcomingJarLabel.material.map) {
          // Dispose of the current texture to free up memory
          upcomingJarLabel.material.map.dispose();
        }
      } else return

      // Create a new texture loader
      if(preLoadedTexture){
        labelMesh.material.map = preLoadedTexture;
        labelMesh.material.needsUpdate = true;
        labelMesh.material.map = preLoadedTexture;
        labelMesh.material.needsUpdate = true;
      } else {
        let textures = await computeTexture();
        // texture.flipY = false;
        textures.forEach((object) => {
          if(object.size === tempSize){
            currentJarLabel.material.map = object.texture
            currentJarLabel.material.needsUpdate = true;
          } else {
            upcomingJarLabel.material.map = object.texture
            upcomingJarLabel.material.needsUpdate = true;
          }
        })
        // labelMesh.material.map = texture;
        // labelMesh.material.needsUpdate = true;
      }
      isLoadingTexture = false
    }


  

    const selectJarSize = async (size) => {
      if(size === currentJarSize.value){
        return
      } else {
        slugs.size = size === 'small' ? '150g' : size === 'medium' ? '300g' : '450g'
        // let texture = await loadTexture()
        // let movement = calculateJarMovement(currentJarScene)
        // await prepareSceneForSwitch(size, movement)
        // animateJarOut(currentJarScene, movement, texture)
        
        clipActions.forEach((action) => {
          animationState.get(clipActions[0]).isFinished = false;
          action.play()
          currentJarSize.value = size;
        })
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
      let exrTexture = await new EXRLoader().loadAsync("/assets/exr/reinforced.exr")
      
      // 'assets/exr/bright.exr',
      // "assets/exr/lw.exr",
      // 'assets/exr/little_paris.exr',
      // 'assets/exr/river_walk.exr',
      // 'assets/exr/reinforced.exr',
      // 'assets/exr/syfer.exr',
      // 'assets/exr/mealie.exr',
      // 'assets/exr/railway.exr',
      // 'assets/exr/lonely.exr',
      // 'assets/exr/sunrise.exr',
      // let rgbeTexture = await new RGBELoader().loadAsync("assets/HDR/test-hdr.hdr");
      let envMap = pmremGenerator.fromEquirectangular(exrTexture).texture;
      // pmremGenerator.compileEquirectangularShader();
      globalScene.background = null;
      globalScene.environment = envMap;
      pmremGenerator.dispose()
      exrTexture.dispose();
    }
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
    const animate = () => {
      
      stats.begin();
      if(labelTest){
        if(loadedText){
          const elapsedTime = clockTexture.getElapsedTime();
          const linePosition = (Math.sin(elapsedTime) + 1) / 2; // Oscillate between 0 and 1
          labelTest.material.uniforms.linePosition.value = linePosition;
        }
      }
      globalRenderer.render(globalScene, globalCamera);
      TWEEN.update();
      let delta = clock.getDelta();
      if(!animationState.get(clipActions[0]).isFinished){
        mixer.update(delta);
      }
      if(LOGTIMER === 0 && animationDONE){
        LOGTIMER++
      }
      stats.end()
      requestAnimationFrame(animate);
    };

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
      emitter.on('applyColor', switchColor)
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
      animate();
      changeMat();
      renderMatcap()
    });
    onUnmounted(() => {
      // Remove resize event listener
      window.removeEventListener('resize', debouncedUpdateSize);

      if (globalRenderer) {
        globalRenderer.dispose();
      }

      // Dispose all materials, geometries, textures, etc.
      if (globalScene) {
        globalScene.traverse(function (object) {
          if (object.isMesh) {
            if (object.geometry) {
              object.geometry.dispose();
            }
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
            if (object.material && object.material.map) {
              object.material.map.dispose();
            }
          }
          if (object.isLight && object.shadow && object.shadow.map) {
            object.shadow.map.dispose();
          }
        });
      }


      // Clear the internal three.js caches
      Cache.clear();
      if (stats.dom) {
        document.body.removeChild(stats.dom);
      }
    });

    
    watch(() => ({
      flavour: productStore.getFlavourSlug,
      productLine: productStore.getProductLineSlug,
      brand: productStore.getBrandSlug,
      size: currentJarSize.value  // Assuming currentJarSize is a ref or reactive
    }), (currentValues) => {
      // Update slugs if changed
      let tempSize = currentValues.size === 'large' ? '450g' : currentValues.size === 'medium' ? '300g' : '150g';
      // Check if only the flavour slug has changed
      if (
        currentValues.flavour !== slugs.flavour &&
        currentValues.brand === slugs.brand &&
        currentValues.productLine === slugs.productLine &&
        tempSize === slugs.size &&
        !isFirstLoad
      ) {
          slugs.flavour = currentValues.flavour;
          if(currentJarScene){
            animateJarOutY(currentJarScene)
            return
          } else {
            let interval = setInterval(() => {
              if(currentJarScene && !isAnimationYActive){
                animateJarOutY(currentJarScene)
                isAnimationYActive = true;
                clearInterval(interval)
                return
              }
            }, 250)
          }
        // Call your specific function here if needed
      }

      if (currentValues.productLine !== slugs.productLine) {
        slugs.productLine = currentValues.productLine;
      }

      if (currentValues.brand !== slugs.brand) {
        slugs.brand = currentValues.brand;
        currentBrand.value = currentValues.brand;
      }

      if (tempSize !== slugs.size) {
      }
      
      if (currentValues.flavour !== slugs.flavour) {
        slugs.flavour = currentValues.flavour;
        if (currentJarScene) {
          // updateTexture();
        } else {
          let interval = setInterval(() => {
            if (currentJarScene) {
              // updateTexture();
              clearInterval(interval);
            }
          }, 250);
        }
      }

    }, {
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
      changeMatcap2,
      cycleMatcap,
      matcapId,
      toggleShader,
      renderMatcap,
      matcapType,
      jarSmall,
      jarMedium
    };
  },
};
</script>

<style lang="scss" scoped>
.scene-container{
  position: relative;
  width: 100%;
  height: 80%;
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
