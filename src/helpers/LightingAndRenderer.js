import { WebGLRenderer, PointLight } from 'three';

export function setupRenderer(canvas) {
    const renderer = new WebGLRenderer({ canvas, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    return renderer;
}

export function setupLights(targetMesh) {
    const light = new PointLight(0xffffff, 1);
    light.position.set(targetMesh.position.x, targetMesh.position.y, targetMesh.position.z + 0.5);
    return light;
}
