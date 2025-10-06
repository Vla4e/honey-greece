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

import {
  HalfFloatType,
  Vector3,
  Vector2,
  SRGBColorSpace,
  MathUtils,
  WebGLRenderTarget,
  NoToneMapping,
  RGBAFormat,
  LinearFilter,
  FloatType,
  AmbientLight,
  Color,
  MeshBasicMaterial,
  LinearSRGBColorSpace,
  ACESFilmicToneMapping,
  LinearToneMapping
} from 'three';

async function addPostProcessing(renderer, scene, camera, frontPosition, backJarPos) {
  if (!renderer || !scene || !camera) {
    console.error('Required components not initialized');
    return;
  }

  const distToFront = camera.position.distanceTo(frontPosition);
  const distToBack = camera.position.distanceTo(backJarPos);
  const focusDistance = distToFront;

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

    const depthOfFieldEffect = new DepthOfFieldEffect(camera, {
      focusDistance: focusDistance,
      focusRange: 0.005,
      focalLength: 0.005,
      bokehScale: 1.0,
      height: 480,
      resolutionScale: 1.0,
    });

    const dofPass = new EffectPass(camera, depthOfFieldEffect);
    composer.addPass(dofPass);

    if (renderer.capabilities.isWebGL2) {
      const smaaEffect = new SMAAEffect({
        preset: SMAAPreset.ULTRA,
        edgeDetectionMode: EdgeDetectionMode.COLOR,
      });
      const smaaPass = new EffectPass(camera, smaaEffect);
      smaaPass.encodeOutput = true;
      composer.addPass(smaaPass);
    } else {
      const fxaaEffect = new FXAAEffect({
        blendFunction: BlendFunction.NORMAL,
        minEdgeThreshold: 0.01,
        maxEdgeThreshold: 0.1,
        subpixelQuality: 1.0,
      });
      const fxaaPass = new EffectPass(camera, fxaaEffect);
      fxaaPass.encodeOutput = true;
      composer.addPass(fxaaPass);
    }

    return { composer, depthOfFieldEffect };
  } catch (error) {
    console.error('Error setting up post-processing:', error);
    return null;
  }
}


async function addNativePostProcessing(renderer, scene, camera, frontPosition){
  try{
    // Clean version with Three.js fix applied via import

    const size = renderer.getSize(new Vector2());
    const pixelRatio = renderer.getPixelRatio();

    const rtOptions = {
      type: HalfFloatType,
      format: RGBAFormat,
      colorSpace: LinearSRGBColorSpace,  // Back to sRGB, now that Three.js respects it!
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      generateMipmaps: false,
      depthBuffer: true,
      stencilBuffer: false,
    };

    const renderTarget = new WebGLRenderTarget(
      size.width * pixelRatio,
      size.height * pixelRatio,
      rtOptions
    );

    const composer = new EffectComposerNative(renderer, renderTarget);

    // Standard render pass - the Three.js fix handles envmap issues
    const renderPass = new RenderPassNative(scene, camera);
    renderPass.clear = true;
    composer.addPass(renderPass);

    // Create BokehPass
    const distanceToFrontObject = camera.position.distanceTo(frontPosition);
    const bokehParams = {
      focus: distanceToFrontObject,
      aperture: 0.002,
      maxblur: 0.02,
      width: renderer.domElement.width,
      height: renderer.domElement.height
    };
    const bokehPass = new BokehPass(scene, camera, bokehParams);

    // Fix BokehPass shader for proper alpha handling
    let bokehShader = bokehPass.materialBokeh.fragmentShader;
    // Don't disable ANYTHING - let Three.js handle it properly!
    bokehShader = bokehShader
      // .replace('#include <tonemapping_fragment>', '// tonemapping disabled')
      // .replace('#include <colorspace_fragment>', '// colorspace conversion disabled');
      // DON'T disable colorspace conversion - we need it for final output!

    // Fix alpha: Just remove the hardcoded 1.0
    bokehShader = bokehShader.replace(
      'gl_FragColor.a = 1.0;',
      '// gl_FragColor.a = 1.0;  // Don\'t override alpha!'
    );

    // Fix for environment map colorspace when rendering to sRGB RT
    // The render pass writes sRGB-encoded colors but env maps are Linear
    // We need to ensure proper color handling
    // bokehShader = bokehShader.replace(
    //   'vec4 texel = texture2D( tColor, vUv );',
    //   `vec4 texel = texture2D( tColor, vUv );
    //   // Input is already in correct space from render pass`
    // );

    // Proper DOF blur calculation
    bokehShader = bokehShader.replace(
      'vec2 dofblur = vec2 ( clamp( factor * aperture, -maxblur, maxblur ) );',
      `
      // Proper DOF calculation based on distance
      float blurAmount = factor * aperture;
      if (abs(factor) < 0.2) {
        blurAmount = 0.0; // Front jar sharp
      }
      else if (factor < -0.2) {
        blurAmount = abs(blurAmount) * 25.0; // Back jar blurred
      }

      vec2 dofblur = vec2(clamp(blurAmount, -maxblur, maxblur));
      `
    );

    // Remove the broken fix for now

    bokehPass.materialBokeh.fragmentShader = bokehShader;
    bokehPass.materialBokeh.needsUpdate = true;

    composer.addPass(bokehPass);

    // CRITICAL FIX: Add OutputPass to handle sRGB conversion properly!
    // This ensures proper colorspace handling for render targets
    const { OutputPass } = await import('three/examples/jsm/postprocessing/OutputPass.js');
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    console.log("✅ Using clean DOF with OutputPass for proper sRGB handling!");

    // DEBUG: Check render target colorspace
    console.log("🔍 RT ColorSpace Debug:", {
      rtColorSpace: renderTarget.texture.colorSpace,
      rendererOutputColorSpace: renderer.outputColorSpace,
    });

    return composer;
  } catch(e) {
    console.error("Failed to create postprocessing: ", e)
    return null;
  }
}

export { addPostProcessing, addNativePostProcessing };