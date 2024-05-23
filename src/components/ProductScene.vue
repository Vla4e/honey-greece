<template>
  <div class="scene-container" ref="sceneContainer">
    <canvas ref="webGl" class="webGl" />
    <button class="reset-button" @click="resetScene">X</button>
    <div class="size-selection">
      <button @click="selectJarSize('small')" :class="currentJarSize === 'small' ? 'selected': ''" class="small-jar">
        300g
      </button>
      <button @click="selectJarSize('large')" :class="currentJarSize === 'large' ? 'selected': ''" class="large-jar">
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
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { watch, onMounted, onUnmounted,  ref, computed, nextTick, inject  } from "vue";
import { useWindowSize } from "@vueuse/core";
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
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

    //Loaders + configuration of loaders
    const loader = new GLTFLoader();
    const newJarLoader = new GLTFLoader();
    const draco = new DRACOLoader();
    // draco.setDecoderConfig({ type: 'js' });
    // draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    // draco.preload();
    // newJarLoader.setDRACOLoader = ( draco )
    let currentJarSize = ref('small');
    const setCanvas = async () => {
      // Create Scene
      scene = new Scene();
      // let newJarLoaderPromise = await newJarLoader.loadAsync('/assets/glb/jar-300g-latest.glb')
      let newJarLoaderPromise = await newJarLoader.loadAsync('/assets/glb/300g-honey.glb')
      
      newJarLoaderPromise.scene.traverse(function (obj) {
        if(obj.isMesh){
          // console.log("ISMESH:", obj.name)
          if(obj.name === 'med'){
            
            obj.material.transparent = true;
            obj.material.opacity = 1;
          } else if(obj.name === 'med_1'){ //GLASS
          } else if(obj.name === 'med_2'){ // LID
          } else if(obj.name === 'med_3'){ //LABEL
          }
        }
      })

      let jarScene = newJarLoaderPromise.scene.children[0] //Scene to be loaded
      let meshes = newJarLoaderPromise.scene.children[0].children;
      let targetMesh = meshes[1]

      scene.add(jarScene)

      // Lights (added to camera below)
      light = new PointLight(0xffffff, 1);
      light.position.set(targetMesh.position.x, targetMesh.position.y, targetMesh.position.z + 0.5);


      // Camera
      camera = new PerspectiveCamera(25, aspectRatio.value, 0.1, 1000);
      camera.position.set(targetMesh.position.x, targetMesh.position.y, targetMesh.position.z + 0.24); // Position the camera in front of the mesh
      camera.add(light);
      scene.add(camera);
      
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

    async function resetScene(){
      await setCanvas();
      animate();
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
      // const bboxHelper = new BoxHelper(scene.children[0].children[0], 0xff0000);
      // scene.add(bboxHelper)

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

    return { webGl, sceneContainer, currentJarSize, resetScene, selectJarSize };
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
