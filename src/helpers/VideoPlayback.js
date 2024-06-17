// Import necessary functions from Three.js
import { debounce } from '@/helpers/globalFunctions.js';

const playbackSpeedFactor = 0.05; // Sensitivity factor for mouse movement
let mouseDown = false;
let animationFrameId;
let targetTime = 0; // The target time we want to move to based on mouse movement

// Function to initiate video control on mouse events
function initiateVideoControl(video, container) {
  video.addEventListener('loadedmetadata', () => {
    // Log video metadata to ensure it's loaded correctly
    console.log(`Video Duration: ${video.duration}s`);
    registerEventListeners(video, container);
  });
}

function registerEventListeners(video, container) {
  container.addEventListener("mousedown", () => {
    mouseDown = true;
    console.log("Mouse down");
    cancelAnimationFrame(animationFrameId); // Stop any previous frame updates
    startAnimationFrame(video); // Start updating on mouse down
  });

  container.addEventListener("mousemove", (event) => {
    if (mouseDown) {
      updatePlaybackFromMouse(event, video);
    }
  });

  container.addEventListener("mouseup", () => {
    mouseDown = false;
    console.log("Mouse up");
    cancelAnimationFrame(animationFrameId); // Stop updating on mouse up
  });

  container.addEventListener("mouseleave", () => {
    mouseDown = false;
    console.log("Mouse leave");
    cancelAnimationFrame(animationFrameId); // Stop updating if mouse leaves
  });
}

function updatePlaybackFromMouse(event, video) {
  const videoDuration = video.duration;

  // Calculate the change in time as a percentage of the video duration
  const deltaX = event.movementX * playbackSpeedFactor;
  const timeChange = deltaX * videoDuration / window.innerWidth;

  // Update the target time
  targetTime = Math.max(0, Math.min(video.duration, video.currentTime + timeChange));
  console.log(`Target Time: ${targetTime}s`);
}

function startAnimationFrame(video) {
  function update() {
    // Smoothly transition to the target time
    const currentTime = video.currentTime;
    const timeDifference = targetTime - currentTime;

    // Adjust the current time gradually towards the target time
    if (Math.abs(timeDifference) > 0.01) { // Small threshold to make changes gradual
      video.currentTime += timeDifference * 0.1; // Move 10% closer to the target time per frame
      console.log(`Updating Current Time: ${video.currentTime}s`);
    }

    // Request the next frame update if still in mouse down state
    if (mouseDown) {
      animationFrameId = requestAnimationFrame(update);
    } else {
      console.log("Stopping animation frame updates");
    }
  }

  // Start the animation frame updates
  animationFrameId = requestAnimationFrame(update);
}
export { initiateVideoControl };
