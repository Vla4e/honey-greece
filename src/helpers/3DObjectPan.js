import { debounce } from '@/helpers/globalFunctions.js'
import { Vector3, Quaternion } from 'three';

const rotationFactorX = 0.005;
const rotationFactorY = 0.005;
const debounceInterval = 0; // milliseconds
let mouseDown = false;

let rotationGroup = []
let jarSizeLocal = '300g'
let listenersActive = false;

let autoRotationActive = false;
let autoRotationSpeed = 0.01;

let initialRotations = [];

async function initiateObjectRotation(target, container, currentSize){
  console.log("Container", container)
  rotationGroup = [];
  jarSizeLocal = currentSize
  target.traverse((obj) => {
    if(obj.isMesh){
      console.log("MESH", obj.name)
      if(obj.name.includes(jarSizeLocal) && jarSizeLocal !== '450g'){
        rotationGroup.push(obj)
        initialRotations.push(obj.quaternion.clone())
      }
    }
  })
  console.log("Rotation group:", rotationGroup)
  registerEventListeners(target, container)
}

function registerEventListeners(target, container){
  console.log("Adding event listeners")
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
  mouseDown = true;
}

function handleMouseUp() {
  mouseDown = false;
}

function handleTouchStart(event) {
  mouseDown = true;
  const touch = event.touches[0];
  lastTouchX = touch.clientX;
  lastTouchY = touch.clientY;
  event.preventDefault();
}

function handleTouchMove(event, target) {
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
  if(mouseDown){
    debounce(() => rotateObject(event, target), debounceInterval)
  }
}

function rotateObject(event, target){
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