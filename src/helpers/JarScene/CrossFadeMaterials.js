import * as THREE from 'three';

import { crossFadeTasks } from './CrossFadeTasks';

export function crossFadeMesh(oldMesh, newMaterial, scene, fadeDuration = 0.5) {
  console.log("=================================")
  console.log('Crossfading:', oldMesh)
  const geometry = oldMesh.geometry; 
  const newMesh = new THREE.Mesh(geometry, newMaterial);

  newMesh.position.copy(oldMesh.position);
  newMesh.quaternion.copy(oldMesh.quaternion);
  newMesh.scale.copy(oldMesh.scale);

  makeTransparent(oldMesh.material, 1);
  makeTransparent(newMesh.material, 0); 

  scene.add(newMesh);

  crossFadeTasks.push({
    oldMesh,
    newMesh,
    startTime: performance.now(),
    duration: fadeDuration
  });
}

function makeTransparent(material, opacity) {
  if (Array.isArray(material)) {
    material.forEach(m => {
      m.transparent = true;
      m.opacity = opacity;
    });
  } else {
    material.transparent = true;
    material.opacity = opacity;
  }
}

export function updateCrossFades(now) {
  for (let i = crossFadeTasks.length - 1; i >= 0; i--) {
    const task = crossFadeTasks[i];
    const elapsed = (now - task.startTime) / 1000;
    const t = Math.min(elapsed / task.duration, 1);

    setOpacity(task.oldMesh.material, 1 - t);

    setOpacity(task.newMesh.material, t);

    if (t >= 1) {
      task.oldMesh.parent?.remove(task.oldMesh);

      task.oldMesh.geometry.dispose();
      disposeMaterial(task.oldMesh.material);

      crossFadeTasks.splice(i, 1);
    }
  }
}

function setOpacity(material, opacity) {
  if (Array.isArray(material)) {
    material.forEach(m => (m.opacity = opacity));
  } else {
    material.opacity = opacity;
  }
}

function disposeMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach(m => m.dispose());
  } else {
    material.dispose();
  }
}