import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { TextureLoader } from 'three';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// export const loader = new GLTFLoader();
const textureLoader = new TextureLoader();
const rgbeLoader = new RGBELoader();

export function initializeGLTFLoader(draco, ktx2, meshopt){
  const loader = new GLTFLoader();
  
  // Setup DRACO loader
  if(draco){
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderConfig({ type: 'js' });
    dracoLoader.setDecoderPath('/node_modules/three/examples/jsm/libs/draco/gltf/');
    loader.setDRACOLoader(dracoLoader);
  }
  if(ktx2){
    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath('/node_modules/three/examples/jsm/libs/basis/');
    loader.setKTX2Loader(ktx2Loader);
  }
  if(meshopt){
    loader.setMeshoptDecoder(MeshoptDecoder);
  }
  return loader
}

export async function loadGlb(loader, url) {
    return loader.loadAsync(url);
}

export async function loadGlbReturnParts(loader, url){
  let loaderPromise = await loader.loadAsync(url)
  if(loaderPromise){
    loaderPromise.scene.name = url
    let scene = loaderPromise.scene;
    scene.position.set(0, 0, 0)
    // const axesHelperNew = new AxesHelper(5)
    // scene.add(axesHelperNew)
    let meshes = [];
    let labelMeshes = [];
    scene.traverse((obj)=>{
      if(obj.isMesh){
        if(obj.name.includes('label')){
          labelMeshes.push(obj.clone())
        } else {
          meshes.push(obj.clone())
        }
      }
    });
    let targetMesh = meshes[0];
    let jarSizes = []
    const meshNames = meshes.map((mesh) => {
      // // console.log("MESHNAME", mesh.name)
      // console.log("mesh ss", mesh.name.substring(mesh.name.length-4, mesh.name.length))
      if(mesh.name.includes('label')){
        jarSizes.push(mesh.name.substring(mesh.name.length-4, mesh.name.length))
        mesh.jarSize = mesh.name.substring(mesh.name.length-4, mesh.name.length)
      }
      return mesh.name
    })
    console.log("SIZES", jarSizes)
    // // console.log('meshNames', meshNames)

    return { gltf: loaderPromise, scene, meshes, labelMeshes, targetMesh, meshNames, jarSizes, loaded: true }
  } else return { loaded: false }
}

export async function loadTexture(url) {
    return textureLoader.loadAsync(url);
}

export async function loadEnvironment(url) {
    const rgbeTexture = await rgbeLoader.loadAsync(url);
    return rgbeTexture;
}
