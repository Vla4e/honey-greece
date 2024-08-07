<template>
  <div class="scene-container" ref="sceneContainer">

    <canvas ref="webGl" class="webGl" />
    <div class="instructions" style="position: absolute; bottom: 2%; left: 0%; width: 50%; color: black;">
      Left click: Rotate.
      <br/>
      Right click: Move.
      <br/>
      Scroll: zoom
      <br/>
      Refresh to reset
    </div>
    <div class="target" style="position: absolute; top: 5%; left: 6%; display: flex; width: 40%;">
      <button style="margin-right:10px" @click="removeLabel('label')">Show Labels: {{ showLabels }}</button>
      <button style="margin-right:10px" @click="removeGlass('jar')">Show Glass: {{ showGlass }}</button>
      <button style="margin-right:10px" @click="cycleMaterial()">Custom Shader: {{ useMaterial }}</button>
    </div>
    <div v-if="useMaterial === 'complex' || useMaterial === 'complexOptions'" class="material-controls" style="position: absolute; bottom: 5%; left: 35%; width: 600px; background: rgba(255,255,255,0.7); padding: 10px;">
      <label>Density: {{ density }}</label>
      <input type="range" v-model="density" min="1" max="20" step="0.01">
      <label>Light: {{ light }}</label>
      <input type="range" v-model="light" min="0" max="10" step="0.01">
      <label>Viscosity: {{ viscosity }}</label>
      <input type="range" v-model="viscosity" min="0" max="10" step="0.01">
      <!-- <label>Highlight position: {{ hPosition }}</label>
      <input type="range" v-model="hPosition" min="0" max="5" step="0.01">
      <label>Highlight intensity: {{ hIntensity }}</label>
      <input type="range" v-model="hIntensity" min="0" max="5" step="0.01"> -->
      <!-- <label>envMapIntensity intensity: {{ envMapIntensity }}</label>
      <input type="range" v-model="envMapIntensity" min="0" max="5" step="0.01"> -->
      <label v-if="useMaterial === 'complexOptions'">viscosityWaviness: {{ viscosityWaviness }}</label>
      <input v-if="useMaterial === 'complexOptions'" type="range" v-model="viscosityWaviness" min="5" max="100" step="1">
      <button @click="applyMaterialChanges">Apply Changes</button>
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
sRGBEncoding,
SRGBColorSpace,
//
ACESFilmicToneMapping,
CineonToneMapping,
ReinhardToneMapping,
LinearToneMapping,
NoToneMapping,

} from "three";

import { InstancedMesh, Object3D, Matrix4, Group, ShaderMaterial, MeshMatcapMaterial } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { watch, onMounted, onUnmounted,  ref, computed, nextTick, inject, toRaw  } from "vue";
// let brandSizes = {}


//Loader imports
import {
  initializeGLTFLoader,
  loadGlb,
  loadGlbReturnParts,
  loadTexture,
  loadEnvironment
} from '@/helpers/loaders.js'

import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

import { debounce } from '@/helpers/globalFunctions.js'


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

    
    let honeyColor = new Color('#ffc107'); //STARTING COLOR
    // let honeyColor = '#ff0000'; //STARTING COLOR

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

    let globalOrbitControls;
    
    let LOGTIMER = 0;
    let animationDONE = false;
    let isLoadingTexture = false;
    let isAnimationYActive = false;
    let isFirstLoad = true;
    const resetDuration = 1000;

    /**
     * @type {THREE.Scene | null}
     */
    let currentJarScene = null;
    let currentJarSize = ref(jarConfigs.medium.name);
    let jarScenes = {}; // store loaded model to avoid reloading

    let currentJarLabel = null;
    let upcomingJarLabel = null;
    


    let jarSizes = [];

    let loadedText = false;

    const globalTextureLoader = new TextureLoader();
    let jarPositions = []
    let worldPosition = new Vector3(0.15000002, -0.1, 0.0)
    function createMatcapGrid(gridWidth = 12, gridHeight = 5, spacing = 0.1) {
      console.log("CREATING GRID NOW")
      if (!globalScene || !currentJarScene) {
        console.error("Scene or jar scene not initialized");
        return;
      }

      globalScene.remove(currentJarScene);

      const jarGroup = new Group();
      let iterations = 0;
      let maxIterations = 46;
      let idx = 0;
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          if(iterations < maxIterations){
            const jarClone = currentJarScene.clone(true);
            let xN = (x - (gridWidth - 1) / 2);
            let yN = ((gridHeight - 1) / 2 - y);
            // Adjust positioning for vertical grid
            const xPos = xN * spacing;
            const yPos = yN * spacing; // Inverted y-axis
            
            
            jarClone.position.set(xPos, yPos, 0);
            jarPositions.push(jarClone.position)
            jarClone.traverse((obj) => {
              if (obj.isMesh && obj.name === 'honey_object_300g') {
                const matcapId = idx;
                
                if(useMaterial.value === 'fixed'){
                  obj.material = createFixedMaterial(idx)
                  if(!honeyObject){
                    honeyObject = obj
                    console.log("THIS IS THE HONEYOBJ !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", honeyObject.name, idx)
                  }
                } else if( useMaterial.value === 'matcap'){
                  obj.material = createMatcapMaterial(idx)
                  if(!honeyObject){
                    honeyObject = obj
                    console.log("THIS IS THE HONEYOBJ", honeyObject.name)
                  }
                } else if( useMaterial.value === 'complexOptions'){
                  // console.log("CREATING COMPELXMATOPT", idx)
                  obj.material = createComplexMaterialOptions(idx,  density.value, light.value, viscosity.value, hPosition.value, hIntensity.value, envMapIntensity.value, viscosityWaviness.value)
                  if(!honeyObject){
                    honeyObject = obj
                    console.log("THIS IS THE HONEYOBJ", honeyObject.name)
                  }
                } else {
                  obj.material = createComplexMaterial(idx,  density.value, light.value, viscosity.value)
                  if(!honeyObject){
                    honeyObject = obj
                    console.log("THIS IS THE HONEYOBJ", honeyObject.name)
                  }
                }
                obj.name = `matcapped-${matcapId}`
                idx++
              }
            })
            jarGroup.add(jarClone);
            iterations++;
          } else {}
        }
      }
      globalScene.add(jarGroup);
      console.log("JARPOS", jarPositions)
      // Adjust camera to view the vertical grid
      const gridWidthSize = (gridWidth - 1) * spacing;
      const gridHeightSize = (gridHeight - 1) * spacing;
      const maxGridSize = Math.max(gridWidthSize, gridHeightSize);
      const cameraDistance = (maxGridSize / 2) / Math.tan((globalCamera.fov * Math.PI / 180) / 1.1);
      
      globalCamera.position.set(0, 0, cameraDistance * 1.2);
      globalCamera.lookAt(0, 0, 0);

      globalCamera.updateProjectionMatrix();
      if (globalOrbitControls) {
        globalOrbitControls.update();
      }

      if (globalRenderer) {
        globalRenderer.render(globalScene, globalCamera);
      }
    }

    
    function createFixedMaterial(id){
      const textureLoader = new TextureLoader();
      const matcapTexture = textureLoader.load(`/assets/matcaps/${id+1}.png`);
      matcapTexture.encoding = SRGBColorSpace
      // Step 2: Create a MeshMatcapMaterial with the loaded texture
      return  new MeshMatcapMaterial({
          matcap: matcapTexture,
          color: honeyColor
          // color: new Color(0xBF9000) // Optional: set a base color if needed
      });
    }

    function createMatcapMaterial(id) {
      
      const matcapTexture = globalTextureLoader.load(`/assets/matcaps/${id+1}.png`);
      return new ShaderMaterial({
        uniforms: {
          matcap: { value: matcapTexture },
          colorAdjust: { value: honeyColor}
        },
        vertexShader: `
          varying vec3 viewDir;
          varying vec3 worldNormal;
          varying vec2 vUv;

          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            viewDir = normalize(-mvPosition.xyz);
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            worldNormal = normalize(mat3(modelMatrix) * normal);

            vUv = uv; // Pass UV coordinates to fragment shader

            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D matcap;
          uniform vec3 colorAdjust; // RGB color for full override
          varying vec3 viewDir;
          varying vec3 worldNormal;
          varying vec2 vUv; // Receive UV coordinates

          void main() {
              vec3 normal = normalize(worldNormal);
              vec3 reflected = reflect(viewDir, normal);
              float m = 2.0 * sqrt(reflected.z + 1.0);
              vec2 uv = reflected.xy / m + 0.5;

              vec4 texColor = texture2D(matcap, uv);
              float grayscale = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));

              // Calculate brightness based on vertical position and add horizontal light effects
              float verticalGradient = 0.65 + 0.15 * sin(vUv.y * 3.14159); // Brighter at bottom and top, darker in middle
              float horizontalGradient = 0.5 + 0.3 * pow(1.0 - abs(vUv.x - 0.5), 2.0); // Brighter towards the middle

              float brightness = verticalGradient * horizontalGradient;

              vec3 fullyColored = brightness * grayscale * colorAdjust;

              gl_FragColor = vec4(fullyColored, texColor.a);
          }
        `
      });
    }
    function createComplexMaterial(
      id, 
      density = 16.53, 
      light = 1.03, 
      viscosity = 0.01
    ) {
      // console.log("Applying with values: ", density, light, viscosity)
      
      const matcapTexture = globalTextureLoader.load(`/assets/matcaps/${id+1}.png`);


      return new ShaderMaterial({
        uniforms: {
          matcap: { value: matcapTexture },
          colorAdjust: { value: honeyColor},
          time: { value: 0 },
          envMap: { value: globalScene.environment },
          IOR: { value: density},
          subSurfaceScatter: { value: light},
          viscosity: { value: viscosity},
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
          uniform float IOR;
          uniform float subSurfaceScatter;
          uniform float viscosity;

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

            // Environment reflection
            vec3 reflColor = getEnvironmentReflection(viewDir, normal);

            // Fresnel effect
            float fresnel = pow(1.0 - dot(viewDir, normal), 5.0);

            // Subsurface scattering approximation
            vec3 scatterColor = colorAdjust * (1.0 - fresnel) * subSurfaceScatter;

            // Viscosity simulation (subtle movement)
            float viscosityEffect = sin(vWorldPosition.y * 20.0 + time * 0.1) * viscosity;
            matcapColor += vec3(viscosityEffect);

            // Blend colors
            vec3 finalColor = mix(matcapColor, reflColor, fresnel);
            finalColor += scatterColor;
            finalColor *= colorAdjust;

            // Color depth simulation
            float depth = (vWorldPosition.y + 1.0) * 0.5; // Normalize to 0-1 range
            finalColor *= mix(vec3(1.0), colorAdjust, depth);

            gl_FragColor = vec4(finalColor, 1.0);
          }
        `
      });
    }
    function createComplexMaterialOptions(
      id, 
      density = 16.53, 
      light = 1.03, 
      viscosity = 0.01, 
      hPosition = 0.50, 
      hIntensity = 0.50, 
      envMapIntensity = 1.00, 
      viscosityWaviness = 20.00,
    ) {
      // console.log("Applying with values: ", worldPosition)
      
      const matcapTexture = globalTextureLoader.load(`/assets/matcaps/${id+1}.png`);


      return new ShaderMaterial({
        uniforms: {
          matcap: { value: matcapTexture },
          colorAdjust: { value: honeyColor},
          time: { value: 0 },
          envMap: { value: globalScene.environment },
          IOR: { value: density},
          subSurfaceScatter: { value: light},
          viscosity: { value: viscosity},
          viscosityWaviness: { value: viscosityWaviness},
          highlightPosition: { value: hPosition },
          highlightIntensity: { value: hIntensity },
          envMapIntensity: { value: envMapIntensity},
          idealPosition: { value: worldPosition }
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
          uniform vec3 idealPosition;
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
            vec3 envMapCoord = idealPosition + reflectVec * 20.0; // Adjust the 10.0 as needed
            return textureCube(envMap, envMapCoord).rgb;
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
            vec3 baseColor = mix(matcapColor, reflColor, fresnel * 0.8);
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
    const density = ref(4.85);
    const light = ref(0.09);
    const viscosity = ref(1.03)
    const hPosition =  ref(0.50)
    const hIntensity = ref(0.50)
    const envMapIntensity = ref(0.01)
    const viscosityWaviness = ref(14.00)
    function cycleMaterial() {
      switch (useMaterial.value) {
        case 'fixed':
          useMaterial.value = 'matcap';
            break;
        case 'matcap':
          useMaterial.value = 'complexOptions';
            break;
        case 'complexOptions':
          useMaterial.value = 'complex';
            break;
        default:
          useMaterial.value = 'fixed';
    }
    applyMaterialChanges();
  }
    function applyMaterialChanges() {
      console.log("APPLYING MAT CHNAGES")
      let idx = 0;
      globalScene.traverse((obj) => {
        if (obj.isMesh && obj.name.includes('matcapped')) {
          console.log("inside APPLY", idx)
          if(useMaterial.value === 'fixed'){
            obj.material = createFixedMaterial(idx)
          } else if( useMaterial.value === 'matcap'){
            obj.material = createMatcapMaterial(idx)
          } else if( useMaterial.value === 'complexOptions'){
            obj.material = createComplexMaterialOptions(idx, density.value, light.value, viscosity.value, hPosition.value, hIntensity.value, envMapIntensity.value, viscosityWaviness.value);
          } else {
            obj.material = createComplexMaterial(idx, density.value, light.value, viscosity.value);
          }
          idx++
        }
      });
    }

    let labelTest;
    let matcapId = ref(1);

    let matcapType = ref(true);
    

    let matcapMaterial;
    let useMaterial = ref('complexOptions')
    function switchColor(newColorHex) {
      console.log("Got new hex", newColorHex)
      honeyColor = new Color(newColorHex)
      let idx = 0;
      globalScene.traverse((obj) => {
        if(obj.isMesh){
          if(obj.name.includes('matcapped')){
            if(useMaterial.value === 'fixed'){
              obj.material = createFixedMaterial(idx)
            } else if( useMaterial.value === 'matcap'){
              obj.material = createMatcapMaterial(idx)
            } else if( useMaterial.value === 'complexOptions'){
              obj.material = createComplexMaterialOptions(idx, density.value, light.value, viscosity.value, hPosition.value, hIntensity.value, envMapIntensity.value, viscosityWaviness.value);
            } else {
              obj.material = createComplexMaterial(idx, density.value, light.value, viscosity.value);
            }
            idx++;
          }
        }
      })
    }

    let labelMeshes;
    let globalObj300g;

    let showLabels = ref(true)
    let showGlass = ref(true)
    function removeGlass(){
      globalScene.traverse((obj) => {
        if (obj.isMesh && obj.name.includes('jar')) {
          if(showGlass.value){
            obj.material.opacity = 0;
          } else {
            obj.material.opacity = 1;
          }
        }
      })
      showGlass.value = !showGlass.value
    }

    function removeLabel(){
      globalScene.traverse((obj) => {
        if (obj.isMesh && obj.name.includes('label')) {
          if(showLabels.value){
            obj.material.opacity = 0;
          } else {
            obj.material.opacity = 1;
          }
        }
      })
      showLabels.value = !showLabels.value
    }
    function removeMesh(meshName) {
      
    }


    const setCanvas = async () => {
      // Create Scene
      globalScene = new Scene();

      // let jarPromise = await loadGlbReturnParts(loader, jarConfigs.medium.source)
      let mediumSmallScene = await loadGlbReturnParts(loader, '/assets/glb/newJars/300-150-animation-choppy-v6.glb')
      // let largeMediumScene = await loadGlbReturnParts(loader, '/assets/glb/newJars/450-300-animation-choppy-v1.glb')
      labelMeshes = mediumSmallScene.labelMeshes
      // for (let mesh of mediumSmallScene.meshes){
      //     globalScene.add(mesh)
      // }

      if(mediumSmallScene.jarSizes){
        jarSizes = mediumSmallScene.jarSizes
      }
      let objToRemove = []
      mediumSmallScene.scene.traverse((obj) => {
        if(obj.isMesh){
          console.log("obj name", obj.name)
          if(obj.name.includes('jar')){
            console.log("obj", obj.material.transmission)
            console.log("obj", obj.material.opacity)
            // obj.material.transmission = 0;
            // obj.material.opacity = 0.5;
          }
          if(obj.name.includes('label')){
            // obj.material.transmission = 0;
            // obj.material.opacity = 0;
          }
          if(obj.name.includes('150')){
            // remove this obj
            objToRemove.push(obj)
          }
        }
      })
      for (let obj of objToRemove) {
        if (obj.parent) {
          obj.parent.remove(obj);
        } else {
        }
      }
      globalScene.add(mediumSmallScene.scene)

      globalScene.traverse((obj)=>{
        if(obj.isMesh){
          if(obj.name === 'honey_object_300g'){
            globalObj300g = obj
          }
        }
      })
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
      globalCamera = new PerspectiveCamera(25, aspectRatio.value, 0.001, 10);
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
      
      globalOrbitControls = new OrbitControls(globalCamera, canvas);
      globalOrbitControls.enableDamping = true; // Add smooth damping
      globalOrbitControls.dampingFactor = 0.05;
      globalOrbitControls.minDistance = 0.1;
      globalOrbitControls.maxDistance = 10;
      globalOrbitControls.maxPolarAngle = Math.PI / 2;
      await setLightingEXR(globalRenderer)
      // await setLighting(globalRenderer)
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
      console.log("ENVMAP", envMap)
      globalScene.environment = envMap;
      globalScene.environmentIntensity = 1.0;
      globalScene.toneMappingExposure = 1.0;
      // renderer.toneMapping = ACESFilmicToneMapping;
      // renderer.toneMapping = ReinhardToneMapping;
      // renderer.toneMapping = NoToneMapping;
      // renderer.toneMapping = LinearToneMapping;
      // renderer.toneMapping = CineonToneMapping;
      // renderer.toneMapping = AgXToneMapping;
      // renderer.toneMapping = NeutralToneMapping;

      pmremGenerator.dispose()
      exrTexture.dispose();
    }
    

    const clock = new Clock();
    const clockTexture = new Clock();
    let honeyObject = null
    const animate = () => {
      
      stats.begin();
      if(labelTest){
        if(loadedText){
          const elapsedTime = clockTexture.getElapsedTime();
          const linePosition = (Math.sin(elapsedTime) + 1) / 2; // Oscillate between 0 and 1
          labelTest.material.uniforms.linePosition.value = linePosition;
        }
      }
      const elapsedTime = clock.getElapsedTime();
      if (honeyObject && honeyObject.material.uniforms) {
        // console.log("inside HObject")
        if(honeyObject.material.uniforms.time){
          // console.log("inside TIME", honeyObject.material.uniforms.time.value)
          if(honeyObject.material.uniforms.time.value || honeyObject.material.uniforms.time.value === 0){
            
        // console.log("inside HObject")
            // console.log("elapsedTime", elapsedTime, honeyObject.name)
            honeyObject.material.uniforms.time.value = elapsedTime;
          }
        }
      }
      globalOrbitControls.update();
      globalRenderer.render(globalScene, globalCamera);
      if(LOGTIMER === 0 && animationDONE){
        LOGTIMER++
      }
      stats.end()
      requestAnimationFrame(animate);
    };

    let isSceneReady = ref(false)
    onMounted( async () => {
      emitter.on('applyColor', switchColor)
      setTimeout(() => {
        console.log("emitting Switch color")
        emitter.emit('switchColor', honeyColor)
      }, 2500)
      await nextTick();
      updateContainerSize(); // Set initial size
      window.addEventListener('resize', debouncedUpdateSize);
      await setCanvas();
      await nextTick()
      isSceneReady.value = true;
      if(useMaterial.value === 'complexOptions'){
        console.log("CALLING APPLY MAT CHANGES")
        applyMaterialChanges()
      }
      animate();
      createMatcapGrid()
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


      if (globalOrbitControls) {
        globalOrbitControls.dispose();
      }
      // Clear the internal three.js caches
      Cache.clear();
      if (stats.dom) {
        document.body.removeChild(stats.dom);
      }
    });

    


    return { 
      webGl, 
      sceneContainer,
      matcapId,
      matcapType,
      jarSmall,
      jarMedium,
      createMatcapGrid,
      removeGlass,
      removeLabel,
      showGlass,
      showLabels,
      useMaterial,
      switchColor,
      density,
      viscosity,
      light,
      hPosition,
      hIntensity,
      envMapIntensity,
      viscosityWaviness,
      applyMaterialChanges,
      cycleMaterial
    };
  },
};
</script>

<style lang="scss" scoped>
.scene-container{
  position: relative;
  width: 100%;
  height: 95%;
}
.product-viewer{
  width: 100%;
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
.material-controls {
  display: flex;
  flex-direction: column;

  label {
    margin-top: 10px;
    color: black;
  }

  input[type="range"] {
    width: 100%;
  }

  button {
    margin-top: 10px;
    padding: 5px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;

    &:hover {
      background-color: #45a049;
    }
  }
}
</style>
