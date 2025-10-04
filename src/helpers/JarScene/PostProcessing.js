/* pmndrs 'postprocessing' library imports */
import { 
  EffectComposer as EffectComposerPPC, 
  RenderPass as RenderPassPPC, 
  EffectPass,
  SMAAPreset,
  EdgeDetectionMode,
  BlendFunction
} from 'postprocessing';
import { DepthOfFieldEffect, FXAAEffect, SMAAEffect, DepthEffect, PixelationEffect } from 'postprocessing';

/* three-provided imports */
import { EffectComposer as EffectComposerNative } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass as RenderPassNative} from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';

import { HalfFloatType, Vector3, SRGBColorSpace, MathUtils } from 'three';

async function addPostProcessing(renderer, scene, camera, frontPosition, backJarPos) {
  if (!renderer || !scene || !camera) {
    console.error('Required components not initialized');
    return;
  }

  const distToFront = camera.position.distanceTo(frontPosition);
  const distToBack = camera.position.distanceTo(backJarPos);
  const focusDistance = distToFront; // Use actual distance, not normalized!

  let maxSamples = renderer.capabilities.maxSamples
  let minSamples = 4;
  try {

    const composer = new EffectComposerPPC(renderer, {
      frameBufferType: HalfFloatType,
      multisampling: renderer.capabilities.isWebGL2 ? maxSamples : 0,
    });
    composer.outputColorSpace = renderer.outputColorSpace;

    const renderPass = new RenderPassPPC(scene, camera);
    renderPass.clear = true;
    composer.addPass(renderPass);

    // TRUE DEPTH-BASED DOF - Smooth gradual blur
    const depthOfFieldEffect = new DepthOfFieldEffect(camera, {
      focusDistance: focusDistance, // Updated dynamically to track closest jar (actual world distance)
      focusRange: 0.4, // Wide enough for all honey types/camera positions
      focalLength: 0.015, // Moderate blur strength
      bokehScale: 5.0, // Moderate bokeh size
      height: 480, // Good quality
      resolutionScale: 1.0,
    });

    const dofPass = new EffectPass(camera, depthOfFieldEffect);
    composer.addPass(dofPass);

    if (renderer.capabilities.isWebGL2) {
      // SMAA for WebGL2 (better quality) - ENABLED to smooth DOF edges
      const smaaEffect = new SMAAEffect({
        preset: SMAAPreset.ULTRA, // Options: LOW, MEDIUM, HIGH, ULTRA
        edgeDetectionMode: EdgeDetectionMode.COLOR, // Better edge detection
      });
      const smaaPass = new EffectPass(camera, smaaEffect);
      smaaPass.encodeOutput = true; // Important: encode output on final pass
      composer.addPass(smaaPass);
    } else {
      // FXAA for fallback (faster, works on all devices)
      const fxaaEffect = new FXAAEffect({
        blendFunction: BlendFunction.NORMAL,
        minEdgeThreshold: 0.01, // Lower for more edge detection
        maxEdgeThreshold: 0.1,
        subpixelQuality: 1.0,
      });
      const fxaaPass = new EffectPass(camera, fxaaEffect);
      fxaaPass.encodeOutput = true; // Important: encode output on final pass
      composer.addPass(fxaaPass);
    }

    // Return both composer and DOF effect so focus can be updated dynamically
    return { composer, depthOfFieldEffect };
  } catch (error) {
    console.error('Error setting up post-processing:', error);
    return null;
  }
}


async function addNativePostProcessing(renderer, scene, camera, frontPosition){
  try{
    console.log("Adding native PP:", renderer)
    // scene.background = 'white'
    // renderer.scene.background = null
    const composer = new EffectComposerNative(renderer);

    
    const distanceToFrontObject = camera.position.distanceTo(frontPosition);
    console.log("DistanceToFrontObject", distanceToFrontObject)
  
    const renderPass = new RenderPassNative(scene, camera);
    composer.addPass(renderPass)
  
    const bokehParams = {
      focus: 10.0,
      aperture: 0.002,
      maxblur: 0.01
    };
    const bokehPass = new BokehPass(scene, camera, bokehParams);
    bokehPass.materialBokeh.uniforms.focus.value = distanceToFrontObject;
    composer.addPass(bokehPass);
    
    // const afterimagePass = new AfterimagePass(0.95);
    // composer.addPass(afterimagePass);
  
    return composer
  } catch(e) {
    console.error("Failed to create postprocessing: ", e)
  }
}

export { addPostProcessing, addNativePostProcessing };
