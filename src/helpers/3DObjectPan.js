import { debounce } from '@/helpers/globalFunctions.js'
import { Vector3, Quaternion, AxesHelper } from 'three';
import { initCameraParallax, updateCameraParallax, updateParallaxMouse, setParallaxActive, setParallaxIntensity } from './Parallax.js'
import emitter from '@/helpers/emitter.js'; 

const rotationFactorX = 0.005;
const rotationFactorY = 0.005;
const debounceInterval = 0; // milliseconds
let mouseDown = false;

let rotationGroup = []
let jarSizeLocal = '300g'
let listenersActive = false;

let autoRotationActive = false;
let autoRotationSpeed = 0.005;

let initialRotations = [];

let axesHelper2 = new AxesHelper(5);
axesHelper2.setColors('blue', 'green', 'red')
async function initiateObjectRotation(target, container, currentSize){
  console.log("Initiating Object Rotation:", currentSize)
  let removedGramsSizeString = currentSize.substring(0, currentSize.length - 1)
  console.log("RemovedGramsSize", removedGramsSizeString)
  rotationGroup = [];
  jarSizeLocal = currentSize
  target.traverse((obj) => {
    if(obj.isMesh){
      // console.log("Obj:", obj)
      // console.log("OBJ NAME", obj.name, currentSize, jarSizeLocal, obj.name === currentSize, obj.name.includes(currentSize))
      if(obj.name.includes(removedGramsSizeString)){ // enable 450 by removing 2nd condition
        rotationGroup.push(obj)
        initialRotations.push(obj.quaternion.clone())
      }
    }
  })
  console.log("Rotation group:", rotationGroup)
  registerEventListeners(target, container)
}

function registerEventListeners(target, container){
  // console.log("Adding event listeners")
  container.addEventListener("mousedown", handleMouseDown)
  container.addEventListener("mousemove", (event) => debouncedMouseMove(event, target))
  container.addEventListener("mouseup", handleMouseUp)
  container.addEventListener("touchstart", handleTouchStart)
  container.addEventListener("touchmove", (event) => handleTouchMove(event, target))
  container.addEventListener("touchend", handleMouseUp)
  listenersActive = true
}

let lastTouchX = 0;
let lastTouchY = 0;

function handleMouseDown() {
  // console.log("MouseDown")
  mouseDown = true;
  stopAutoRotation();
  emitter.emit('rotatingJar', true)
}

function handleMouseUp() {
  // console.log("MouseUp")
  mouseDown = false;
  startAutoRotation();
  emitter.emit('rotatingJar', false)
}

function handleTouchStart(event) {
  // console.log("TouchStart")
  mouseDown = true;
  stopAutoRotation();
  const touch = event.touches[0];
  lastTouchX = touch.clientX;
  lastTouchY = touch.clientY;
  event.preventDefault();
}

function handleTouchMove(event, target) {
  // console.log("TouchMove")
  if (mouseDown) {
    const touch = event.touches[0];
    const movementX = touch.clientX - lastTouchX;
    const movementY = touch.clientY - lastTouchY;
    rotateObject({ movementX, movementY }, target);
    lastTouchX = touch.clientX;
    lastTouchY = touch.clientY;
  }
  event.preventDefault();
}

function debouncedMouseMove(event, target){
  // console.log("DebouncedMOVE")
  if(mouseDown){ // temp fix because the callback passed to debounced is not triggering
    // debounce(() => rotateObject(event, target), debounceInterval)
    rotateObject(event, target)
  }

  updateParallaxMouse(event);

}

function rotateObject(event, target){
  // console.log("Rotate")
  const xRotation = event.movementY * rotationFactorX;
  const yRotation = event.movementX * rotationFactorY;

  const quaternionX = new Quaternion();
  const quaternionY = new Quaternion();
  quaternionX.setFromAxisAngle(new Vector3(0, 0, 1), xRotation);
  quaternionY.setFromAxisAngle(new Vector3(0, 1, 0), yRotation);
  quaternionX.invert()

  rotationGroup.forEach((obj) => {
    obj.quaternion.multiplyQuaternions(quaternionY, obj.quaternion)
  })
}

function startAutoRotation() {
  autoRotationActive = true;
  animateAutoRotation();
}

function stopAutoRotation() {
  autoRotationActive = false;
}

function animateAutoRotation() {
  if (autoRotationActive) {
    const autoRotationQuaternion = new Quaternion();
    autoRotationQuaternion.setFromAxisAngle(new Vector3(0, 1, 0), autoRotationSpeed);

    rotationGroup.forEach((obj) => {
      obj.quaternion.multiplyQuaternions(autoRotationQuaternion, obj.quaternion);
    });

    requestAnimationFrame(animateAutoRotation);
  }
}

// UNUSED AND NOT NEEDED
function resetRotation() {
  const duration = 1000; // Duration of the animation in milliseconds
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    
    rotationGroup.forEach((obj, index) => {
      obj.quaternion.slerp(initialRotations[index], progress);
    });

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

export { initiateObjectRotation, startAutoRotation, stopAutoRotation, resetRotation }