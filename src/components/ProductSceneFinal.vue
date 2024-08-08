<template>
  <div class="scene-container" ref="sceneContainer">

    <canvas v-show="!isLoading" ref="webGl" class="webGl" />
    <LoadingIndicator style="width: 100px; height: 100px;" v-if="isLoading" class="jar-loading"/>

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
      <!-- <button @click="triggerTextureTransition()" style="position:absolute; top: 80%; left: 50%;">TEXTURE</button> -->
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
      console.log("COMPUTING AR")
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
    //     console.log(!!globalScene.environment)
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




    async function changeMat(){
      // let textureLoad = await loadTexture('/assets/label-textures-2/haa/monoflorals/300g/fir_limited.png')
      // textureLoad.flipY = false;
      // let textureLoad2 = await loadTexture('/assets/label-textures-2/haa/monoflorals/300g/pine_limited.png')
      // textureLoad2.flipY = false;
      console.log("BRAND CONFIGS", brandConfigs[textureUrlSlugs.brand.toUpperCase()].brandProductLines['Monoflorals'].flavours)
      let tempFlavors = brandConfigs[textureUrlSlugs.brand.toUpperCase()].brandProductLines['Monoflorals'].flavours
      let allTextures = []
      async function loadAllTextures(){
        console.log("TEXTURE URL SLUGS", textureUrlSlugs)
        for (let i = 0; i<5; i++) {
          console.log("Loading texture:", tempFlavors[i].urlSlug)
          let tempTexture = await loadTexture(`/assets/label-textures-2/haa/monoflorals/300g/${tempFlavors[i].urlSlug}.png`)
          console.log("FINISHED LOADING")
          tempTexture.flipY = false
          allTextures.push(tempTexture)
        }
      }
      await loadAllTextures();


      // globalScene.traverse((obj)=>{
      //   if(obj.isMesh){
      //     if(obj.name.includes('150g')){
      //       jarSmall.value.push(obj)
      //     } else if (obj.name.includes('300g')){
      //       jarMedium.value.push(obj)
      //     }
      //     if(obj.name === 'label_object_300g'){
      //       labelTest = obj
      //       labelTest.material = new ShaderMaterial({
      //         uniforms: {
      //             textureA: { type: 't', value: textureLoad },
      //             textureB: { type: 't', value: textureLoad2 },
      //             linePosition: { type: 'f', value: 0.0 }
      //         },
      //         vertexShader: `
      //             varying vec2 vUv;
      //             void main() {
      //                 vUv = uv;
      //                 gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      //             }
      //         `,
      //         fragmentShader: `
      //             uniform sampler2D textureA;
      //             uniform sampler2D textureB;
      //             uniform float linePosition;
      //             varying vec2 vUv;
      //             void main() {
      //                 vec4 colorA = texture2D(textureA, vUv);
      //                 vec4 colorB = texture2D(textureB, vUv);
      //                 float blendFactor = step(linePosition, vUv.x);
      //                 gl_FragColor = mix(colorA, colorB, blendFactor);
      //             }
      //         `,
      //         transparent: true
      //       });
      //     }
      //   }
      // })
      console.log("ALREADY ATTEMPTING AMTERIAL")
      globalObj300g.material = new ShaderMaterial({
        uniforms: {
            textures: { value: allTextures },
            currentTextureIndex: { type: 'i', value: 0 },
            nextTextureIndex: { type: 'i', value: 1 },
            transitionProgress: { type: 'f', value: 0.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D textures[10]; // Adjust size based on your needs
            uniform int currentTextureIndex;
            uniform int nextTextureIndex;
            uniform float transitionProgress;
            varying vec2 vUv;

            void main() {
                vec4 currentTextureColor = texture2D(textures[currentTextureIndex], vUv);
                vec4 nextTextureColor = texture2D(textures[nextTextureIndex], vUv);
                gl_FragColor = mix(currentTextureColor, nextTextureColor, transitionProgress);
            }
        `,
        transparent: true,
      });
      globalObj300g.material.needsUpdate = true;
      // const material2 = new ShaderMaterial({
      //   uniforms: {
      //       textures: { value: textures },
      //       currentTextureIndex: { type: 'i', value: 0 },
      //       nextTextureIndex: { type: 'i', value: 1 },
      //       transitionProgress: { type: 'f', value: 0.0 }
      //   },
      //   vertexShader: `
      //       varying vec2 vUv;
      //       void main() {
      //           vUv = uv;
      //           gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      //       }
      //   `,
      //   fragmentShader: `
      //       uniform sampler2D textures[10]; // Adjust size based on your needs
      //       uniform int currentTextureIndex;
      //       uniform int nextTextureIndex;
      //       uniform float transitionProgress;
      //       varying vec2 vUv;

      //       void main() {
      //           vec4 currentTextureColor = texture2D(textures[currentTextureIndex], vUv);
      //           vec4 nextTextureColor = texture2D(textures[nextTextureIndex], vUv);
      //           gl_FragColor = mix(currentTextureColor, nextTextureColor, transitionProgress);
      //       }
      //   `,
      //   transparent: true,
      // });
      // console.log("SMALL", jarSmall.value)
      // console.log("MEDIUM", jarMedium.value)
      loadedText = true
    }

    let matcapType = ref(true);
    function toggleShader(){
      matcapType.value = !matcapType.value
      renderMatcap()
    }
    

    let matcapMaterial;
    function renderMatcap(){
      changeComplexMatcap()
      return
    }

    let tempColor;
    function createComplexMaterialOptions( 
      density = 4.85, 
      light = 0.091, 
      viscosity = 1.03, 
      hPosition = 0.50, 
      hIntensity = 0.50, 
      envMapIntensity = 1.00, 
      viscosityWaviness = 14.00
    ) {
      // console.log("Applying with values: ", density, light, viscosity, hPosition, hIntensity, envMapIntensity, viscosityWaviness);
      // console.log("GOT ENV?", globalScene.environment)
      
      const matcapTexture = globalTextureLoader.load(`/assets/matcaps/45.png`);

      return new ShaderMaterial({
        uniforms: {
          matcap: { value: matcapTexture },
          colorAdjust: { value: new Color("#f5ca2e")},
          time: { value: 0 },
          envMap: { value: globalScene.environment },
          IOR: { value: density.value},
          subSurfaceScatter: { value: light.value},
          viscosity: { value: viscosity.value},
          viscosityWaviness: { value: viscosityWaviness.value},
          highlightPosition: { value: hPosition.value },
          highlightIntensity: { value: hIntensity.value },
          envMapIntensity: { value: envMapIntensity.value},
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying vec3 vWorldPosition;

          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D matcap;
          uniform vec3 colorAdjust;
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
          varying vec3 vWorldPosition;

          vec3 getEnvironmentReflection(vec3 viewDir, vec3 normal) {
            vec3 reflectVec = reflect(viewDir, normal);
            return textureCube(envMap, reflectVec).rgb;
          }

          void main() {
            vec3 viewDir = normalize(vViewPosition);
            vec3 normal = normalize(vNormal);

            // Refraction
            vec3 refractColor = refract(viewDir, normal, 1.0 / IOR);
            vec2 matcapUV = refractColor.xy * 0.5 + 0.5;
            vec3 matcapColor = texture2D(matcap, matcapUV).rgb;

            // Environment reflection with reduced intensity
            vec3 reflColor = getEnvironmentReflection(viewDir, normal) * envMapIntensity;

            // Adjusted Fresnel effect
            float fresnelPower = 3.0;
            float fresnel = pow(1.0 - dot(viewDir, normal), fresnelPower);

            // Subsurface scattering approximation
            vec3 scatterColor = colorAdjust * (1.0 - fresnel) * subSurfaceScatter;

            // Viscosity simulation (subtle movement)
            float viscosityEffect = sin(vWorldPosition.y * viscosityWaviness + time * 0.1) * viscosity;
            matcapColor += vec3(viscosityEffect);

            // Enhanced Vertical highlight
            float verticalHighlight = smoothstep(highlightPosition - 0.1, highlightPosition + 0.1, abs(vWorldPosition.y));
            verticalHighlight = pow(verticalHighlight, 2.0) * highlightIntensity * 2.0;

            // Blend colors with adjusted weights
            vec3 baseColor = mix(matcapColor, reflColor, fresnel * 0.5);
            vec3 finalColor = mix(baseColor, colorAdjust, 0.5);
            finalColor += scatterColor;

            // Apply vertical highlight more prominently
            finalColor += vec3(verticalHighlight);

            // Color depth simulation
            float depth = (vWorldPosition.y + 1.0) * 0.5; // Normalize to 0-1 range
            finalColor *= mix(vec3(1.0), colorAdjust, depth);

            // Enhance transparency effect with reduced environment map influence
            float transparency = smoothstep(0.2, 0.8, abs(dot(viewDir, normal)));
            finalColor = mix(finalColor, reflColor, transparency * 0.2);

            gl_FragColor = vec4(finalColor, 1.0);
          }
        `
      });
    }


    async function testMaterial(
      id
    ) {

      const idl = 11
      const fixedGridPositionl = new Vector3(-0.55, 0.1, 0)
      const densityl = 9.06;
      const lightl = 0.7;
      const viscosityl = 0.82
      const hPositionl =  0.50
      const hIntensityl = 0.50
      const envMapIntensityl = 1.00
      const viscosityWavinessl = 20.00
      // console.log("Creating material with parameters:", 
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
        console.log("TEXTURETEXTURE", matcapTexture)

        console.log("Environment map:", globalScene.environment);

        let testColor = new Color("#c17710");
        return new ShaderMaterial({
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
            float viscosityEffect = sin(time * viscosityWaviness) * viscosity;
            //OLD
            //float viscosityEffect = sin(fixedGridPosition.y * viscosityWaviness + time * 0.1) * viscosity;
            matcapColor += vec3(viscosityEffect);

            // Vertical highlight
            float verticalHighlight = smoothstep(highlightPosition - 0.1, highlightPosition + 0.1, fract(time * 0.1));
            //OLD
            //float verticalHighlight = smoothstep(highlightPosition - 0.1, highlightPosition + 0.1, abs(fixedGridPosition.y));
            verticalHighlight = pow(verticalHighlight, 2.0) * highlightIntensity * 2.0;

            // Blend colors
            vec3 baseColor = mix(matcapColor, reflColor, fresnel * 0.8);
            vec3 finalColor = mix(baseColor, colorAdjust, 0.5);
            finalColor += scatterColor;
            finalColor += vec3(verticalHighlight);

            // Color depth simulation
            float depth = 0.5 + sin(time * 0.1) * 0.5;
            //OLD
            //float depth = (fixedGridPosition.y + 1.0) * 0.5;
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
      } catch (e) {
        console.log("Error while loading matcap texture", e)
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
      let position = new Vector3(-0.55, 0.1, 0)
      // let pos = new Vector3(0, 0, 0)
      let testId = 41;
      const tempPos = globalObj150g.position.clone()
      globalObj150g.position.set(-0.55, 0.1, 0)


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
        position,
        density, 
        light, 
        viscosity, 
        hPosition, 
        hIntensity, 
        envMapIntensity, 
        viscosityWaviness // viscosityWaviness
      )
      
      globalObj150g.position.copy(tempPos);
      console.log("material2 Uniforms", material2)
      
      // const material = createComplexMaterialOptions(
      //   density, 
      //   light, 
      //   viscosity, 
      //   hPosition, 
      //   hIntensity, 
      //   envMapIntensity, 
      //   viscosityWaviness
      // );
      // console.log("GOT MATERIAL", material2)
      // Assuming globalObj300g and globalObj150g are defined elsewhere
      if (globalObj300g) {
        globalObj300g.material = material2;
        globalObj300g.material.needsUpdate = true;
      }
      if (globalObj150g) {
        globalObj150g.material = material2;
        globalObj150g.material.needsUpdate = true;
      }
    }

    let labelMeshes;
    let globalObj300g;
    let globalObj150g;
    let globalGlass150g;
    let globalGlass300g;

    const setCanvas = async () => {

      let tempSize = currentJarSize.value === 'medium' ? '300g' : currentJarSize.value === 'large' ? '450g' : '150g' //values used are in grams
      // Create Scene
      isLoading.value = true
      globalScene = new Scene();

      // let jarPromise = await loadGlbReturnParts(loader, jarConfigs.medium.source)
      let mediumSmallScene = await loadGlbReturnParts(loader, '/assets/glb/newJars/300-150-animation-choppy-v6.glb')
      // let mediumSmallScene = await loadGlbReturnParts(loader, '/assets/glb/newJars/450-300-animation-choppy-v2.glb')
      console.log("medium small scene", mediumSmallScene)

      mixer = initializeMixer(mediumSmallScene.scene)
      // mediumSmallScene.scene.position.set(0.25, -0.15, 0.1)
      globalScene.add(mediumSmallScene.scene)


      // TEST remove label glass jar
      globalScene.traverse((obj)=>{
        if(obj.isMesh){
          if(obj.name === 'honey_object_300g'){
            // changeMatcap(obj)
            globalObj300g = obj
          } else if (obj.name === 'honey_object_150g'){
            globalObj150g = obj;
          } else if (obj.name.includes('jar')){
            console.log("OBJ TRANSMISSION", obj.name)
            if(obj.name === "jar_object_150g"){
              globalGlass150g = obj
            } else {
              globalGlass300g = obj
            }
            // obj.material.transparent = true;
            // obj.material.opacity = 0;
          }
          if(obj.name.includes('150g')){
            jarSmall.value.push(obj)
          } else if (obj.name.includes('300g')){
            jarMedium.value.push(obj)
          }
          if(obj.name.includes('label')){
            // obj.material.opacity = 0;
            if(obj.name.includes(tempSize)){
              currentJarLabel = obj
            } else upcomingJarLabel = obj
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
        // console.log("ISMOBILE")
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
    };

    async function computeTexture() {
      isFirstLoad = false;
      const baseTextureUrl = '/assets/label-textures-2';


      // load if not
      let jarTexturesLocal = []
      for (const size of jarSizes) {
        let textureUrl = `${baseTextureUrl}/${textureUrlSlugs.brand}/${textureUrlSlugs.productLine}/${size}/${textureUrlSlugs.flavour}.png`;
        let texture = await loadTexture(textureUrl);
        texture.flipY = false;
        texture.generateMipMaps = true;
        texture.needsUpdate = true;
        jarTexturesLocal.push({ texture, size });
      }

      return jarTexturesLocal
    }

    async function updateTexture() {
      isLoadingTexture = true;

      //
      if(!currentJarScene){
        isLoadingTexture = false
        return
      }

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
      
      let textures = await computeTexture();

      textures.forEach((object) => {
        if(object.size === currentJarSizeGrams.value){
          currentJarLabel.material.map = object.texture
          currentJarLabel.material.needsUpdate = true;
        } else {
          upcomingJarLabel.material.map = object.texture
          upcomingJarLabel.material.needsUpdate = true;
        }
      })
        // labelMesh.material.map = texture;
        // labelMesh.material.needsUpdate = true;
      isLoadingTexture = false
    }


  

    const selectJarSize = async (size) => {
      if(size === currentJarSize.value){
        return
      } else {
        textureUrlSlugs.size = size === 'small' ? '150g' : size === 'medium' ? '300g' : '450g'
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
      globalScene.environmentIntensity = 0.2;
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
    let transitionDuration = 1.0; // Duration of the texture transition in seconds
    let transitionStartTime = 0; // Start time of the transition
    let isTransitioning = false;
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
      // initiateObjectRotation(currentJarScene, webGl.value.parentElement)
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
      matcapMaterial = null;
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
    }), (currentValues, previousValues) => {

      //Set local size to grams, set global values of jar sizes
      let gramSize = currentValues.size === 'large' ? '450g' : currentValues.size === 'medium' ? '300g' : '150g';
      currentJarSize.value = currentValues.size
      currentJarSizeGrams.value = gramSize
      if(currentValues.brand === 'okto'){
        jarSizes = ['450g', '300g']
      } else jarSizes = ['300g', '150g']

      // console.log("JSIZES", jarSizes)
      // console.log("PROPS WATCHER ===============================");
      // console.log("flavour |", currentValues.flavour, textureUrlSlugs.flavour, currentValues.flavour !== textureUrlSlugs.flavour);
      // console.log("brand |", currentValues.brand, textureUrlSlugs.brand, currentValues.brand !== textureUrlSlugs.brand);
      // console.log("productLine |", currentValues.productLine, textureUrlSlugs.productLine, currentValues.productLine !== textureUrlSlugs.productLine);
      // console.log("size |", gramSize, textureUrlSlugs.size, gramSize !== textureUrlSlugs.size);
      // console.log("PROPS WATCHER ===============================");

      if ( 
        currentValues.flavour !== textureUrlSlugs.flavour ||
        currentValues.productLine !== textureUrlSlugs.productLine ||
        currentValues.brand !== textureUrlSlugs.brand ||
        gramSize !== textureUrlSlugs.size 
      )
      {
        textureUrlSlugs = {
          flavour: currentValues.flavour,
          productLine: currentValues.productLine,
          brand: currentValues.brand,
          size: gramSize
        };
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
      toggleShader,
      renderMatcap,
      matcapType,
      jarSmall,
      jarMedium,
      isLoading,
      triggerTextureTransition
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
