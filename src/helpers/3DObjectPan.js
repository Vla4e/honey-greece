import { debounce } from '@/helpers/globalFunctions.js'
import { Vector3, Quaternion } from 'three';

const rotationFactorX = 0.005;
const rotationFactorY = 0.005;
const debounceInterval = 0; // milliseconds
let mouseDown = false;

function initiateObjectRotation(target, container){
  registerEventListeners(target, container)
}

function registerEventListeners(target, container){

  container.addEventListener("mousedown", () => {
    mouseDown = true;
  })

  container.addEventListener("mousemove", (event) => {
    // console.log("mouse move")
    debouncedMouseMove(event, target)
  })

  container.addEventListener("mouseup", () => {
    mouseDown = false;
  })
}

function debouncedMouseMove (event, target){
  if(mouseDown){
    debounce( rotateObject(event, target), debounceInterval )
  }
}
function rotateObject(event, target){
  // target.computedBoundingBox();
  const xRotation = event.movementY * rotationFactorX;
  const yRotation = event.movementX * rotationFactorY;
  // const zRotation = (Math.abs(event.movementX) + Math.abs(event.movementY)) * 0.0025;
  
  // target.rotation.x += xRotation;
  // target.rotation.y += yRotation;


    // Create a quaternion for the X rotation relative to the global X axis
  const quaternionX = new Quaternion();
  const quaternionY = new Quaternion();
  quaternionX.setFromAxisAngle(new Vector3(0, 0, 1), xRotation);
  quaternionY.setFromAxisAngle(new Vector3(0, 1, 0), yRotation);
  quaternionX.invert()

  // Apply the quaternion to the object
  target.quaternion.multiplyQuaternions(quaternionY, target.quaternion)
  // target.quaternion.multiplyQuaternions(quaternionX, target.quaternion);
  // target.rotation.z += zRotation;
}

export { initiateObjectRotation }
