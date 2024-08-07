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
import { watch, onMounted, onUnmounted, ref, computed } from "vue";
import { useWindowSize } from "@vueuse/core";

import Stats from "stats.js";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  PMREMGenerator,
  AxesHelper,
  Cache,
  Fog,
  PointLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  LinearMipmapLinearFilter,
} from "three";

Cache.enabled = true;
let textureUrl = "assets/exr/lw.exr"
export default {
  setup() {
    console.log("MOBILE LOADER")
    //ref to canvas, window size
    const webGl = ref();
    const { width: windowWidth, height: windowHeight } = useWindowSize();

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
    // const backgroundLoader = new GLTFLoader();
    const draco = new DRACOLoader();
    const KTX2_LOADER = new KTX2Loader().setTranscoderPath(
      `node_modules/three/examples/jsm/libs/basis/`,
    );
    draco.setDecoderConfig({ type: "js" });
    draco.setDecoderPath("node_modules/three/examples/jsm/libs/draco/gltf/");
    // draco.preload();
    loader.setDRACOLoader(draco)
    //	.setMeshoptDecoder(MeshoptDecoder);
    // backgroundLoader.setDRACOLoader(draco);
    
    //Canvas / Renderer
    let canvas = null;

    async function setLighting(renderer) {
      // console.log("calling set lighting");
      var pmremGenerator = new PMREMGenerator(renderer);
      let exrTexture = await new EXRLoader().loadAsync(textureUrl)
      console.log("EXRTEXTURE", exrTexture) 
      // let rgbeTexture = await new RGBELoader().loadAsync("assets/HDR/test-hdr.hdr");
      // // console.log("loader texture", rgbeTexture);
      let envMap = pmremGenerator.fromEquirectangular(exrTexture).texture;
      // pmremGenerator.compileEquirectangularShader();
      scene.background = envMap;
      scene.environment = envMap;
      pmremGenerator.dispose()
      exrTexture.dispose();
      // rgbeTexture.dispose();
      // pmremGenerator.dispose();
      // pmremGenerator.compileEquirectangularShader();
    }
    function enableMipmaps(texture) {
      console.log("Enabling mipmaps")
      texture.minFilter = LinearMipmapLinearFilter;  // Set minFilter to use mipmaps
      texture.needsUpdate = true;  // Important to update the texture
    }
    async function loadGlb(source) {
      loader.setKTX2Loader(KTX2_LOADER.detectSupport(renderer)).setMeshoptDecoder(MeshoptDecoder);
      let loaderPromise = await loader.loadAsync(source)
      console.log("LP", loaderPromise.scene)
      // loaderPromise.scene.traverse((obj) => {
      //   if(obj.isMesh){
      //     console.log("Obj material", obj.material.transparent)
      //     if(obj.material.transparent){
      //       console.log("Before update", obj.material.transparent);
      //       obj.material.transparent = false;
      //       obj.material.opacity = 1;
      //       obj.material.needsUpdate = true;
      //       console.log("After update", obj.material.transparent);
      //     }
      //     // obj.material.transparent = false
      //     // if (obj.material.map) {  // Check if the mesh has a texture mapped
      //     //   enableMipmaps(obj.material.map);
      //     // }
      //     // // Also check other textures like bumpMap, normalMap, etc. if needed
      //     // if (obj.material.bumpMap) {
      //     //   enableMipmaps(obj.material.bumpMap);
      //     // }
      //     // if (obj.material.normalMap) {
      //     //   enableMipmaps(obj.material.normalMap);
      //     // }
      //   }
      // })
      console.log("finished traversal")
      return loaderPromise
      console.log("promise", loaderPromise.scene )
      if(loaderPromise){
        loaderPromise.scene.name = source
        let scene = loaderPromise.scene;
        scene.position.set(0, 0, 0)
        // const axesHelperNew = new AxesHelper(5)
        // scene.add(axesHelperNew)
        let meshes = scene.children;
        let targetMesh = meshes[0];
        const meshNames = meshes.map((mesh) => {
          // // console.log("MESHNAME", mesh.name)
          return mesh.name
        })
        // // console.log('meshNames', meshNames)
  
        return { gltf: loaderPromise, scene, meshes, targetMesh, meshNames, loaded: true }
      } else return {loaded: false}
    }
    const setCanvas = async () => {
      console.log("calledSetCanvas");
      scene = new Scene();
      //XYZ axes
      // scene.add(new AxesHelper(5))

      let loaderPromise = await loadGlb("assets/glb/jarscene-mobile-v1.glb");
      console.log("Loaded glb: ", loaderPromise)
      scene.add(loaderPromise.scene)
      const axesHelper = new AxesHelper(5)
      axesHelper.setColors('red', 'green', 'blue')
      scene.add(axesHelper)

      //Load Camera from GLB and add to scene
      try {
        // camera = loaderPromise.cameras[0].clone();
        console.log("camera: ", camera)
        camera = new PerspectiveCamera(40, windowWidth.value / windowHeight.value, 0.01, 3)
        camera.far = 2;
        camera.near = 0.01;
        camera.aspect = windowWidth.value / windowHeight.value
        // // console.log("CAMPOS", camera.position.x, camera.position.y, camera.position.z )
        camera.position.set(-0.18599549214422342, -0.03974181830952136, -0.4301602440654409);
        camera.lookAt(-0.05, -0.03974181830952136, 0);
        // camera.position.set( 5, 2, 8 );
        scene.add(camera);
      } catch (e) {
        console.error("Camera not loaded yet");
      }

      //Orbit Controls
      orbitControls = new OrbitControls(camera, canvas);
      orbitControls.update();

      //Zoom Distances - Max (zoom out) distance is equal to camera x starting position
      orbitControls.maxDistance = 25;
      orbitControls.minDistance = 0.18;
      // controls.enableZoom = false;
      //Vertical Rotation Limiting Angles
      orbitControls.minPolarAngle = (60 * Math.PI)/180;
      orbitControls.maxPolarAngle = (90 * Math.PI)/180;
      orbitControls.enablePan = true;
      orbitControls.enableDamping = false;

      await setLighting(renderer);
      modelReady.value = true;
    };

    // watch(modelReady, (val) => {
    //   // console.log("VAL CHANGE", val);
    //   if (val) {
    //   }
    // });
    function switchLighting() {
      if(textureUrl.includes('lw.exr')){
        textureUrl = 'assets/exr/bright.exr'
      } else textureUrl = "assets/exr/lw.exr"
      destroyEverything()
      firstAnimate()
    }

    let currentPixelRatio = ref(window.devicePixelRatio)
    function setPixelRatio(flag){
      if(flag) {
        currentPixelRatio.value += 0.1
      } else {
        currentPixelRatio.value -= 0.1
      }
      renderer.setPixelRatio(currentPixelRatio.value)
    }
    const firstAnimate = async (textureUrl) => {
      // webGl should be mounted at this point
      canvas = webGl.value;
      renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
      // renderer.setClearColor(0x000000, 0);
      renderer.setSize(windowWidth.value, windowHeight.value);
      renderer.setPixelRatio(window.devicePixelRatio);
      console.log("Got canvas and renderer before?", !!canvas, !!renderer)
      await setCanvas(textureUrl).then(() => {
        // startTrackingMouseMovement();
        window.addEventListener("resize", onWindowResize, false);
        animate();
      });
    };
    const animate = () => {
      if (modelReady.value) {
        //set values of rotation object and position vector when scene meshes are added to scene
        // jarRotationObj = scene.children[3].rotation;
        // treesPositionVector = scene.children[2].position;
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
        // console.log("CAMPOS:", camera.position.x,camera.position.y,camera.position.z,)
      }
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
    function destroyEverything(){
      console.log("Destroying EVERYTHING")
      modelReady.value = false;

      // Dispose renderer and its resources
      if (renderer) {
        renderer.dispose();
      }

      // Dispose scene objects
      if (scene) {
        scene.traverse(function (object) {
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
          }
        });
      }

      // Dispose controls
      if (orbitControls) {
        orbitControls.dispose();
      }

      // Remove event listeners
      window.removeEventListener("resize", onWindowResize);

      // Clear three.js caches
      Cache.clear();

      // Remove stats from DOM if it exists
      if (stats.dom) {
        document.body.removeChild(stats.dom);
      }
    }

    onUnmounted(()=> {
      destroyEverything()
    })
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
    return { webGl, firstAnimate, eventCounter, modelReady, switchLighting, setPixelRatio, currentPixelRatio };
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
