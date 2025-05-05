import { Box3, Vector3, BoxHelper } from 'three';

const storedBoxes = {};
let storedDistance = null;
// 32.7
export async function getDistanceToRightEdge(object, camera, renderer) {
  console.log("ATTEMPTING TO GET DSITANCE", object, object.updateMatrixWorld)
  // 1) Ensure world transforms are up to date
  object.updateMatrixWorld(true);

  // 2) Create an axis-aligned bounding box in world space
  if (!storedBoxes[object.name]) {
    console.log("Storing in cache")
    // 1) Ensure world transforms are up to date (on the first call)
    object.updateMatrixWorld(true);

    // 2) Create an axis-aligned bounding box (in world space this first time)
    const newBox = new Box3().setFromObject(object);
    // Store it in your "cache"
    storedBoxes[object.name] = newBox;
  }
  
  console.log("Retrieving from cache", storedBoxes)
  let box = storedBoxes[object.name];
  if (!box || !box.isBox3 || !box.min || !box.max) {
    return 0;
  }

  // 3) Extract the 8 corners of the bounding box
  const corners = [
    new Vector3(box.min.x, box.min.y, box.min.z),
    new Vector3(box.min.x, box.min.y, box.max.z),
    new Vector3(box.min.x, box.max.y, box.min.z),
    new Vector3(box.min.x, box.max.y, box.max.z),
    new Vector3(box.max.x, box.min.y, box.min.z),
    new Vector3(box.max.x, box.min.y, box.max.z),
    new Vector3(box.max.x, box.max.y, box.min.z),
    new Vector3(box.max.x, box.max.y, box.max.z),
  ];

  // Prepare to find the maximum X in screen space
  let maxScreenX = -Infinity;

  // 4) For each corner: project into NDC, then convert to pixel coords
  const width = renderer.domElement.width;
  const height = renderer.domElement.height;
  console.log("WIDTH:", width)
  corners.forEach((corner) => {
    // Project corner from world space to normalized device coordinates
    corner.project(camera);

    // Convert from NDC ([-1..1]) to pixel coordinates
    const screenX = (corner.x * 0.5 + 0.5) * width;
    // (We only need X for this particular measurement, but here's Y as a reference)
    // const screenY = (-corner.y * 0.5 + 0.5) * height;

    // Track the largest X
    if (screenX > maxScreenX) {
      maxScreenX = screenX;
    }
  });

  // 5) Distance in pixels from the object's rightmost edge to the canvas right edge
  const distance = width - maxScreenX;
  if(storedDistance === null){
    storedDistance = distance
  }
  console.log("DISTANCE", distance)
  // If the object extends beyond the right edge, distance could be negative
  // up to you whether to clamp to 0
  return storedDistance < 0 ? 0 : storedDistance
}