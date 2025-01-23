// Effects:
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';

import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass';

import { ColorCorrectionShader } from 'three/examples/jsm/shaders/ColorCorrectionShader.js';

/* Uses the 'postprocessing' library (not three.js's out of the box postprocessing) */
import { EffectComposer as EffectComposerPPC }  from "postprocessing";
import { RenderPass as RenderPassPPC } from "postprocessing";
import { 
  DepthOfFieldEffect, 
  FXAAEffect, 
  SMAAEffect, 
  EffectPass 
} from 'postprocessing'

async function addPostProcessingPPCTest (renderer, scene, camera) {
  console.log("Adding postprocessing.")

  // verify that scene is set
  if (!renderer || !scene || !camera) {
      console.error('Required components not initialized');
      return;
  }

  try {
    const composer = new EffectComposerPPC(renderer);

    let depthOfFieldEffect = new DepthOfFieldEffect(camera, {
        focusDistance: 0.05,
        focalLength: 0.1,
        bokehScale: 1.5,
        height: 480
      });
    composer.addPass(new RenderPassPPC(scene, camera));
    composer.addPass(new EffectPass(camera, depthOfFieldEffect));
    // composer.addPass(new EffectPass(camera, new DepthEffect()));
    composer.addPass(new EffectPass(camera, new FXAAEffect()));
    composer.addPass(new EffectPass(camera, new SMAAEffect()));
    
    return composer;
  } catch (error) {
      console.error('Error setting up post-processing:', error);
  }
};

export default addPostProcessingPPCTest;