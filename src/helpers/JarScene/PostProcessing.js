/* Uses the 'postprocessing' library */
import { 
  EffectComposer as EffectComposerPPC, 
  RenderPass as RenderPassPPC, 
  EffectPass,
  SMAAPreset,
  EdgeDetectionMode,
  BlendFunction
} from 'postprocessing';
import { DepthOfFieldEffect, FXAAEffect, SMAAEffect, DepthEffect, PixelationEffect } from 'postprocessing';


import { EffectComposer as EffectComposerNative } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass as RenderPassNative} from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';

import { HalfFloatType, Vector3, SRGBColorSpace } from 'three';

async function addPostProcessing(renderer, scene, camera, frontPosition) {
  console.log("Adding postprocessing.");

  const distanceToFrontObject = camera.position.distanceTo(frontPosition);
  console.log("DistanceToFrontObject", distanceToFrontObject)
  if (!renderer || !scene || !camera) {
    console.error('Required components not initialized');
    return;
  }

  try {
    const composer = new EffectComposerPPC(renderer, {frameBufferType: HalfFloatType});
    composer.outputEncoding = renderer.outputColorSpace;
    const renderPass = new RenderPassPPC(scene, camera)

    // renderPass.needsSwap = true;
    composer.addPass(renderPass);

    //DOF focus on jar in front.
    const depthOfFieldEffect = new DepthOfFieldEffect(camera, {
      focalLength: 0.1,
      bokehScale: 1.5,
      height: 600
    });

    depthOfFieldEffect.focusDistance = distanceToFrontObject;

    const dofPass = new EffectPass(camera, depthOfFieldEffect);
    console.log("DofPass:", dofPass)
    dofPass.encodeOutput = true;
    composer.addPass(dofPass);

    // FXAA - blurrier, lower quality
    const fxaaPass = new EffectPass(camera, new FXAAEffect());
    // composer.addPass(fxaaPass);

    // console.log("Composer:", composer)
    // composer.inputBuffer.texture.colorSpace  = SRGBColorSpace;
    // composer.outputBuffer.texture.colorSpace = SRGBColorSpace;
    // composer.copyPass.renderTarget.texture.colorSpace = SRGBColorSpace;
    // composer.depthTexture.colorSpace = SRGBColorSpace;

    // SMAA - higher quality, less blurry, sharper edges
    // const smaaPass = new EffectPass(camera, new SMAAEffect());
    // smaaPass.encodeOutput = true;
    // composer.addPass(smaaPass)

    
    return composer;
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
  
    return composer
  } catch(e) {
    console.error("Failed to create postprocessing: ", e)
  }
}

export { addPostProcessing, addNativePostProcessing };
