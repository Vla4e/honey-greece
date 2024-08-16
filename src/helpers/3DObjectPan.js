import { debounce } from '@/helpers/globalFunctions.js'
import { Vector3, Quaternion } from 'three';

const rotationFactorX = 0.005;
const rotationFactorY = 0.005;
const debounceInterval = 0; // milliseconds
let mouseDown = false;

let rotationGroup = []
let jarSizeLocal = '300g'
let listenersActive = false;

async function initiateObjectRotation(target, container, currentSize){
  rotationGroup = [];
  jarSizeLocal = currentSize
  target.traverse((obj) => {
    // console.log("ojb", obj)
    if(obj.isMesh){
      console.log("MESH", obj.name)
      if(obj.name.includes(jarSizeLocal) && jarSizeLocal !== '450g'){
        rotationGroup.push(obj)
      }
    }
  })
  console.log("Rotation group:", rotationGroup)
  registerEventListeners(target, container)
}

function registerEventListeners(target, container){
  console.log("And event listeners")
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
  container.addEventListener("touchstart", (event) => {
    mouseDown = true;
    event.preventDefault();  // Prevents the default scrolling on touch
  });

  container.addEventListener("touchmove", (event) => {
      if (mouseDown) {
          const touch = event.touches[0];
          event.movementX = touch.clientX - lastTouchX;
          event.movementY = touch.clientY - lastTouchY;
          lastTouchX = touch.clientX;
          lastTouchY = touch.clientY;
          debouncedMouseMove(event, target);
      }
      event.preventDefault();
  });

  container.addEventListener("touchend", () => {
      mouseDown = false;
  });
  listenersActive = true
}

let lastTouchX = 0;
let lastTouchY = 0;

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
  rotationGroup.forEach((obj) => {
    obj.quaternion.multiplyQuaternions(quaternionY, obj.quaternion)
  })
  // target.quaternion.multiplyQuaternions(quaternionY, target.quaternion)
  // target.quaternion.multiplyQuaternions(quaternionX, target.quaternion);
  // target.rotation.z += zRotation;
}

export { initiateObjectRotation }
