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
import { HalfFloatType, Vector3 } from 'three';

async function addPostProcessing(renderer, scene, camera) {
  console.log("Adding postprocessing.");

  if (!renderer || !scene || !camera) {
    console.error('Required components not initialized');
    return;
  }

  try {
    const composer = new EffectComposerPPC(renderer, {frameBufferType: HalfFloatType});

    const renderPass = new RenderPassPPC(scene, camera)
    composer.addPass(renderPass);

    //DOF focus on jar in front.
    const depthOfFieldEffect = new DepthOfFieldEffect(camera, {
      focalLength: 0.05,
      bokehScale: 1.0,
      height: 600
    });
    // const targetPoint = new Vector3(
    //   -0.0002538628759793937,
    //   0.0344855822622776,
    //   -0.00008241005707532167
    // )
    // depthOfFieldEffect.target = targetPoint;

    // const focusPoint = new Vector3(
    //   -0.0002538628759793937,
    //   0.0344855822622776,
    //   -0.00008241005707532167
    // );
    // const computedDistance = depthOfFieldEffect.calculateFocusDistance(focusPoint);
    // depthOfFieldEffect.focusDistance = computedDistance;

    const dofPass = new EffectPass(camera, depthOfFieldEffect);
    composer.addPass(dofPass);

    // FXAA - blurrier, lower quality
    const fxaaPass = new EffectPass(camera, new FXAAEffect());
    composer.addPass(fxaaPass);

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

export default addPostProcessing;
