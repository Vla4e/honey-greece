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
      <!-- <button style="margin-right: 10px;" @click="cycleMatcap(0)">prev</button>
      <button style="margin-right: 10px;" @click="toggleShader()">toggle shader: {{ matcapType ? 'keep original color' : 'force honey color' }}</button>
      <button style="margin-right: 10px;" @click="renderMatcap()">RENDER: {{ matcapId }}</button>
      <button style="margin-right: 10px;" @click="cycleMatcap(1)">next</button> -->
      <!-- <button style="margin-right: 10px" @click="createMatcapGrid()">Create Matcap Grid</button> -->
      <button style="margin-right:10px" @click="removeLabel('label')">Show Labels: {{ showLabels }}</button>
      <button style="margin-right:10px" @click="removeGlass('jar')">Show Glass: {{ showGlass }}</button>
      <button style="margin-right:10px" @click="()=>{ 
        useFixedMaterial = !useFixedMaterial;
        switchColor('#BF9000');
      }">Custom Shader: {{ useFixedMaterial ? 'off' : 'on' }}</button>
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
SRGBColorSpace
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
    function createMatcapGrid(gridWidth = 12, gridHeight = 5, spacing = 0.1) {
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
            jarClone.traverse((obj) => {
              if (obj.isMesh && obj.name === 'honey_object_300g') {
                const matcapId = idx;
                if(useFixedMaterial.value){
                  obj.material = createFixedMaterial(tempColor, idx)
                } else {
                  obj.material = createMatcapMaterial(tempColor, idx)
                }
                obj.name = `matcapped-${matcapId}`
                idx++
              }
            });
            jarGroup.add(jarClone);
            iterations++;
          } else {}
        }
      }

      console.log("JARGROUP", jarGroup)
      globalScene.add(jarGroup);

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


    function createMatcapMaterial(color, id) {
      
      const matcapTexture = globalTextureLoader.load(`/assets/matcaps/${id+1}.png`);
      return new ShaderMaterial({
      uniforms: {
          matcap: { value: matcapTexture },
          colorAdjust: { value: color || new Color(0xffc107) }
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
      // return new ShaderMaterial({
      //     uniforms: {
      //         matcap: { value: matcapTexture },
      //         colorAdjust: { value: color || new Color(0xffc107) }
      //     },
      //     vertexShader: `
      //         varying vec3 viewDir;
      //         varying vec3 worldNormal;

      //         void main() {
      //             vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      //             viewDir = normalize(-mvPosition.xyz);

      //             vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      //             worldNormal = normalize(mat3(modelMatrix) * normal);

      //             gl_Position = projectionMatrix * mvPosition;
      //         }
      //     `,
      //     fragmentShader: `
      //         uniform sampler2D matcap;
      //         uniform vec3 colorAdjust; // RGB color for full override
      //         varying vec3 viewDir;
      //         varying vec3 worldNormal;

      //         void main() {
      //             vec3 normal = normalize(worldNormal);
      //             vec3 reflected = reflect(viewDir, normal);

      //             float m = 2.0 * sqrt(reflected.z + 1.0);
      //             vec2 uv = reflected.xy / m + 0.5;

      //             vec4 texColor = texture2D(matcap, uv);

      //             // Convert to grayscale to extract lighting and shading info
      //             float grayscale = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));

      //             // Apply the new color fully
      //             vec3 fullyColored = grayscale * colorAdjust;

      //             gl_FragColor = vec4(fullyColored, texColor.a);
      //         }
      //     `
      // });
      // return new ShaderMaterial({
      //   uniforms: {
      //     matcap: { value: matcapTexture },
      //     colorAdjust: { value: color }
      //   },
      //   vertexShader: `
      //     varying vec3 vViewPosition;
      //     varying vec3 vNormal;
      //     void main() {
      //       vNormal = normalize(normalMatrix * normal);
      //       vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      //       vViewPosition = -mvPosition.xyz;
      //       gl_Position = projectionMatrix * mvPosition;
      //     }
      //   `,
      //   fragmentShader: `
      //     uniform sampler2D matcap;
      //     uniform vec3 colorAdjust;
      //     varying vec3 vViewPosition;
      //     varying vec3 vNormal;
      //     void main() {
      //       vec3 normal = normalize(vNormal);
      //       vec3 viewDir = normalize(vViewPosition);
      //       vec3 x = normalize(vec3(viewDir.z, 0.0, -viewDir.x));
      //       vec3 y = cross(viewDir, x);
      //       vec2 uv = vec2(dot(x, normal), dot(y, normal)) * 0.495 + 0.5;
      //       vec4 matcapColor = texture2D(matcap, uv);
      //       vec3 color = matcapColor.rgb * colorAdjust;
      //       gl_FragColor = vec4(color, matcapColor.a);
      //     }
      //   `
      // });
    }

    function createFixedMaterial(color, id){
      const textureLoader = new TextureLoader();
      const matcapTexture = textureLoader.load(`/assets/matcaps/${id+1}.png`);
      matcapTexture.encoding = SRGBColorSpace
      // Step 2: Create a MeshMatcapMaterial with the loaded texture
      return  new MeshMatcapMaterial({
          matcap: matcapTexture,
          color: color || new Color(0xBF9000)
          // color: new Color(0xBF9000) // Optional: set a base color if needed
      });
    }
    function createHoneyMatcapMaterial(color, id) {
      const matcapTexture = globalTextureLoader.load(`/assets/matcaps/${id+1}.png`);
      // console.log("Texture: ", matcapTexture, id)
      // console.log("Color: ", color)
      return new ShaderMaterial({
        uniforms: {
          matcap: { type: 't', value: matcapTexture },
          colorAdjust: { type: 'v3', value: color || new Color(0xffc107) } // Default to a honey color
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewPosition;

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

          varying vec3 vNormal;
          varying vec3 vViewPosition;

          void main() {
            vec3 viewDirection = normalize(vViewPosition);
            vec3 refractionDirection = refract(viewDirection, vNormal, 1.1);

            vec2 matcapUV = vec2(refractionDirection.x, -refractionDirection.y) * 0.5 + 0.5;
            vec4 matcapColor = texture2D(matcap, matcapUV);

            // Blend the original matcap color with the adjusted color
            vec3 blendedColor = mix(matcapColor.rgb, colorAdjust, 0.5);

            // Apply simple lighting to enhance depth
            float light = dot(vNormal, viewDirection) * 0.5;
            blendedColor += light * blendedColor; // Light effect based on blended color

            gl_FragColor = vec4(blendedColor, matcapColor.a);
          }
        `
      });
    }
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
      } else changeMatcap4(tempColor)
      globalScene.traverse((obj) => {
        if(obj.isMesh){
          if(obj.name.includes('matcapped')){
            // console.log("FOUND OBJ")
          }
        }
      })
    }
    let tempColor;
    let useFixedMaterial = ref(false)
    function switchColor(newColorHex) {
      tempColor = new Color(newColorHex)
      let idx = 0;
      globalScene.traverse((obj) => {
        if(obj.isMesh){
          if(obj.name.includes('matcapped')){
            console.log("ITERATION", idx, obj.name)
            if(useFixedMaterial.value){
              obj.material = createFixedMaterial(tempColor, idx)
            } else {
              obj.material = createMatcapMaterial(tempColor, idx)
            }
            idx++;
          }
        }
      })

      // if (matcapMaterial) {
      //   const newColor = new Color(newColorHex);
      //   if (matcapType.value) {
      //     changeMatcap(newColor);
      //   } else {
      //     changeMatcap4(newColor);
      //   }
      // }
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
    }
    async function changeMatcap2(color){
      const textureLoader = new TextureLoader();
      const matcapTexture = textureLoader.load(`/assets/matcaps/${matcapId.value}.png`);

      // Step 2: Create a Shader Material with Full Color Override
      const desiredColor = new Color(0xffc107); // Example color for honey (golden yellow)

      matcapMaterial = new MeshMatcapMaterial({
          matcap: matcapTexture,
          // color: new Color(0xBF9000) // Optional: set a base color if needed
      });

      // Apply the new material to your objects
      globalObj300g.material = matcapMaterial;
      globalObj300g.material.needsUpdate = true;
      globalObj150g.material = matcapMaterial;
      globalObj150g.material.needsUpdate = true;
    }
    
    async function changeMatcap4(color){
      const textureLoader = new TextureLoader();
  const matcapTexture = textureLoader.load(`/assets/matcaps/${matcapId.value}.png`);

  // Create a Shader Material with Full Color Override
  const desiredColor = new Color(0xffc107); // Example color for honey (golden yellow)

  matcapMaterial = new ShaderMaterial({
      uniforms: {
          matcap: { value: matcapTexture },
          colorAdjust: { value: color || new Color(0xffc107) }
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

              // Adjust brightness based on position
              float brightness = 0.5 + 0.3 * sin(vUv.y * 3.14159); // Vertical gradient
              brightness += 0.04 * (1.0 - 4.0 * abs(vUv.x - 0.5)); // Horizontal gradient

              vec3 fullyColored = brightness * grayscale * colorAdjust;

              gl_FragColor = vec4(fullyColored, texColor.a);
          }
      `
  });
      // Step 3: Apply the Shader Material to Your Mesh
      // Assuming you have an existing mesh
      globalObj300g.material = matcapMaterial;
      globalObj300g.material.needsUpdate = true;
    }
    
    async function changeMatcap3(color){
      const textureLoader = new TextureLoader();
      const matcapTexture = textureLoader.load(`/assets/matcaps/${matcapId.value}.png`);

      // Step 2: Create a Shader Material with Full Color Override

      matcapMaterial = new ShaderMaterial({
          uniforms: {
              matcap: { value: matcapTexture },
              colorAdjust: {  value: color || new Color(0xbf9000) }, // Honey-like color
              glossiness: { value: 1.5 } // Adjust glossiness as needed
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
              uniform vec3 colorAdjust;
              uniform float glossiness;

              varying vec3 viewDir;
              varying vec3 worldNormal;

              void main() {
                  vec3 normal = normalize(worldNormal);
                  vec3 reflected = reflect(viewDir, normal);

                  float m = 2.0 * sqrt(reflected.z + 1.0);
                  vec2 uv = reflected.xy / m + 0.5;

                  vec4 texColor = texture2D(matcap, uv);

                  float grayscale = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
                  vec3 fullyColored = grayscale * colorAdjust;

                  float glossFactor = pow(grayscale, glossiness);
                  vec3 finalColor = mix(fullyColored, vec3(1.0), glossFactor * 0.1);

                  gl_FragColor = vec4(finalColor, texColor.a);
              }
          `
          /*The glossiness uniform can be adjusted dynamically to control how shiny the honey appears. Higher values make the highlights sharper and more reflective.
            colorAdjust uniform can be modified to get different honey shades, from light amber to darker tones.
            If the honey needs to be semi-transparent, you can adjust the texColor.a component or use additional alpha blending technique
*/
      });
      globalObj300g.material = matcapMaterial;
      globalObj300g.material.needsUpdate = true;
    }
    async function changeMatcap4(color){
      console.log("DOING MATCAP3");
      const textureLoader = new TextureLoader();
      const matcapTexture = textureLoader.load(`/assets/matcaps/${matcapId.value}.png`);

      // Step 2: Create a MeshMatcapMaterial with the loaded texture
      const matcapMaterial = new MeshMatcapMaterial({
          matcap: matcapTexture,
          color: color
          // color: new Color(0xBF9000) // Optional: set a base color if needed
      });

      // Apply the new material to your objects
      globalObj300g.material = matcapMaterial;
      globalObj300g.material.needsUpdate = true;
    }
    function cycleMatcap(direction) {
      if (direction) {
          matcapId.value = (matcapId.value % 46) + 1;
      } else {
          matcapId.value = (matcapId.value - 2 + 46) % 46 + 1;
      }
      renderMatcap();
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
          console.log("Label", showLabels.value)
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
      let mediumSmallScene = await loadGlbReturnParts(loader, '/assets/glb/newJars/300-150-animation-choppy-v1.glb')
      // let largeMediumScene = await loadGlbReturnParts(loader, '/assets/glb/newJars/450-300-animation-choppy-v1.glb')
      labelMeshes = mediumSmallScene.labelMeshes
      // for (let mesh of mediumSmallScene.meshes){
      //     globalScene.add(mesh)
      // }

      if(mediumSmallScene.jarSizes){
        jarSizes = mediumSmallScene.jarSizes
      }
      console.log("Before Traversal", !!mediumSmallScene.scene)
      let objToRemove = []
      mediumSmallScene.scene.traverse((obj) => {
        if(obj.isMesh){
          console.log("OBJ IS MESH", obj.name, obj.material.transmission, obj.material.opacity)
          if(obj.name.includes('jar')){
            // obj.material.transmission = 0;
            // obj.material.opacity = 0;
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
      console.log("OBJ TO REMOVE ", objToRemove)
      for (let obj of objToRemove) {
        if (obj.parent) {
          obj.parent.remove(obj);
          console.log(`Removed: ${obj.name}`);
        } else {
          console.warn(`Object ${obj.name} has no parent and cannot be removed.`);
        }
      }
      console.log("After Traversal", mediumSmallScene.scene)
      globalScene.add(mediumSmallScene.scene)

      globalScene.traverse((obj)=>{
        if(obj.isMesh){
          if(obj.name === 'honey_object_300g'){
            // changeMatcap(obj)
            globalObj300g = obj
          }
        }
      })
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
      globalScene.environment = envMap;
      pmremGenerator.dispose()
      exrTexture.dispose();
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
      globalOrbitControls.update();
      globalRenderer.render(globalScene, globalCamera);
      if(LOGTIMER === 0 && animationDONE){
        LOGTIMER++
      }
      stats.end()
      requestAnimationFrame(animate);
    };

  
    onMounted( async () => {
      emitter.on('applyColor', switchColor)
      await nextTick();
      updateContainerSize(); // Set initial size
      window.addEventListener('resize', debouncedUpdateSize);
      await setCanvas();
      await nextTick()
      animate();
      // changeMat();
      // renderMatcap()
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
      updateTexture,
      changeMat,
      changeMatcap2,
      changeMatcap3,
      cycleMatcap,
      matcapId,
      toggleShader,
      renderMatcap,
      matcapType,
      jarSmall,
      jarMedium,
      createMatcapGrid,
      removeGlass,
      removeLabel,
      showGlass,
      showLabels,
      useFixedMaterial,
      switchColor
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
</style>
