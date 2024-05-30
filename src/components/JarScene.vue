<template>
  <div v-if="!modelReady" class="test-screen">Loading scene...</div>
  <div
    v-show="modelReady"
    class="jar-sc-container"
    ref="canvasContainer"
    id="canvasContainer"
  >
    <canvas ref="webGl" class="webGl jar-sc-canvas" />
  </div>
</template>
<script>
import { watch, onMounted, ref, computed } from "vue";
import { useWindowSize } from "@vueuse/core";

import Stats from "stats.js";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  PMREMGenerator,
  AxesHelper,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
} from "three";

export default {
  setup() {
    let stats = new Stats();
    //ref to canvas, window size
    stats.showPanel(0);
    document.body.appendChild(stats.dom)
    const webGl = ref();
    const { width: windowWidth, height: windowHeight } = useWindowSize();
    // console.log("Window size and width from useWindowSize", windowWidth, windowHeight);

    //panScene() settings
    let rotationDegrees = 1;
    let rotationRadians = (rotationDegrees * Math.PI) / 180; //convert degrees into radians
    let jarRotationObj;
    let treesPositionVector;
    //Mouse movement events before triggering panScene()
    let eventCounter = 0;
    let eventsBeforeTrigger = 1;
    // "ENUMS" for scene panning parallax effect || ctrl+f -> panScene()
    const [topLeft, bottomLeft, topRight, bottomRight] = [1, 2, 3, 4];

    const aspectRatio = computed(() => {
      return windowWidth.value / windowHeight.value;
    });

    //Scene variable definition
    /**
     * @type {THREE.Scene | null}
     */
    let scene = null;
    /**
     * @type {THREE.PerspectiveCamera | null}
     */
    let camera = null;
    let orbitControls = null;
    /**
     * @type {THREE.WebGLRenderer | null}
     */
    let renderer = null;
    let modelReady = ref(false);

    //Loaders + configuration of loaders
    const loader = new GLTFLoader();
    const backgroundLoader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderConfig({ type: "js" });
    draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
    draco.preload();
    loader.setDRACOLoader(draco);
    backgroundLoader.setDRACOLoader(draco);

    async function setLighting(renderer) {
      // console.log("calling set lighting");
      var pmremGenerator = new PMREMGenerator(renderer);
      let rgbeTexture = await new RGBELoader().loadAsync("assets/HDR/test-hdr.hdr");
      // console.log("loader texture", rgbeTexture);
      var envMap = pmremGenerator.fromEquirectangular(rgbeTexture).texture;
      scene.background = null;
      scene.environment = envMap;
      rgbeTexture.dispose();
      pmremGenerator.dispose();
      pmremGenerator.compileEquirectangularShader();
    }
    const setCanvas = async () => {
      // console.log("calledSetCanvas");
      scene = new Scene();
      //XYZ axes
      // scene.add(new AxesHelper(5))
      let loaderPromise = await loader.loadAsync("assets/glb/home-v2.glb");
      console.log("loaderPromise", loaderPromise)
      // let backgroundLoaderPromise = await backgroundLoader.loadAsync(
      //   "assets/glb/background.glb"
      // );
      scene.add(loaderPromise.scene)
      const axesHelper = new AxesHelper(5)
      axesHelper.setColors('red', 'green', 'blue')
      scene.add(axesHelper)
      // console.log("loaderPromise", loaderPromise);
      // // console.log("BLPCHILDREN", backgroundLoaderPromise.scene.children)
      // // console.log('loader', loaderPromise)
      // // console.log("loader.scene.children", loaderPromise.scene.children)
      //Load Camera from GLB and add to scene
      try {
        camera = loaderPromise.cameras[0];
        camera.aspect = windowWidth.value / windowHeight.value
        console.log("CAMPOS", camera.position.x, camera.position.y, camera.position.z )
        // camera = new PerspectiveCamera(40, windowWidth.value / windowHeight.value, 0.2, 10)
        // camera.position.set(0, 0.2, -0.8);
        camera.lookAt(0, 0, 0);
        scene.add(camera);
      } catch (e) {
        console.error("Camera not loaded yet");
      }

      // Renderer
      const canvas = webGl.value;
      renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setClearColor(0x000000, 0);
      renderer.setSize(windowWidth.value, windowHeight.value);
      
      orbitControls = new OrbitControls(camera, canvas);
      // globalOrbitControls.position.set(0, 0.02, 0)
      orbitControls.target.set(0, 0.02, 0)
      orbitControls.update();

      //Zoom Distances - Max (zoom out) distance is equal to camera x starting position
      orbitControls.maxDistance = 1.5;
      orbitControls.minDistance = 0.18;

      // controls.enableZoom = false;

      //Vertical Rotation Limiting Angles
      orbitControls.minPolarAngle = (30 * Math.PI)/180;
      orbitControls.maxPolarAngle = (90 * Math.PI)/180;

      orbitControls.enablePan = true;
      orbitControls.enableDamping = true;
      await setLighting(renderer);
      modelReady.value = true;
    };

    watch(modelReady, (val) => {
      // console.log("VAL CHANGE", val);
      if (val) {
      }
    });

    const firstAnimate = async () => {
      await setCanvas().then(() => {
        // startTrackingMouseMovement();
        window.addEventListener("resize", onWindowResize, false);
        animate();
      });
    };
    const animate = () => {
      stats.begin();
      if (modelReady.value) {
        //set values of rotation object and position vector when scene meshes are added to scene
        // jarRotationObj = scene.children[3].rotation;
        // treesPositionVector = scene.children[2].position;
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      }
      stats.end();
    };

    onMounted(async () => {
      // console.log("mounted - modelReady", modelReady.value);
      firstAnimate();
      // camera.position.x = (e.clientX - centerX) * mouseTolerance;
      // camera.position.y = (e.clientY - centerY) * mouseTolerance;
      // renderer.render(scene.camera)
      // firstAnimate();
      // // console.log('about to await setCanvas')
      // await setCanvas();
      // animate();
      // // console.log('animation:', animation)
    });
    function onWindowResize() {
      camera.aspect = windowWidth.value / windowHeight.value;
      camera.updateProjectionMatrix();
      renderer.setSize(windowWidth.value, windowHeight.value);
    }
    function checkMousePosition(event) {
      if (modelReady.value) {
        if (eventCounter % eventsBeforeTrigger === 0) {
          // mouse movement events before triggering panScene()
          // // console.log('Checking mouse position')
          panCamera(event);
        }
        eventCounter++;
      }
    }
    function startTrackingMouseMovement() {
      // console.log("starting mouse tracking ! ! !");
      document.getElementById("app").addEventListener("mousemove", (event) => {
        checkMousePosition(event);
      });
    }
    function panCamera(event) {
      let mouseToleranceX = 0.0001;
      let mouseToleranceY = 0.0001;
      let centerX = window.innerWidth * 0.5;
      let centerZ = window.innerHeight * 0.5;
      let newX = (event.clientX - centerX) * mouseToleranceX;
      let newY = (event.clientY - centerZ) * mouseToleranceY;
      camera.position.x = newX;
      camera.position.z = newY;
    }
    return { webGl, firstAnimate, eventCounter, modelReady };
  },
};
</script>
<style lang="scss" scoped>
.jar-sc-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1;
  margin-bottom: 5vh;
}
.animation-controls {
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: center;
  margin-bottom: 30px;
  .small-button {
    margin-right: 10px;
  }
  .small-button:last-child {
    margin-right: 0px;
  }
}
.jar-sc-canvas {
  // position: absolute;
  // top: 0;
  // left:0;
}
.test-screen {
  background: black;
  opacity: 0.7;
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  font-size: 64px;
  text-align: center;
  z-index: 100;
}
</style>
