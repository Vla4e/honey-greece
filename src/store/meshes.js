import { defineStore } from 'pinia';
import { ref, reactive, computed, watch, toRaw } from 'vue';

import {
  Box3,
  Vector3
} from 'three';

export const useMeshStore = defineStore('mesh', () => {
  let boundingBoxes = ref({});

  watch(() => boundingBoxes.value, (newVal) => {
    // console.log("Received new boundingbox value:", newVal)
  }, {deep: true})

  async function storeBoundingBox(mesh, size){
    console.log("storeBoundingBox mesh name:", mesh)
    const boundingBox = new Box3();

    // Reference box (300g jar)
    boundingBox.setFromObject(mesh);
    const refMin = boundingBox.min.clone();
    const refMax = boundingBox.max.clone();
    const refSize = new Vector3().subVectors(refMax, refMin);
    
    // Store these for use in shader uniforms
    const referenceBounds = {
      min: refMin,
      size: refSize
    };
    console.log("MeshName:", mesh.name)
    console.log("BoundingBox:", boundingBox)
    boundingBoxes.value[size] = {
      referenceBounds,
      boundingBox,
      name: mesh.name,
      size: size //s
    }
    console.log("Final boundingboxes in store:", boundingBoxes.value)
  }

  return {
    boundingBoxes,
    storeBoundingBox
  }
});
