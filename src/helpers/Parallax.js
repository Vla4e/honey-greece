// Camera parallax parameters
let parallaxActive = true;
let parallaxIntensity = 0.05;
let parallaxDamping = 0.1;
let parallaxBounds = 0.3;
let originalCameraPosition = null;
let cameraTargetPosition = null;
let mouseParallax = { x: 0, y: 0 };

/**
 * Initializes camera parallax effect
 * @param {THREE.PerspectiveCamera} camera - The camera to apply parallax to
 * @param {THREE.Vector3} targetPosition - The position the camera is looking at (optional)
 * @param {Object} options - Configuration options
 */
function initCameraParallax(camera, targetPosition = null, options = {}) {
  // Store original camera position
  originalCameraPosition = camera.position.clone();
  cameraTargetPosition = targetPosition.clone();
  console.log("CAMERATARGETPOS", cameraTargetPosition)
  console.log("CAMERAACTPOS", originalCameraPosition)
  // Configure parallax options
  parallaxIntensity = options.intensity || 0.05;
  parallaxDamping = options.damping || 0.1;
  parallaxBounds = options.bounds || 0.3;
  parallaxActive = options.active !== undefined ? options.active : true;
  
  // Return the update function to be called in the animation loop
  return updateCameraParallax;
}

/**
 * Updates the camera position based on mouse movement for parallax effect
 * @param {THREE.PerspectiveCamera} camera - The camera to update
 * @param {THREE.Vector3} targetPosition - Optional target position to look at
 */
function updateCameraParallax(camera, targetPosition = null) {
  // console.log("TARGET POS: ", targetPosition)
  if (!parallaxActive || !originalCameraPosition) return;
  
  // Apply damping for smooth movement
  camera.position.x += (cameraTargetPosition.x - camera.position.x) * parallaxDamping;
  camera.position.y += (cameraTargetPosition.y - camera.position.y) * parallaxDamping;
  
  // Make camera look at target if provided
  if (targetPosition) {
    camera.lookAt(targetPosition);
  }
}

/**
 * Updates the mouse position for parallax (call this from your existing mouse handlers)
 * @param {Object} event - Mouse/Touch event object
 */
function updateParallaxMouse(event) {
  if (!parallaxActive || !originalCameraPosition) return;
  
  // Extract mouse/touch position
  let clientX, clientY;
  
  if (event.touches) {
    // Touch event
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    // Mouse event
    clientX = event.clientX;
    clientY = event.clientY;
  }
  
  // Get normalized coordinates (-1 to 1)
  mouseParallax.x = (clientX / window.innerWidth) * 2 - 1;
  mouseParallax.y = -((clientY / window.innerHeight) * 2 - 1);
  
  // Update camera target position
  cameraTargetPosition.x = originalCameraPosition.x + mouseParallax.x * parallaxBounds * parallaxIntensity;
  cameraTargetPosition.y = originalCameraPosition.y + mouseParallax.y * parallaxBounds * parallaxIntensity;
}

/**
 * Enable or disable parallax effect
 * @param {boolean} active - Whether parallax should be active
 */
function setParallaxActive(active) {
  parallaxActive = active;
  
  // Reset camera position when disabling parallax
  if (!active && originalCameraPosition) {
    cameraTargetPosition.copy(originalCameraPosition);
  }
}

/**
 * Set parallax intensity
 * @param {number} intensity - New intensity value
 */
function setParallaxIntensity(intensity) {
  parallaxIntensity = intensity;
}

export { initCameraParallax, updateCameraParallax, updateParallaxMouse, setParallaxActive, setParallaxIntensity };