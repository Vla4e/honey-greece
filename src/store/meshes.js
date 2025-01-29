import { defineStore } from 'pinia';
import { ref, reactive, computed, watch, toRaw } from 'vue';

import {
  Box3,
  Vector3
} from 'three';

console.log("subcategory")
export const useMeshStore = defineStore('mesh', () => {
  let boundingBoxes = ref({});

  watch(() => boundingBoxes.value, (newVal) => {
    console.log("Recieved new BBOXVAL", newVal)
  }, {deep: true})

  async function storeBoundingBox(mesh){
    console.log("MESH BOUNDING BOX", mesh.name)
    const boundingBox = new Box3();

    // Reference box (the 300g jar)
    boundingBox.setFromObject(mesh);
    const refMin = boundingBox.min.clone();
    const refMax = boundingBox.max.clone();
    const refSize = new Vector3().subVectors(refMax, refMin);
    
    // Store these for uniform use
    const referenceBounds = {
      min: refMin,
      size: refSize
    };
    let size = mesh.name.split("_")[2]
    boundingBoxes.value[size] = {
      referenceBounds,
      boundingBox,
      name: mesh.name,
      size: size //s
    }
    console.log("BBOXES", boundingBoxes.value)
  }

  return {
    boundingBoxes,
    storeBoundingBox
  }
});
