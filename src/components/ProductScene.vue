<template>
  <div class="scene-container" ref="sceneContainer">
    <canvas ref="webGl" class="webGl" />
    <!-- <button class="reset-button" @click="resetScene">X</button> -->
    <div class="size-selection">
      <button @click="selectJarSizeTest('large')" :class="currentJarSize === 'large' ? 'selected': ''" class="large-jar">
        300g {{currentJarSize}}
      </button>
      <button @click="selectJarSizeTest('small')" :class="currentJarSize === 'small' ? 'selected': ''" class="small-jar">
        150g
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import {
  Scene,
  SphereGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PMREMGenerator,
  Mesh,
  PointLight,
  PerspectiveCamera,
  WebGLRenderer,
  TextureLoader,
  HemisphereLight,
  Vector2,
  Vector3,
  Box3,
  AxesHelper,
  CameraHelper,
  BoxHelper
} from "three";


import { watch, onMounted, onUnmounted,  ref, computed, nextTick, inject  } from "vue";
import { objectEntries, useWindowSize } from "@vueuse/core";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

import TWEEN from '@tweenjs/tween.js';

const smallJarSource = '/assets/glb/jar-150g-v5.glb'
const largeJarSource = '/assets/glb/300g-honey.glb'

export default {
  setup() {
    let emitter = inject('emitter')
    let calculationCounter = 0;
    const webGl = ref();
    const sceneContainer = ref();

    // console.log("SCENECON", sceneContainer.value)
    // console.log("WEBG", webGl)
    const img = "../assets/images/earth.jpg";
    // const { width: customWidth, height: customHeight } = useWindowSize();

    const customWidth = 650;
    const customHeight = 650;
    const containerWidth = ref(0);
    const containerHeight = ref(0);

    const aspectRatio = computed(() => {
      return containerWidth.value / containerHeight.value;
    });
    
    let camera: PerspectiveCamera;
    let renderer: WebGLRenderer;
    let scene: Scene;
    let mesh: Mesh;
    let controls: OrbitControls;
    let light: PointLight;
    let cameraHelper: CameraHelper;
    let axesHelper: AxesHelper;
    let LOGTIMER = 0;
    let animationDONE = false;

    //Loaders + configuration of loaders
    const loader = new GLTFLoader();
    const smallJarLoader = new GLTFLoader();
    const largeJarLoader = new GLTFLoader();

    const draco = new DRACOLoader();

    // draco.setDecoderConfig({ type: 'js' });
    // draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    // draco.preload();
    // largeJarLoader.setDRACOLoader = ( draco )

    let currentJarSize = ref('large');
    let jarModels = {};
    let currentJarScene: Scene;

    const setCanvas = async () => {
      // Create Scene
      scene = new Scene();

      // let largeJarLoaderPromise = await largeJarLoader.loadAsync('/assets/glb/jar-300g-latest.glb')
      let largeJarLoaderPromise = await loader.loadAsync('/assets/glb/300g-honey.glb')
      console.log("lgg", largeJarLoaderPromise)
      largeJarLoaderPromise.scene.traverse(function (obj) {
        if(obj.isMesh){
          // console.log("ISMESH:", obj.name)
          if(obj.name === 'med'){
            // obj.material.transparent = true;
            // obj.material.opacity = 1;
          } else if(obj.name === 'med_1'){ //GLASS
          } else if(obj.name === 'med_2'){ // LID
          } else if(obj.name === 'med_3'){ //LABEL
          }
        }
      })
      

      let jarScene = largeJarLoaderPromise.scene.children[0] //Scene to be loaded
      jarModels['large'] = jarScene;

      let meshes = largeJarLoaderPromise.scene.children[0].children;
      let targetMesh = meshes[1]

      scene.add(jarScene)
      currentJarScene = jarScene;

      // Lights (added to camera below)
      light = new PointLight(0xffffff, 1);
      light.position.set(targetMesh.position.x, targetMesh.position.y, targetMesh.position.z + 0.5);

      // Camera
      // const sceneAxis = new AxesHelper(5);
      // sceneAxis.setColors('red', 'blue', 'green')
      camera = new PerspectiveCamera(25, aspectRatio.value, 0.1, 1000);
      camera.position.set(targetMesh.position.x, targetMesh.position.y, targetMesh.position.z + 0.24); // Position the camera in front of the mesh
      camera.add(light);
      scene.add(camera);
      // scene.add(sceneAxis)
      
      /*
      // Dev helpers
      axesHelper = new AxesHelper(5);
      axesHelper.setColors('red', 'blue', 'green')
      cameraHelper = new CameraHelper(camera);
      scene.add(cameraHelper)
      scene.add(axesHelper) 
      */

      // Renderer
      const canvas = webGl.value;
      renderer = new WebGLRenderer({ canvas, antialias: true });
      renderer.setSize(containerWidth.value, containerHeight.value);
      renderer.setClearColor(0x000000, 0)
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.render(scene, camera);

      // Orbit Controls
      controls = new OrbitControls(camera, canvas);
      controls.target.set(0, 0.01, 0)
      controls.update();

      //Zoom Distances - Max (zoom out) distance is equal to camera Z starting position
      controls.maxDistance = 0.24;
      controls.minDistance = 0.18;

      // controls.enableZoom = false;

      //Vertical Rotation Limiting Angles
      controls.minPolarAngle = (60 * Math.PI)/180;
      controls.maxPolarAngle = (90*Math.PI)/180;

      controls.enablePan = false;
      controls.autoRotate = true;
      controls.enableDamping = true;

      setLighting(renderer)
    };

    const loadGlb = async (source) => {
      let loaderPromise = await loader.loadAsync(source)

      if(loaderPromise){
        let scene = loaderPromise.scene;
        let meshes = scene.children;
        let targetMesh = meshes[0];
        const meshNames = meshes.map((mesh) => {
          console.log("MESHNAME", mesh.name)
          return mesh.name
        })
        console.log('meshNames', meshNames)
  
        return { gltf: loaderPromise, scene, meshes, targetMesh, meshNames, loaded: true }
      } else return {loaded: false}
    }

    const prepareJarForSlideIn = async () => {
      // let smallJarPromise = await smallJarLoader.loadAsync('/assets/glb/jar-150g-v5.glb');
        let {gltf, scene: smallJarScene, meshes, targetMesh, meshNames, loaded} = await loadGlb(smallJarSource)
        console.log("STARTING SJPOS", smallJarScene.position.x, smallJarScene.position.y, smallJarScene.position.z)
        smallJarScene.position.x = 0.5; // Place off-camera
        smallJarScene.visible = false; // Make invisible initially
        scene.add(smallJarScene); // Add to scene but off-camera // REWORK TO GLOBAL VARIABLES
        jarModels['small'] = scene; // Store reference

    };
    const prepareJar = async () => {
      let smallJarPromise = await smallJarLoader.loadAsync('/assets/glb/jar-150g-v5.glb');
      console.log("STARTING SJPOS", smallJarPromise.scene.position.x, smallJarPromise.scene.position.y, smallJarPromise.scene.position.z)
      smallJarPromise.scene.position.x = 0.3; // Place off-camera
      smallJarPromise.scene.position.y = 0.01; // Place off-camera
      smallJarPromise.scene.visible = false; // Make invisible initially
      scene.add(smallJarPromise.scene); // Add to scene but off-camera
      jarModels['small'] = smallJarPromise.scene; // Store reference
    };
    const animateJarOut = (jar, onCompleteCallback) => {
      console.log("animate OUT started")
      console.log("JAR POS BEFORE ANYTHING", jar.position.x, jar.position.y, jar.position.z)
      new TWEEN.Tween(jar.position)
        .to({ x: -0.2 }, 1000) // Move out of view - Very sensitive to X value (use 1 decimal point values)
        // .onUpdate(() => console.log("JarOUT update", jar.lookAt))
        .onComplete(() => {
          onCompleteCallback() // arrow function passed upon animateJarOut call
        })
        .start();
      new TWEEN.Tween(jar.rotation)
      .to({ y: jar.rotation.y + Math.PI * 2 }, 1000) // Complete one full rotation
      .easing(TWEEN.Easing.Linear.None) // Use a linear easing for constant rotation speed
      .start();
    };
    const animateJarOut2 = (jar, onCompleteCallback) => {
      console.log("animate OUT started");
      console.log("JAR POS BEFORE ANYTHING", jar.position.x, jar.position.y, jar.position.z);

      const left = new Vector3(); // Create a new vector to hold the left direction
      const cameraDirection = new Vector3(); // Vector for the camera direction
      camera.getWorldDirection(cameraDirection); // Get the forward vector (pointing from camera towards scene)
      left.crossVectors(camera.up, cameraDirection.negate()).normalize(); // Calculate the left vector as cross product of up and negative forward vector
      const targetPosition = jar.position.clone().add(left.multiplyScalar(0.2)); // Calculate the target position to the left

      new TWEEN.Tween(jar.position)
        .to({ x: targetPosition.x, y: targetPosition.y, z: targetPosition.z }, 1000)
        .onComplete(onCompleteCallback)
        .start();

      new TWEEN.Tween(jar.rotation)
        .to({ y: jar.rotation.y + Math.PI * 2 }, 1000) // Complete one full rotation
        .easing(TWEEN.Easing.Linear.None) // Use a linear easing for constant rotation speed
        .start();
    };

    const animateJarIn = (jar, onCompleteCallback) => {
      console.log("animate IN starting", jar)
      jar.visible = true;
      new TWEEN.Tween(jar.position)
        .to({ x: 0 }, 1000) // Move into the central view
        // .onUpdate(() => console.log("jarIN update", jar.position.x))
        .onComplete(() => {
          // controls.target = jar.children[2].position; // Reset orbit controls target
          // controls.update();
          // let tempAxes = new AxesHelper(5)
          // jar.children[3].add(tempAxes)
        })
        .start();
        new TWEEN.Tween(jar.rotation)
        .to({ y: jar.rotation.y + Math.PI * 2 }, 1000) // Complete one full rotation
        .easing(TWEEN.Easing.Linear.None) // Use a linear easing for constant rotation speed
        .start();
    };
    const animateJarIn2 = (jar, onCompleteCallback) => {
      console.log("animate IN starting", jar);
      jar.visible = true;

      const left = new Vector3();
      const cameraDirection = new Vector3();
      camera.getWorldDirection(cameraDirection);
      left.crossVectors(camera.up, cameraDirection.negate()).normalize();
      const startPosition = jar.position.clone().sub(left.multiplyScalar(0.2)); // Start from slightly to the left
      jar.position.set(startPosition.x, startPosition.y, startPosition.z);

      new TWEEN.Tween(jar.position)
        .to({ x: jar.position.x + left.x * 0.2, y: jar.position.y, z: jar.position.z }, 1000)
        .onComplete(() => {
          // onCompleteCallback(); // Execute callback after animation completes
        })
        .start();

      new TWEEN.Tween(jar.rotation)
        .to({ y: jar.rotation.y + Math.PI * 2 }, 1000) // Complete one full rotation
        .easing(TWEEN.Easing.Linear.None) // Use a linear easing for constant rotation speed
        .start();
    };

    const selectJarSizeTest = async (size) => {
      console.log("Attempting to selectJarSize", size)

      if(size === 'small' && !jarModels['small']) {
        await prepareJar()
      }

      if (currentJarSize.value !== size) {
        animateJarOut(currentJarScene, () => {
          console.log("Removing currentJarScene")
          scene.remove(currentJarScene); // Remove old jar
          console.log("JM SMALL", jarModels[size])
          currentJarScene = jarModels[size]; // Update the current jar
          animateJarIn(currentJarScene); // Animate new jar in
        });
      }
      
      currentJarSize.value = size
    };
    const updateCamera = (newWidth, newHeight) => {
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    };

    const updateRenderer = (newWidth, newHeight) => {
      renderer.setSize(newWidth, newHeight);
      renderer.render(scene, camera);
    };

    function updateContainerSize() {
      if (webGl.value && webGl.value.parentElement) {
        // console.log("webGl.value.parentElement.clientHeight;", webGl.value.parentElement.clientHeight)
        containerWidth.value = webGl.value.parentElement.clientWidth;
        containerHeight.value = webGl.value.parentElement.clientHeight;
      }
    }
    async function setLighting(renderer){
      // // console.log('calling set lighting')
      var pmremGenerator = new PMREMGenerator( renderer );
      let rgbeTexture = await new RGBELoader().loadAsync('/assets/HDR/garden.hdr')
      // // console.log('loader texture', rgbeTexture)
      var envMap = pmremGenerator.fromEquirectangular( rgbeTexture ).texture;
      scene.background = null;
      scene.environment = envMap;
      rgbeTexture.dispose();
      pmremGenerator.dispose();
      pmremGenerator.compileEquirectangularShader();
    }
    
    // async function attachLightToCamera(cam){
    //   light = new PointLight(0xffffff, 1);
    //   light.position.set(targetMesh.position.x, targetMesh.position.y, targetMesh.position.z + 0.5);
    //   cam.add(light)
    // }

    // async function createOrbitControls(){
    //   controls = new OrbitControls(camera, canvas);
    //   controls.target.set(0, 0.01, 0)
    //   controls.update();

    //   //Zoom Distances - Max (zoom out) distance is equal to camera Z starting position
    //   controls.maxDistance = 0.24;
    //   controls.minDistance = 0.18;

    //   // controls.enableZoom = false;

    //   //Vertical Rotation Limiting Angles
    //   controls.minPolarAngle = (60 * Math.PI)/180;
    //   controls.maxPolarAngle = (90*Math.PI)/180;

    //   controls.enablePan = false;
    //   controls.autoRotate = true;
    //   controls.enableDamping = true;
    // }

    async function resetScene(){
      // await setCanvas();
      // animate();
      console.log("scene:", scene)
      let tempPos;
      // const meshAxes = new AxesHelper(5);
      // scene.add(meshAxes)
      let iterations = 0;
      scene.traverse((obj) => {
        if(obj.isMesh){
          let tempAxes = new AxesHelper(5)
          if(iterations === 0){
            console.log("AXESCOLOR 0")
            tempAxes.setColors('red', 'green', 'blue')
          }else if(iterations === 1){
            console.log("AXESCOLOR 1")
            tempAxes.setColors('purple', 'yellow', 'blue')
          }else if(iterations === 2){
            console.log("AXESCOLOR 2")
            tempAxes.setColors('pink', 'brown', 'blue')
            tempPos = obj.position
          }else if(iterations === 3){
            console.log("AXESCOLOR 3")
            tempAxes.setColors('black', 'skyblue', 'blue')
          }
          console.log("OBJ ", obj.name, "is positioned at:", obj.position.x, obj.position.y, obj.position.z, "iteration:", iterations)
          obj.add(tempAxes)
          iterations++
          // console.log("OBJ POS:")
        }
      })
      console.log("Scene pos:", scene.position.x, scene.position.y, scene.position.z)
      console.log("Cam pos:", camera.position.x, camera.position.y, camera.position.z)
      camera.position.set(0, 0, 0.6)
      camera.lookAt(tempPos)
      camera.updateProjectionMatrix();
      console.log("Cam LOOKAT:", camera)
    }

    async function selectJarSize(size){ //add when other model arrives
      if(size === 'small'){
        currentJarSize.value = size
      } else {
        currentJarSize.value = size
      }
    }

    const animate = () => {
      // mesh.rotation.y += 0.01;
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
      TWEEN.update();
      if(LOGTIMER === 0 && animationDONE){
        console.log("scene:", scene.position.x, scene.position.y, scene.position.z )
        // console.log("controls:", controls.target.x, controls.target.y, controls.target.z)
        LOGTIMER++
      }
    };
    
    function getFixedScreenEdges(target) {
      const bbox = new Box3().setFromObject(target);
      const center = bbox.getCenter(new Vector3());
      const size = bbox.getSize(new Vector3());

      // Assuming the jar's width is along the x-axis and constant
      const jarWidthHalf = size.x / 2; 

      // World coordinates of the edges
      const leftWorld = new Vector3(center.x - jarWidthHalf, center.y, center.z);
      const rightWorld = new Vector3(center.x + jarWidthHalf, center.y, center.z);

      leftWorld.project(camera);
      rightWorld.project(camera);

      const widthHalf = 0.5 * renderer.domElement.width;
      const leftEdge = (leftWorld.x + 1) * widthHalf;
      const rightEdge = (rightWorld.x + 1) * widthHalf;

      emitter.emit('meshEdges', {leftEdge, rightEdge})
    }
  
    onMounted( async () => {
      await nextTick();

      updateContainerSize(); // Set initial size
      window.addEventListener('resize', updateContainerSize);

      await setCanvas();

      getFixedScreenEdges(scene.children[0].children[0])

      animate();
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateContainerSize); // Clean up
    });

    watch([containerWidth, containerHeight], ([newWidth, newHeight]) => {
      if (renderer && newWidth && newHeight) {
        // updateCamera(newWidth, newHeight)
        updateRenderer(newWidth, newHeight)
      }
    }, { immediate: true });

    return { 
      webGl, 
      sceneContainer, 
      currentJarSize, 
      resetScene, 
      selectJarSize,
      selectJarSizeTest
    };
  },
};
</script>

<style lang="scss" scoped>
.scene-container{
  position: relative;
  // width: 100%;
  height: 55%;
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
  button:first-child{
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
</style>
