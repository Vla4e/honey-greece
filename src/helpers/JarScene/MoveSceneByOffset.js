/* Moves every mesh in the scene by an offset, along with the camera */

import {
  Vector3
} from 'three'
import honeyPresets from '../../assets/honey-visuals/honeyParameterPresets';

let originalScenePosition = new Vector3(0, 0, 0);
let originalCameraPosition = new Vector3(0.35, 0.06, 0);
let hasStoredOriginalPositions = false;

async function moveSceneToGridPosition(scene, camera, singleJarPos, type) {
  console.log("Moving scene to grid position")
  // 1) If this is the first time, store the original scene/camera positions (for revert later).
  if (!hasStoredOriginalPositions) {
    originalScenePosition.copy(scene.position);

    // If your camera is a direct child of the scene, you typically
    // only need to move `scene.position`. However, if your camera
    // is NOT parented to scene, store its original position too:
    originalCameraPosition.copy(camera.position);

    hasStoredOriginalPositions = true;
  }

  let { x, y, z } = honeyPresets[type].jarGridPosition
  let gridJarPos = new Vector3(x, y, z)
  console.log("GridJarPos:", gridJarPos)
  // 2) Compute the offset from the jar’s current position to the grid position.
  //    offset = gridJarPos - singleJarMesh.position
  const offset = new Vector3().subVectors(gridJarPos, singleJarPos);

  // 3) Move the entire scene by that offset.
  //    All children of scene (including camera) will shift together,
  //    so that `singleJarMesh` ends up at `gridJarPos`.
  scene.position.add(offset);

  // If your camera is NOT a child of scene, you need:
  // camera.position.add(offset);

  // 4) Now the jar should appear at the same world coords it had in the grid.
  //    You can render now or let your normal animation loop handle it:
  // renderer.render(scene, camera);  // (example call)
  return offset
}

/**
 * Restores the scene (and camera) back to their original positions before the offset was applied.
 */
async function revertScenePosition(scene, camera) {
  console.log("Reverting pos scene:", scene)
  // 1) Reset scene position to original
  scene.position.copy(originalScenePosition);

  // 2) If your camera is not a child of scene, reset it too:
  camera.position.copy(originalCameraPosition);
  return;
}

export { moveSceneToGridPosition, revertScenePosition }