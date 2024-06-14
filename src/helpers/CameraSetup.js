import { PerspectiveCamera } from 'three';

export function initializeCamera(aspectRatio) {
    const camera = new PerspectiveCamera(25, aspectRatio, 0.001, 5);
    camera.position.set(0.35, 0.06, 0); // Example coordinates
    return camera;
}
