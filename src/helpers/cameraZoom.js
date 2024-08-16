// cameraZoom.js

import * as TWEEN from '@tweenjs/tween.js';

export function zoomOut(camera, duration = 1000, zoomFactor = 1.5, cameraConfigsMobile = null) {
  
    console.log("Zoom in called with", cameraConfigsMobile)
    let initialPosition = { x: camera.position.x };
    let targetPosition = null
    if(!cameraConfigsMobile){
      targetPosition = { x: camera.position.x * zoomFactor };
    } else {
      targetPosition = { x: cameraConfigsMobile.x450g }
    }

    console.log("TargetPos", targetPosition)

    new TWEEN.Tween(initialPosition)
        .to(targetPosition, duration)
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate(() => {
          camera.position.setX(initialPosition.x);
          camera.updateProjectionMatrix();
        })
        .start();
}

export function zoomIn(camera, duration = 1000, zoomFactor = 1.5, cameraConfigsMobile = null) {
  
  console.log("Zoom in called with", cameraConfigsMobile)
  
  let initialPosition = { x: camera.position.x };
  let targetPosition = null
  if(!cameraConfigsMobile){
    targetPosition = { x: camera.position.x * zoomFactor };
  } else {
    targetPosition = { x: cameraConfigsMobile.x }
  }

  console.log("TARGETPOS", targetPosition);

  new TWEEN.Tween(initialPosition)
      .to(targetPosition, duration)
      .easing(TWEEN.Easing.Linear.None)
      .onUpdate(() => {
          camera.position.setX(initialPosition.x);
          camera.updateProjectionMatrix();
      })
      .start();
}
