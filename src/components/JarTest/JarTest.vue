<template>
  <div class="jar-test-scene">
    <div ref="canvasContainer" class="canvas-container">
      <canvas ref="canvas"></canvas>
    </div>

    <!-- File input for uploading the texture PNG -->
    <input 
      type="file"
      class="file-upload"
      accept="image/png" 
      @change="onUploadTexture"
    />
    <button @click="onUploadTexture">TEST</button>

    <!-- Optionally, some UI to choose which mesh gets the texture -->
    <div class="mesh-selection">
      <label>
        <input
          type="radio"
          :value="selectedScene === 'okto' ? '300' : '150'"
          v-model="selectedMesh"
        />
        Apply texture to {{ selectedScene === 'okto' ? '300' : '150' }}
      </label>
      <label>
        <input
          type="radio"
          :value="selectedScene === 'okto' ? '400' : '300'"
          v-model="selectedMesh"
        />
        Apply texture to {{ selectedScene === 'okto' ? '400' : '300' }}
      </label>
    </div>
    <div class="scene-selection">
      <label>
        <input
          type="radio"
          value="okto"
          v-model="selectedScene"
        />
        450-300
      </label>
      <label>
        <input
          type="radio"
          value="haa"
          v-model="selectedScene"
        />
        150-300
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  TextureLoader,
  SRGBColorSpace,
  AxesHelper,
  Vector3
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'


import {
  PMREMGenerator,
} from 'three';
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
defineOptions({
  name: 'JarTest'
})


import {
  moveSceneToGridPosition,
  revertScenePosition,
} from "@/helpers/JarScene/MoveSceneByOffset.js";
//ShaderMaterial imports
//Honey
import {
  oldHoneyMaterial,
  playfulMaterial2,
  playfulMaterial3,
  playfulMaterial4,
  playfulMaterial5
} from "@/helpers/JarScene/HoneyMaterials.js";


import {
  initializeGLTFLoader,
  loadGlb,
  loadGlbReturnParts,
  loadTexture,
  loadEnvironment,
} from "@/helpers/loaders.js";
/*Loaders + configuration of loaders*/
const loader = initializeGLTFLoader(true, true, true);

/**
 * Refs for DOM elements and globalScene objects
 */
const canvasContainer = ref(null)
const canvas = ref(null)
let globalScene, globalCamera, globalRenderer, controls
let globalTextureLoader = new TextureLoader();
let animationId = null;
let meshA, meshB

let jarSizes = ["450g", "300g"];

/**
 * Track which mesh user wants to apply the texture to
 * (If you have more than two or want more control, adapt accordingly)
 */
const selectedMesh = ref('meshA')


async function setLightingEXR(renderer) {
  console.log("setting lighting")
  let pmremGenerator = new PMREMGenerator(renderer);
  let exrTexture = await new EXRLoader().loadAsync(
    "/assets/exr/brown_photostudio_02_1k.exr"
  );
  console.log("EXRTEX", exrTexture);
  let envMap = pmremGenerator.fromEquirectangular(exrTexture).texture;
  console.log(envMap.type);
  console.log(envMap.mapping);
  globalScene.background = null;
  globalScene.environment = envMap;
  globalScene.environmentIntensity = 1.0;
  globalScene.toneMappingExposure = 1.0;
  // // console.log("FINISHED SETTING LIGHTING ===========>")
  pmremGenerator.dispose();
  exrTexture.dispose();
}

let honeyMeshes = {}
let honeyMesh1, honeyMesh2;
async function initThreeScene() {
  
  let axesHelper = new AxesHelper(5);
  axesHelper.setColors("red", "blue", "green");
  globalScene = new Scene()
  let currentBrand = 'okto'
  let sceneUrl =
    currentBrand === "okto"
      ? "/assets/glb/300-450-baked-newest.glb"
      : // '/assets/glb/newJars/uvfixed4.glb':
        // '/assets/glb/newJars/450-300-animation-choppy-v2.glb':
        // '/assets/glb/newJars/uvfixed4.glb':
        "/assets/glb/150-300.glb";

  let sceneParts = await loadGlbReturnParts(loader, sceneUrl);
  console.log("scene parts: ", sceneParts)
  let offsetA = new Vector3(0, 0, 0)
  let offsetB = new Vector3(0.22, 0, -0.1)
  if(selectedScene.value === 'okto'){
    sceneParts.meshesCategorized['450g'].forEach((mesh) => {
      console.count("mesh 450:", mesh);
      mesh.position.add(offsetA); // Relative move
      if(mesh.name.includes('honey')){
        honeyMeshes['450'] = mesh
      }
    });
    sceneParts.meshesCategorized['300g'].forEach((mesh) => {
      console.count("mesh 300:", mesh);
      mesh.position.add(offsetB); // Relative move
      if(mesh.name.includes('honey')){
        honeyMeshes['300'] = mesh
      }
    });
  }
  honeyMesh1 = sceneParts.meshesCategorized["300g"];
  honeyMesh2 = sceneParts.meshesCategorized["450g"];
  globalCamera = new PerspectiveCamera(
    5,
    (canvasContainer.value.offsetWidth) / (canvasContainer.value.offsetHeight),
    0.1,
    50
  )
  globalCamera.position.z = 3
  globalCamera.position.y = 1

  // Use the <canvas> ref to create the WebGL globalRenderer
  globalRenderer = new WebGLRenderer({
    canvas: canvas.value,
    powerPreference: "high-performance",
    antialias: true,
    stencil: true,
    depth: true,
    alpha: true,
  })
  console.log("canvasContainer", canvasContainer.value.offsetHeight)
  globalRenderer.setSize(canvasContainer.value.offsetWidth, canvasContainer.value.offsetHeight);
  globalRenderer.setClearColor(0x000000, 0);
  globalRenderer.setPixelRatio(1);
  globalRenderer.shadowMap.enabled = false;
  globalRenderer.outputColorSpace = SRGBColorSpace;

  // Orbit Controls
  controls = new OrbitControls(globalCamera, globalRenderer.domElement)
  controls.enableDamping = true        // optional smooth orbit
  controls.dampingFactor = 0.05        // optional smooth orbit speed
  controls.target.set(0, 0.05,0)  

  // Create first object (Mesh A)
  // const geometryA = new BoxGeometry()
  // const materialA = new MeshBasicMaterial({ color: 0x00ff00 })
  // meshA = new Mesh(geometryA, materialA)
  // meshA.position.x = -1.5
  // // globalScene.add(meshA)

  // // Create second object (Mesh B)
  // const geometryB = new BoxGeometry()
  // const materialB = new MeshBasicMaterial({ color: 0x0000ff })
  // meshB = new Mesh(geometryB, materialB)
  // meshB.position.x = 1.5
  // globalScene.add(meshB)
  globalScene.add(sceneParts.scene)
  globalScene.add(axesHelper)
  globalScene.traverse((obj) => {
    if(obj.isMesh){
      if(obj.name.includes('label')){
        obj.material.transparent = true;
        obj.material.opacity = 0;
      }
    }
  })
  await setLightingEXR(globalRenderer)
  await renderMatcap()
}


async function renderMatcap() {
  await changeHoneyShader();
  return;
}
async function changeHoneyShader(type = "cotton", id, color) {
  await revertScenePosition(globalScene, globalCamera);
  console.log("1. Will move to pos");
  await moveSceneToGridPosition(globalScene, globalCamera, honeyMesh1.position, type);
  console.log("2. Moved to POS");
  const honeyMaterials = {
    [jarSizes[0]]: await playfulMaterial5(
      globalTextureLoader,
      globalScene.environment,
      type,
      jarSizes[0],
      honeyMeshes,
      'okto',
      globalCamera
    ),
    [jarSizes[1]]: await playfulMaterial5(
      globalTextureLoader,
      globalScene.environment,
      type,
      jarSizes[1],
      honeyMeshes,
      'okto',
      globalCamera
    ),
  };

  console.log("Materials:", honeyMaterials);
  console.log("HONEYMESHES:::::", honeyMeshes);
  Object.values(honeyMeshes).forEach((mesh) => {
    mesh.material = honeyMaterials[mesh.size];
    mesh.material.needsUpdate = true;
  });
  isLoading.value = false;
  return true;
}
let honeyTypesArr = [
  "cotton",
  "fir",
  "master",
  "forest",
  "mediterranean",
  "afficionado",
  "natural",
  "oak",
  "pine",
  "thyme",
  "chestnut",
];
let honeyId = 0;
let currentHType = ref("cotton");
async function cycleColors() {
  if (honeyId == 10) {
    honeyId = 0;
  } else honeyId++;
  currentHType.value = honeyTypesArr[honeyId];
  await changeHoneyShader(honeyTypesArr[honeyId]);
}
/**
 * Simple render loop
 */
function animate() {
  requestAnimationFrame(animate)
  controls.update();
  globalRenderer.render(globalScene, globalCamera)
}

/**
 * Handler when user uploads a texture PNG
 */
async function onUploadTexture(event) {
  console.log("honeyMeshes", honeyMeshes)
  // const file = event.target.files?.[0]
  // if (!file) return
  const textureLoader = new TextureLoader()
  let texture = await textureLoader.loadAsync('/assets/textures-test/300.png')
  console.log("Loaded Texture:", texture)
  const targetMesh = honeyMeshes[selectedMesh.value]
  targetMesh.material.map = texture
  targetMesh.material.needsUpdate = true
  // Read the file as a data URL so TextureLoader can read from it
  // const fileReader = new FileReader()
  // fileReader.onload = (loadEvent) => {
  //   const base64URL = loadEvent.target.result
  //   textureLoader.load(base64URL, (texture) => {
  //     // Decide which mesh gets the texture based on user's radio selection
  //     const targetMesh = honeyMeshes[selectedMesh.value]
  //     targetMesh.material.map = texture
  //     targetMesh.material.needsUpdate = true
  //   })
  // }
  // fileReader.readAsDataURL(file)
}

let selectedScene = ref('okto')

onMounted(async () => {
  await initThreeScene()
  animate()
})

onUnmounted(() => {
  // 1. Stop the animation loop if you stored its ID
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

  // 2. Dispose all scene objects
  if (globalScene) {
    globalScene.traverse((obj) => {
      // Dispose geometry
      if (obj.isMesh && obj.geometry) {
        obj.geometry.dispose()
      }
      // Dispose materials
      if (obj.isMesh && obj.material) {
        // Some meshes can have an array of materials
        const materials = Array.isArray(obj.material)
          ? obj.material
          : [obj.material]

        materials.forEach((mat) => {
          // Dispose textures
          if (mat.map) {
            mat.map.dispose()
          }
          if (mat.alphaMap) {
            mat.alphaMap.dispose()
          }
          // ... dispose any other maps you are using

          mat.dispose()
        })
      }
    })

    // If you set an environment map
    if (globalScene.environment) {
      globalScene.environment.dispose()
    }
  }

  // 3. Dispose controls
  if (controls) {
    controls.dispose()
  }

  // 4. Finally, dispose renderer (and optionally lose context)
  if (globalRenderer) {
    globalRenderer.dispose()
    // If you want to force the WebGL context loss:
    // globalRenderer.forceContextLoss()
    // globalRenderer.domElement = null
  }

  // Clear references
  globalScene = null
  globalCamera = null
  globalRenderer = null
  controls = null
})
</script>

<style lang="scss" scoped>
.jar-test-scene{
  display: flex;
  flex-direction: column;
  width: 100%;
  height:100%;
  justify-content: center;
  align-items: center;
  .canvas-container{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 80%;
    margin-bottom: 20px;
    canvas {
      display: block;
      // margin: 0px 0px 20px 0px;
      border: 1px solid #ccc;
    }
  }
  .mesh-selection{
    color: black;
  }
  .scene-selection{
    color: black;
  }
  .file-input{
    color: black;
  }
}
/* Minimal styling so that the canvas fills space nicely */
</style>
