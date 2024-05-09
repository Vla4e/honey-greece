<template>
  <div class="scene-container">
    <!-- <button @click="countUp">{{testCount}}</button> -->
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
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { watch, onMounted, ref, computed } from "vue";
import { useWindowSize } from "@vueuse/core";
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
export default {
  setup() {
    const webGl = ref();
    const img = "../assets/images/earth.jpg";
    // const { width: customWidth, height: customHeight } = useWindowSize();
    const customWidth = 500;
    const customHeight = 500;
    const aspectRatio = computed(() => {
      return customWidth / customHeight;
    });
    let camera: PerspectiveCamera;
    let renderer: WebGLRenderer;
    let scene: Scene;
    let mesh: Mesh;
    let controls: OrbitControls;
    let light: PointLight;

    //Loaders + configuration of loaders
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    // draco.setDecoderConfig({ type: 'js' });
    // draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    // draco.preload();
    // loader.setDRACOLoader = ( draco )
    let currentJarSize = ref('small');
    const setCanvas = async () => {
      // Create Scene
      scene = new Scene();
      // scene.background = new TextureLoader().load("/images/galaxy1.avif");
      
      let loaderPromise = await loader.loadAsync('assets/glb/jar-centered.glb')
      console.log("loaderpromise", loaderPromise)
      // Create Object
      // const geometry = new SphereGeometry(5, 50, 50);
      // const material = new MeshStandardMaterial({
      //   map: new TextureLoader().load("/images/earth2.jpg"),
      // });
      // mesh = new Mesh(geometry, material);
      // scene.add(mesh);
      scene.add(loaderPromise.scene)

      // Lights
      // light = new PointLight(0xffffff, 1);
      light = new HemisphereLight(0xffff, 0x080820, 1);
      light.position.set(50, 50, 50);
      scene.add(light);

      // Camera
      camera = new PerspectiveCamera(35, aspectRatio.value, 0.01, 1000);
      camera.position.z = 0.2;
      scene.add(camera);
      camera.add(light);

      // Renderer
      const canvas = webGl.value;
      renderer = new WebGLRenderer({ canvas, antialias: true });
      renderer.setSize(customWidth, customHeight);
      renderer.setClearColor(0x000000, 0)
      renderer.render(scene, camera);

      // Controls
      controls = new OrbitControls(camera, canvas);
      controls.maxDistance = 0.25;
      controls.minDistance = 0.15;
      controls.minPolarAngle = (45 * Math.PI)/180;
      controls.maxPolarAngle = (100*Math.PI)/180;
      // controls.maxAzimuthAngle = - Math.PI;
      // controls.enablePan = true;
      controls.autoRotate = true;
      controls.enableDamping = true;
      setLighting(renderer)
    };

    const updateCamera = () => {
      // camera.aspect = aspectRatio.value;
      camera.aspect = aspectRatio.value;
      camera.updateProjectionMatrix();
    };

    const updateRenderer = () => {
      renderer.setSize(customWidth, customHeight);
      renderer.render(scene, camera);
    };
    async function setLighting(renderer){
      console.log('calling set lighting')
      var pmremGenerator = new PMREMGenerator( renderer );
      let rgbeTexture = await new RGBELoader().loadAsync('assets/HDR/meadow.hdr')
      console.log('loader texture', rgbeTexture)
      var envMap = pmremGenerator.fromEquirectangular( rgbeTexture ).texture;
      scene.background = null;
      scene.environment = envMap;
      rgbeTexture.dispose();
      pmremGenerator.dispose();
      pmremGenerator.compileEquirectangularShader();
    }
    watch(aspectRatio, (val) => {
      console.log('changed aspectRatio:', val)
      if (val) {
        updateCamera();
        updateRenderer();
      }
    });
    async function resetScene(){
      await setCanvas();
      animate();
    }
    async function selectJarSize(size){ //add when other model arrives
      if(size === 'small'){
        currentJarSize.value = size
        console.log('smallJar selected')
      } else {
        currentJarSize.value = size
        console.log('largeJar selected')
      }
    }
    const animate = () => {
      // mesh.rotation.y += 0.01;
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    onMounted( async () => {
      await setCanvas();
      animate();
    });
    let testCount = 0
    function countUp(){
      console.log('counting up', testCount)
      testCount++
    }
    return { webGl, testCount, currentJarSize, countUp, resetScene, selectJarSize };
  },
};
</script>

<style lang="scss" scoped>
.scene-container{
  position: relative;
  width: 100%;
  height: 100%;
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
  position: absolute;
  bottom: 15%;
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
// .webGl{
//   position: relative;
//   z-index: 1000;
// }
</style>
