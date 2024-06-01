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
  <button class="hdr-switch" @click="switchLighting()">Switch HDR/EXR</button>
  <div class="ratio-container">
    <button class="ratio-switch-0" @click="setPixelRatio(0)"> &lt; pixel ratio</button>
    <span class="ratio-label">current: {{ currentPixelRatio.toFixed(2) }}</span>
    <button class="ratio-switch-1" @click="setPixelRatio(1)"> pixel ratio ></button>
  </div>
</template>
<script>
import { watch, onMounted, onUnmounted, ref, computed, nextTick, reactive } from "vue";
import { useWindowSize } from "@vueuse/core";
import { debounce } from '@/helpers/globalFunctions.js'

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
  Clock,
  LinearMipmapLinearFilter,
  SphereGeometry,
  MeshBasicMaterial,
  Mesh,
  Vector3,
  Quaternion,
} from "three";

//DOF Postprocessing imports:
import { 
  WebGLRenderTarget, 
  ShaderMaterial, 
  UniformsUtils, 
  PlaneGeometry, 
  OrthographicCamera, 
  LinearFilter, 
  RGBAFormat,
  HalfFloatType,
  Raycaster
 } from 'three';
import { BokehShader, BokehDepthShader } from 'three/addons/shaders/BokehShader2.js';

import { initPostprocessing, updateFocusCoords } from '@/helpers/DOFPostProcessing.js';

import Stats from "stats.js";

Cache.enabled = true;
let textureUrl = "assets/exr/lw.exr"

export default {
  setup() {
    //Canvas / Renderer
    let canvas = null;
    const webGl = ref();
    const { width: windowWidth, height: windowHeight } = useWindowSize();
    const aspectRatio = computed(() => {
      return windowWidth.value / windowHeight.value;
    });

    //Postprocessing
    // let postprocessing = {
    //   scene: null,
    //   camera: null,
    //   rtTextureDepth: null,
    //   rtTextureColor: null,
    //   materialBokeh: null,
    //   bokeh_uniforms: null
    // };
    
    const effectController = reactive({
      enabled: true,
      jsDepthCalculation: true,
      shaderFocus: false,
      fstop: 5,
      maxblur: 1.0,
      showFocus: false,
      focalDepth: 2.8,
      manualdof: false,
      vignetting: false,
      depthblur: false,
      threshold: 0.5,
      gain: 2.0,
      bias: 0.5,
      fringe: 0.7,
      focalLength: 35,
      noise: true,
      pentagon: false,
      dithering: 0.0001
    });
    // function updateShaderUniforms() {
    //   let uniforms = postprocessing.bokeh_uniforms;
    //   for (const key in effectController) {
    //     if (key in uniforms) {
    //       if(key === 'focalDepth'){
    //         console.log("FD not updated")
    //       } else {
    //         uniforms[key].value = effectController[key];
    //       }
    //     }
    //   }
    // }
    // watch(effectController, () => {
    //   updateShaderUniforms();
    // }, { deep: true });

    // const depthShader = BokehDepthShader;
    // let materialDepth = new ShaderMaterial({
    //   uniforms: depthShader.uniforms,
    //   vertexShader: depthShader.vertexShader,
    //   fragmentShader: depthShader.fragmentShader
    // });

    // function initPostprocessing() {
    const mouse = reactive({
      x: 0,
      y: 0,
      distance: 1000,
      focalDepth: 0
    });
    const raycaster = new Raycaster();
    function calculateDepthOfField() {
      raycaster.setFromCamera({ x: mouse.x, y: mouse.y }, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      const targetDistance = intersects.length > 0 ? intersects[0].distance : 1000;

      // Update only if the change in target distance is significant
      if (Math.abs(mouse.distance - targetDistance) > 10) {
        mouse.distance += (targetDistance - mouse.distance) * 0.03;
        mouse.distance = Math.max(1, Math.min(mouse.distance, 1000)); // example bounds: 1m to 1000m

        const sdistance = smoothstep(camera.near, camera.far, mouse.distance);
        const ldistance = linearize(1 - sdistance);

        mouse.focalDepth = ldistance;
        postprocessing.bokeh_uniforms['focalDepth'].value = mouse.focalDepth;
      }
    }

    function smoothstep(near, far, depth) {
      const x = Math.max(0, Math.min(1, (depth - near) / (far - near)));
      return x * x * (3 - 2 * x);
    }

    function linearize(depth) {
      const zfar = camera.far;
      const znear = camera.near;
      return -zfar * znear / (depth * (zfar - znear) - zfar);
    }
    function calculateInitialFocus(target) {
      const targetPosition = new Vector3(); // Set this to the target object's position
      const distance = camera.position.distanceTo(targetPosition);
      
      const sdistance = smoothstep(camera.near, camera.far, distance);
      const ldistance = linearize(1 - sdistance);
      
      postprocessing.bokeh_uniforms['focalDepth'].value = ldistance;
    }
    // let postprocessing = initPostprocessing(windowWidth.value, windowHeight.value)

    //   const rtWidth = windowWidth.value;
    //   const rtHeight = windowHeight.value;
      
    //   postprocessing.scene = new Scene();
    //   postprocessing.camera = new OrthographicCamera(-rtWidth / 2, rtWidth / 2, rtHeight / 2, -rtHeight / 2, -10000, 10000);
    //   postprocessing.camera.position.z = 100;

    //   postprocessing.rtTextureDepth = new WebGLRenderTarget(rtWidth, rtHeight, {
    //     minFilter: LinearFilter,
    //     magFilter: LinearFilter,
    //     format: RGBAFormat,
    //     type: HalfFloatType
    //   });

    //   postprocessing.rtTextureColor = new WebGLRenderTarget(rtWidth, rtHeight, {
    //     minFilter: LinearFilter,
    //     magFilter: LinearFilter,
    //     format: RGBAFormat,
    //     type: HalfFloatType
    //   });

    //   const bokeh_shader = BokehShader;
    //   postprocessing.bokeh_uniforms = UniformsUtils.clone(bokeh_shader.uniforms);
    //   postprocessing.bokeh_uniforms["tColor"].value = postprocessing.rtTextureColor.texture;
    //   postprocessing.bokeh_uniforms["tDepth"].value = postprocessing.rtTextureDepth.texture;
		// 		postprocessing.bokeh_uniforms[ 'textureWidth' ].value = windowWidth.value;
		// 		postprocessing.bokeh_uniforms[ 'textureHeight' ].value = windowHeight.value;

    //   postprocessing.materialBokeh = new ShaderMaterial({
    //     uniforms: postprocessing.bokeh_uniforms,
    //     vertexShader: bokeh_shader.vertexShader,
    //     fragmentShader: bokeh_shader.fragmentShader,
    //     defines: {
    //         RINGS: 1,
    //         SAMPLES: 2
    //     }
    //   });

    //   postprocessing.quad = new Mesh( new PlaneGeometry( windowWidth.value, windowHeight.value ), postprocessing.materialBokeh );
		// 		postprocessing.quad.position.z = - 500;
    //   postprocessing.scene.add(postprocessing.quad);
    // }



    //Stats display
    let stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom)
    
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


    //Scene variable definition
    /**
     * @type {THREE.Scene | null}
     */
    let scene = null;

    /**
     * @type {THREE.PerspectiveCamera | null}
     */
    let camera = null;
    let oldCameraPosition = new Vector3();
    let oldCameraQuaternion = new Quaternion();

    /**
     * @type {THREE.OrbitControls | null}
     */
    let orbitControls = null;

    /**
     * @type {THREE.WebGLRenderer | null}
     */
    let renderer = null;
    let modelReady = ref(false);

    //Loaders + configuration of loaders
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    const KTX2_LOADER = new KTX2Loader().setTranscoderPath(
      `libs/basis/`,
    );
    draco.setDecoderConfig({ type: "js" });
    draco.setDecoderPath("libs/draco/gltf/");

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
      // console.log("Enabling mipmaps")
      texture.minFilter = LinearMipmapLinearFilter;  // Set minFilter to use mipmaps
      texture.needsUpdate = true;  // Important to update the texture
    }

    async function loadGlb(source) {
      loader
      .setDRACOLoader(draco)
      .setKTX2Loader(KTX2_LOADER.detectSupport(renderer))
      .setMeshoptDecoder(MeshoptDecoder);

      let loaderPromise = await loader.loadAsync(source)
      console.log("scene", loaderPromise.scene)

      loaderPromise.scene.traverse((obj) => {
        if(obj.isMesh){
          if (obj.material.map) { 
            enableMipmaps(obj.material.map);
          }
          if (obj.material.bumpMap) {
            enableMipmaps(obj.material.bumpMap);
          }
          if (obj.material.normalMap) {
            enableMipmaps(obj.material.normalMap);
          }
        }
      })
      console.log("finished traversal")

      return loaderPromise
    }

    const setCanvas = async () => {
      console.log("calledSetCanvas");
      scene = new Scene();

      //jarscene.glb
      //no_compression.glb
      //low_res_no_compression.glb
      //low_res_10_compression.glb
      let loaderPromise = await loadGlb("assets/glb/huge.glb");
      scene.add(loaderPromise.scene)

      const axesHelper = new AxesHelper(5)
      axesHelper.setColors('red', 'green', 'blue')
      scene.add(axesHelper)
      createPoint(-0.037653, -0.029327, 0.012458)
      //Load Camera from GLB and add to scene
      try {
        // console.log("camera: ", camera)
        camera = new PerspectiveCamera(24, windowWidth.value / windowHeight.value, 0.01, 3)
        // camera.far = 2;
        // camera.near = 0.01;
        camera.aspect = windowWidth.value / windowHeight.value
        // // console.log("CAMPOS", camera.position.x, camera.position.y, camera.position.z )
        camera.position.set(0.20939189082680043,  0.001489, 0.703170240698321);
        let vectorPos = new Vector3(-0.037653, -0.029327, 0.012458)
        camera.lookAt(vectorPos);
        camera.zoom = 10;
        camera.needsUpdate = true;
        // camera.updateProjectionMatrix()
        // camera.position.set( 5, 2, 8 );
        scene.add(camera);
      } catch (e) {
        console.error("Camera not loaded yet");
      }

      //Orbit Controls
      orbitControls = new OrbitControls(camera, canvas);

      //Zoom Distances - Max (zoom out) distance is equal to camera x starting position
      orbitControls.maxDistance = 25;
      orbitControls.minDistance = 0.1;
      // controls.enableZoom = false;
      //Vertical Rotation Limiting Angles
      orbitControls.minPolarAngle = (30 * Math.PI)/180;
      orbitControls.maxPolarAngle = (90 * Math.PI)/180;
      orbitControls.enablePan = true;
      orbitControls.enableDamping = false;
      orbitControls.update();

      await setLighting(renderer);
      modelReady.value = true;
    };

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

    function cameraMoved(){
      // console.log("CAMERAMOVED =======>   ", camera.position.x, camera.position.y, camera.position.z)
      return !camera.position.equals(oldCameraPosition) ||
           !camera.quaternion.equals(oldCameraQuaternion);
    }
    function createPoint(x, y, z, color = 0xff0000, size = 0.001) {
      const geometry = new SphereGeometry(size, 32, 32);
      const material = new MeshBasicMaterial({ color: color });
      const point = new Mesh(geometry, material);
      point.position.set(x, y, z);
      scene.add(point);
      return point;
    }
    function onWindowResize() {
      camera.aspect = windowWidth.value / windowHeight.value;
      camera.updateProjectionMatrix();
      renderer.setSize(windowWidth.value, windowHeight.value);
    }

    const firstAnimate = async (textureUrl) => {
      // webGl should be mounted at this point
      canvas = webGl.value;
      renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
      // renderer.setClearColor(0x000000, 0);
      renderer.setSize(windowWidth.value, windowHeight.value);
      renderer.setPixelRatio(window.devicePixelRatio*0.95);
      console.log("Got canvas and renderer before?", !!canvas, !!renderer)
      await setCanvas(textureUrl).then(() => {
        // startTrackingMouseMovement();
        // initPostprocessing();
        // materialDepth.uniforms[ 'mNear' ].value = camera.near;
        // materialDepth.uniforms[ 'mFar' ].value = camera.far;
        window.addEventListener("resize", onWindowResize, false);
        // updateShaderUniforms()
        animate();
      });
    };

    let clock = new Clock();
    let delta = 0;
    // 30 fps
    let interval = 1 / 30;
    const animate = () => {
      delta += clock.getDelta();
      if (modelReady.value) {
        //set values of rotation object and position vector when scene meshes are added to scene
        // jarRotationObj = scene.children[3].rotation;
        // treesPositionVector = scene.children[2].position;
        if(cameraMoved()){
          if (delta  > interval) { //should render every 33ms.
              stats.begin();
              delta = delta % interval;
              renderer.render(scene, camera);
              stats.end();
          }
        }
        // stats.begin()
        // // calculateDepthOfField();
        // renderer.setRenderTarget(postprocessing.rtTextureColor);
        // renderer.clear();
        // renderer.render(scene, camera);

        // // Render depth into texture using the depth material
        // scene.overrideMaterial = materialDepth;
        // renderer.setRenderTarget(postprocessing.rtTextureDepth);
        // renderer.clear();
        // renderer.render(scene, camera);
        // scene.overrideMaterial = null;

        // // Render postprocessing effect
        // renderer.setRenderTarget(null);
        // renderer.render(postprocessing.scene, postprocessing.camera);
        // stats.end()
        requestAnimationFrame(animate);
      }
    };

    onMounted(async () => {
      await nextTick();
      firstAnimate();
      // webGl.value.addEventListener( 'pointermove', debouncePointerMove );
    });

    function onPointerMove(event) {
      const x = event.clientX / windowWidth.value;
      const y = 1-(event.clientY / windowHeight.value);
      const rect = webGl.value.getBoundingClientRect();
      let x2 = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      let y2 = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      // console.log("X:", event.clientX, windowWidth.value)
      // console.log("X:", event.clientY, windowHeight.value)
      // console.log("FocusCoords:", x2, y2)
      
      mouse.x = x;
      mouse.y = y;
      // postprocessing.bokeh_uniforms['focusCoords'].value.set(x, y);
      updateFocusCoords(postprocessing, x, y);
    }
    const debouncePointerMove = debounce(function(event) {
      console.log("got event")
      onPointerMove(event)
    }, 0);

    function destroyEverything(){
      console.log("Destroying EVERYTHING")
      modelReady.value = false;

      // Dispose renderer
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

      // Clear three.js cache
      Cache.clear();

      // Remove stats from DOM if it exists
      if (stats.dom) {
        document.body.removeChild(stats.dom);
      }

      //Remove postprocessing 
      // if(postprocessing){
      //   if (postprocessing.materialBokeh) postprocessing.materialBokeh.dispose();
      //   if (postprocessing.rtTextureColor) postprocessing.rtTextureColor.dispose();
      //   if (postprocessing.rtTextureDepth) postprocessing.rtTextureDepth.dispose();
      // }
    }

    onUnmounted(()=> {
      destroyEverything()
    })

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

    return { 
      webGl,
      firstAnimate, 
      eventCounter, 
      modelReady, 
      switchLighting, 
      setPixelRatio, 
      currentPixelRatio 
    };
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
.hdr-switch{
  position: absolute;
  bottom: 0%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200000
}

.ratio-container{
  display: flex;
  justify-content: space-around;
  position: absolute;
  bottom: 0%;
  left: 65%;
  z-index: 200000
}
.ratio-switch{
  &-0{
    margin-right: 10px;
  }
  &-1{
  }
}
.ratio-label{
  color: white;
  font-size: 20px;
    margin-right: 25px;
}
</style>
