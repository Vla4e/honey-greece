<template>
  <div class="scene-container" ref="sceneContainer">
    <!-- <div id="slider" ref="slider" class="slider"></div> -->
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
      <!-- <button @click="updateTexture()" style="position:absolute; top: 80%; left: 50%;">TEXTURE</button> -->
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
LinearFilter,
RGBAFormat,
VideoTexture,
sRGBEncoding
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

import { debounce, parabolicPathCoordinate } from '@/helpers/globalFunctions.js'
import { initiateObjectRotation } from '@/helpers/3DObjectPan.js'
import { initiateVideoControl } from '@/helpers/VideoPlayback.js'
import TWEEN, { update } from '@tweenjs/tween.js';


import Stats from "stats.js";


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
    console.log("SETUP")
    let stats = new Stats();
    //ref to canvas, window size
    stats.showPanel(0);
    document.body.appendChild(stats.dom)
    let emitter = inject('emitter')
    const webGl = ref();
    const sceneContainer = ref();
    const slider = ref();
    console.log("SLIDER !@!!!!!!!!!!", slider.value)
    function initSliderInteraction() {
      if(slider.value){
        console.log("THERE WAS VALUE")
        slider.value.addEventListener('pointerdown', (event) => {
          webGl.value.addEventListener('pointermove', onPointerMove);
          webGl.value.addEventListener('pointerup', () => {
            webGl.value.removeEventListener('pointermove', onPointerMove);
          });
        });
      }
      function onPointerMove(event) {
        const width = webGl.value.innerWidth;
        const sliderPosition = Math.max(0, Math.min(width, event.pageX));
        const transitionPoint = sliderPosition / width; // Normalize to [0, 1]

        // Use transitionPoint to blend between the current and upcoming labels
        currentLabelMesh.material.opacity = 1 - transitionPoint;
        upcomingLabelMesh.material.opacity = transitionPoint;
        upcomingLabelMesh.visible = true;
      }
    }
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
      // console.log("computed cWidth, cHeight", toRaw(containerWidth.value), toRaw(containerHeight.value))
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

    function loadVideoTexture(videoSrc, playVideo, mesh, callback) {
      const video = document.createElement('video');
      video.src = videoSrc;
      video.defaultPlaybackRate = 0.4;
      video.loop = true;
      video.muted = true; // Optional: mute the video

      const videoTexture = new VideoTexture(video);
      videoTexture.flipY = false;
      videoTexture.encoding = sRGBEncoding;
      // console.log("VideoTexture", videoTexture)
      video.addEventListener('canplaythrough', () => {
          videoTexture.minFilter = LinearFilter;
          videoTexture.magFilter = LinearFilter;
          videoTexture.format = RGBAFormat;
          if(playVideo)
          video.play(); // Start playing the video
          // video.play(); // Start playing the video
        }, false);
        video.load(); // Load the video
        applyVideoTextureToMesh(mesh, videoTexture)    
        // initiateVideoControl(video, webGl.value.parentElement)
    }

    function applyVideoTextureToMesh(mesh, videoTexture) {
      console.log("Attempting to apply video texture", videoTexture)
      mesh.material = new MeshBasicMaterial({
        map: videoTexture,
        transparent: false, // Ensure no transparency
        opacity: 1.0 // Set full opacity
      });
    }
    const setCanvas = async () => {
      // Create Scene
      globalScene = new Scene();

      let mediumSmallScene = await loadGlbReturnParts(loader, '/assets/glb/newMethod/150-300.glb')
      let largeMediumScene = await loadGlbReturnParts(loader, '/assets/glb/newMethod/300-450.glb')
      console.log("Med", mediumSmallScene)
      console.log("Large", largeMediumScene)
      if(largeMediumScene.jarSizes){
        jarSizes = largeMediumScene.jarSizes
      }
      largeMediumScene.scene.traverse((obj)=>{
        if(obj.isMesh){
          if(obj.name.includes('Plane')){
            obj.material.transparent = true;
            obj.material.opacity = 0;
          }
        }
      })
      loadVideoTexture('/assets/videos/okto-300-cotton.mp4', true, largeMediumScene.scene.children[3], ()=>{
        console.log("300")
      })
      
      loadVideoTexture('/assets/videos/okto-450-cotton.mp4', true, largeMediumScene.scene.children[0], ()=>{
        console.log("450")
      })
      mixer = initializeMixer(largeMediumScene.scene)
      globalScene.add(largeMediumScene.scene)
      let setupAnimationProps = setupAnimations(mixer, largeMediumScene.gltf.animations)
      // destructuring makes globalScene.add throw error?
      // ({ clipActions, animationState } = setupAnimations(mixer, jarAnimation3.gltf.animations))
      clipActions = setupAnimationProps.clipActions
      animationState = setupAnimationProps.animationState
      

      currentJarScene = largeMediumScene.scene; //Scene to be loaded
      console.log("assigned value to jar scene", currentJarScene)
      // currentJarScene.position.set(0, 0, 0.02)
      jarScenes[currentJarSize.value] = currentJarScene; 

      // let behindJarScene = await loadGlbReturnParts(loader, jarConfigs.large.source)
      // behindJarScene.scene.position.set(-0.8, 0, -0.1)
      // // await updateTexture()
      // // globalScene.add(behindJarScene.scene)
      // // setTimeout(()=>{
      // //   jarBackToFront(behindJarScene.scene, 1200, 800)
      // // }, 2000)
      let meshes = currentJarScene.children;
      let targetMesh = meshes[1]

      //Add jar scene to global scene
      // globalScene.add(currentJarScene)

      // Lights (added to camera below)
      globalPointLight = new PointLight(0xffffff, 1);
      globalPointLight.position.set(targetMesh.position.x, targetMesh.position.y, targetMesh.position.z + 0.5);

      // Camera
      globalCamera = mediumSmallScene.gltf.cameras[0]
      // globalCamera = new PerspectiveCamera(25, aspectRatio.value, 0.001, 5);
      // globalCamera.zoomFactor = 10;
      let axesHelper2 = new AxesHelper(5);
      axesHelper2.setColors('blue', 'green', 'red')
      // targetMesh.add(axesHelper2)
      // globalCamera.position.set(cameraConfigs.x, cameraConfigs.y, cameraConfigs.z); // Position the camera in front of the mesh
      // globalCamera.lookAt(0, cameraConfigs.y , 0)
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
      // console.log("Canvas dimensions beofe attaching WebGLRenderer:", canvas.clientWidth, canvas.clientHeight)
      globalRenderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
      globalRenderer.setSize(containerWidth.value, containerHeight.value);
      globalRenderer.setClearColor(0x000000, 0)
      globalRenderer.setPixelRatio(window.devicePixelRatio);
      globalRenderer.shadowMap.enabled = false;
      globalRenderer.render(globalScene, globalCamera);
      
      // setLighting(globalRenderer)
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
        console.log("OF", size)
        let textureUrl = `${baseTextureUrl}/${slugs.brand}/${slugs.productLine}/${size}/${slugs.flavour}.png`;
        console.log("CURRENT TEXTURE:", slugs.brand, slugs.productLine, slugs.flavour)
        let texture = await loadTexture(textureUrl);
        texture.flipY = false;
        texture.generateMipMaps = true;
        texture.needsUpdate = true;
        jarTexturesLocal.push({ texture, size });
      }
      // jarSizes.forEach(async (size) => {
      //   let textureUrl = `${baseTextureUrl}/${slugs.brand}/${slugs.productLine}/${size}/${slugs.flavour}.png`;
      //   let texture = await loadTexture(textureUrl);
      //   console.log("Texture MIPMAP:", texture)
      //   texture.flipY = false;
      //   texture.generateMipMaps = true
      //   texture.needsUpdate = true;
      //   jarTexturesLocal.push({texture, size})
      // })
      // console.log("TEXTURE SIZES", textureUrls)
      // let textureUrl = `${baseTextureUrl}/${slugs.brand}/${slugs.productLine}/${slugs.size}/${slugs.flavour}.png`;
      // console.log("URL:", textureUrl)
      // let texture = await loadTexture(textureUrl);
      // console.log("Texture MIPMAP:", texture)
      // texture.flipY = false;
      // texture.generateMipMaps = true
      // texture.needsUpdate = true;
      // jarTextures[slugs.brand][slugs.productLine][slugs.size][slugs.flavour] = texture;
      console.log("JARTEXTLOCAL", JSON.parse(JSON.stringify(jarTexturesLocal)))
      return jarTexturesLocal
      return texture;
    }

    async function updateTexture(preLoadedTexture = null) {
      let stopLoading = preLoadedTexture ? true : false;
      console.log("CALLED UPDATE TEXTURE", isLoadingTexture, stopLoading)
      if(isLoadingTexture && stopLoading) return
      let labelMesh = null;
      let labelMeshes = [];
      console.log("Current selected size:", currentJarSize.value)
      console.log("Current jar scene:", currentJarScene)

      let tempSize = currentJarSize.value === 'medium' ? '300g' : currentJarSize.value === 'large' ? '450g' : '150g' 
      currentJarScene.traverse((obj) => {
        if(obj.isMesh){
          if(obj.name.includes('label')){
            console.log("LABEL", obj.jarSize, currentJarSize.value)
            if(obj.jarSize === tempSize){
              currentJarLabel = obj
            } else upcomingJarLabel = obj.clone()
          }
        }
      })
      
      console.log("Current jar label", currentJarLabel)
      console.log("upcomingJarLabel", upcomingJarLabel)
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
        console.log("had preloaded")
        labelMesh.material.map = preLoadedTexture;
        labelMesh.material.needsUpdate = true;
        labelMesh.material.map = preLoadedTexture;
        labelMesh.material.needsUpdate = true;
      } else {
        console.log("Should computeTextures")
        let textures = await computeTexture();
        // texture.flipY = false;
        textures.forEach((object) => {
          console.log("Setting textures", object.size, tempSize)
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
      console.log("finished LOADING TEXTURE")
      isLoadingTexture = false
    }


  

    const selectJarSize = async (size) => {
      console.log("Attempting to selectJarSize", size, currentJarSize.value)
      if(size === currentJarSize.value){
        return
      } else {
        slugs.size = size === 'small' ? '150g' : size === 'medium' ? '300g' : '450g'
        // let texture = await loadTexture()
        console.log("loaded texture")
        // let movement = calculateJarMovement(currentJarScene)
        console.log("calculated movement")
        // await prepareSceneForSwitch(size, movement)
        // console.log("INITIAL ROTATION:", initialMeshQuaternion)
        console.log("prepared scene")
        // animateJarOut(currentJarScene, movement, texture)
        
        clipActions.forEach((action) => {
          console.log("Action NAME:", action._clip.name)
          // console.log("Playing action")
          if(action._clip.name.includes("Plane")){

          } else{
          }
          console.log("Cam")
          animationState.get(clipActions[0]).isFinished = false;
          action.play()
          currentJarSize.value = size;
        })
      }
    };

    const updateCamera = (newWidth, newHeight) => {
      
      globalCamera.aspect = newWidth / newHeight;
      globalCamera.updateProjectionMatrix();
      console.log("Updated Camera Aspect Ratio to:", globalCamera.aspect);
    };

    const updateRenderer = (newWidth, newHeight) => {
      // console.log("Renderer resized and rerendering")
      globalRenderer.setSize(newWidth, newHeight);
      globalRenderer.render(globalScene, globalCamera);
      console.log("Renderer Dimensions set to:", containerWidth.value, containerHeight.value);
    };
    const debouncedUpdateSize = debounce(function() {
      console.log("DEBOUNCE SIZE UPDATE CALLED ====================")
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
      // console.log("before UpdateCSize webGl w/h: ", toRaw(webGl.value.clientWidth), toRaw(webGl.value.clientHeight))
      // console.log("before UpdateCSize scene-container w/h: ", toRaw(webGl.value.parentElement.clientWidth), toRaw(webGl.value.parentElement.clientHeight))
      if (webGl.value && webGl.value.parentElement) {
        containerWidth.value = webGl.value.parentElement.clientWidth;
        containerHeight.value = webGl.value.parentElement.clientHeight;
      }
    }
    async function setLighting(renderer){
      // // // console.log('calling set lighting')
      var pmremGenerator = new PMREMGenerator( renderer );
      // let rgbeTexture = await new RGBELoader().loadAsync('/assets/HDR/garden.hdr')
      let rgbeTexture = await loadEnvironment('/assets/HDR/garden.hdr')
      // // // console.log('loader texture', rgbeTexture)
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
      // console.log("scene:", globalScene)
      // let tempPos;
      // // const meshAxes = new AxesHelper(5);
      // // scene.add(meshAxes)
      // let iterations = 0;
      // globalScene.traverse((obj) => {
      //   if(obj.isMesh){
      //     let tempAxes = new AxesHelper(5)
      //     if(iterations === 0){
      //       // console.log("AXESCOLOR 0")
      //       tempAxes.setColors('red', 'green', 'blue')
      //     }else if(iterations === 1){
      //       // console.log("AXESCOLOR 1")
      //       tempAxes.setColors('purple', 'yellow', 'blue')
      //     }else if(iterations === 2){
      //       // console.log("AXESCOLOR 2")
      //       tempAxes.setColors('pink', 'brown', 'blue')
      //       tempPos = obj.position
      //     }else if(iterations === 3){
      //       // console.log("AXESCOLOR 3")
      //       tempAxes.setColors('black', 'skyblue', 'blue')
      //     }
      //     // console.log("OBJ ", obj.name, "is positioned at:", obj.position.x, obj.position.y, obj.position.z, "iteration:", iterations)
      //     obj.add(tempAxes)
      //     iterations++
      //     // // console.log("OBJ POS:")
      //   }
      // })
      // // console.log("Scene pos:", globalScene.position.x, globalScene.position.y, globalScene.position.z)
      // // console.log("Cam pos:", globalCamera.position.x, globalCamera.position.y, globalCamera.position.z)
      // globalCamera.position.set(0, 0, 0.6)
      // globalCamera.lookAt(tempPos)
      // globalCamera.updateProjectionMatrix();
      // // console.log("Cam LOOKAT:", globalCamera)
    }

    const clock = new Clock();
    const animate = () => {
      
      stats.begin();
      // currentJarScene.rotation.y += 0.005

      // currentJarScene.rotation.x += (mouseY - currentJarScene.rotation.x) * 0.005;
      // currentJarScene.rotation.y += (mouseX - currentJarScene.rotation.y) * 0.005;
      globalRenderer.render(globalScene, globalCamera);
      TWEEN.update();
      let delta = clock.getDelta();
      if(!animationState.get(clipActions[0]).isFinished){
        mixer.update(delta);
      }
      if(LOGTIMER === 0 && animationDONE){
        // console.log("scene:", globalScene.position.x, globalScene.position.y, globalScene.position.z )
        // // console.log("controls:", controls.target.x, controls.target.y, controls.target.z)
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
      console.log("MOUNTED")
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
      console.log("BEFORE INTERACTION INIT", slider.value, webGl.value)
      // initSliderInteraction();
      animate();
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
      // console.log(currentValues.flavour, slugs.flavour, currentValues.flavour === slugs.flavour)
      // console.log(currentValues.brand, slugs.brand, currentValues.brand === slugs.brand)
      // console.log(currentValues.productLine, slugs.productLine, currentValues.productLine === slugs.productLine)
      // console.log(tempSize, slugs.size, tempSize === slugs.size)
      // Check if only the flavour slug has changed
      if (
        currentValues.flavour !== slugs.flavour &&
        currentValues.brand === slugs.brand &&
        currentValues.productLine === slugs.productLine &&
        tempSize === slugs.size &&
        !isFirstLoad
      ) {
          console.log('Only Flavour has Changed');
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
        console.log(`WATCHER: productLine`, currentValues.productLine);
      }

      if (currentValues.brand !== slugs.brand) {
        slugs.brand = currentValues.brand;
        currentBrand.value = currentValues.brand;
        console.log(`WATCHER: brand`, currentValues.brand);
      }

      if (tempSize !== slugs.size) {
        console.log("WATCHER: jarSize", tempSize);
      }
      
      if (currentValues.flavour !== slugs.flavour) {
        console.log("WATCHER: flavour")
        console.log("JarScene before ifs", currentJarScene, !!currentJarScene)
        slugs.flavour = currentValues.flavour;
        console.log(`FLAVOUR SLUGS ===>`, currentValues.flavour, slugs.flavour, !!currentJarScene);
        console.log(`OTHER SLUGS ===>`, currentValues.flavour, slugs.flavour, !!currentJarScene);
        if (currentJarScene) {
          // updateTexture();
        } else {
          let interval = setInterval(() => {
            // console.log("interval CALLED", !!currentJarScene);
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
      updateTexture
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
.slider{
  position: absolute;
				cursor: ew-resize;
				width: 40px;
				height: 40px;
				background-color: #F32196;
				opacity: 0.7;
				border-radius: 50%;
				top: calc(50% - 20px);
				left: calc(50% - 20px);
        z-index: 20000;
}
</style>
