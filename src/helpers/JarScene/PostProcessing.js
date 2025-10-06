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
      focus: distanceToFrontObject,  // Focus on the front jar
      aperture: 0.4,  // Reasonable blur intensity
      maxblur: 0.01   // Reasonable blur radius
    };
    const bokehPass = new BokehPass(scene, camera, bokehParams);
    // Focus is already set in bokehParams, no need to set it again

    // Custom shader - but simplified to match original behavior
    let bokehShader = bokehPass.materialBokeh.fragmentShader;
    const originalMain = bokehShader.match(/void main\(\) \{[\s\S]*\}/)[0];

    const newMain = `void main() {
      vec2 aspectcorrect = vec2( 1.0, aspect );
      float viewZ = getViewZ( getDepth( vUv ) );
      float factor = ( focus + viewZ );

      // Get center pixel
      vec4 centerCol = texture2D( tColor, vUv.xy );
      float centerAlpha = centerCol.a;

      // For opaque pixels: use direct depth check
      // For transparent pixels (halo): check if ANY nearby pixel at front depth is opaque
      bool isFrontJar = false;

      if (centerAlpha > 0.3) {
        // Opaque pixel - just check its own depth
        isFrontJar = (viewZ >= -0.6);
      } else {
        // Transparent pixel (halo) - check neighborhood
        vec2 texelSize = vec2(1.0 / 1920.0, 1.0 / 1080.0);
        for(float dy = -1.0; dy <= 1.0; dy += 1.0) {
          for(float dx = -1.0; dx <= 1.0; dx += 1.0) {
            vec2 offset = vec2(dx, dy) * texelSize;
            float neighborDepth = texture2D( tDepth, vUv + offset ).x;
            float neighborViewZ = getViewZ( neighborDepth );
            float neighborAlpha = texture2D( tColor, vUv + offset ).a;

            // If neighbor is opaque AND at front depth, this halo belongs to front jar
            if (neighborAlpha > 0.3 && neighborViewZ >= -0.6) {
              isFrontJar = true;
              break;
            }
          }
          if (isFrontJar) break;
        }
      }

      // Safe zone for front jar only - TIGHTER to eliminate halo
      float safeFactor = factor;
      if (isFrontJar && abs(factor) < 0.5) {
        safeFactor = 0.0; // No blur on front jar
      }
      vec2 dofblur = vec2 ( clamp( safeFactor * aperture, -maxblur, maxblur ) );

      vec2 dofblur9 = dofblur * 0.9;
      vec2 dofblur7 = dofblur * 0.7;
      vec2 dofblur4 = dofblur * 0.1;

      // centerCol and centerAlpha already sampled above
      vec4 col = centerCol; // Start with center
      float totalWeight = 1.0;

      // Only blur if we're supposed to (dofblur > 0) - REMOVED centerAlpha check!
      if (length(dofblur) > 0.01) {
        // Front vs back jar get different alpha thresholds
        vec4 s;
        if (isFrontJar) { // Front jar - EXTREME strict alpha check
          // FRONT JAR: ONLY accept samples with IDENTICAL alpha (< 0.01) - ZERO halo!
          for(int i = 0; i < 16; i++) {
            vec2 offsets[16];
            offsets[0] = vec2(  0.0,   0.4  );
            offsets[1] = vec2(  0.15,  0.37 );
            offsets[2] = vec2(  0.29,  0.29 );
            offsets[3] = vec2( -0.37,  0.15 );
            offsets[4] = vec2(  0.40,  0.0  );
            offsets[5] = vec2(  0.37, -0.15 );
            offsets[6] = vec2(  0.29, -0.29 );
            offsets[7] = vec2( -0.15, -0.37 );
            offsets[8] = vec2(  0.0,  -0.4  );
            offsets[9] = vec2( -0.15,  0.37 );
            offsets[10] = vec2( -0.29,  0.29 );
            offsets[11] = vec2(  0.37,  0.15 );
            offsets[12] = vec2( -0.4,   0.0  );
            offsets[13] = vec2( -0.37, -0.15 );
            offsets[14] = vec2( -0.29, -0.29 );
            offsets[15] = vec2(  0.15, -0.37 );

            s = texture2D( tColor, vUv.xy + (offsets[i] * aspectcorrect) * dofblur );
            if (abs(s.a - centerAlpha) < 0.001) { // ULTRA EXTREME: nearly identical alpha only
              col += s;
              totalWeight += 1.0;
            }
          }
        } else {
          // BACK JAR: ALL 40 samples, NO ALPHA CHECK - pure natural blur!
          // 16 at full dofblur
          col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(  0.15,  0.37 ) * aspectcorrect ) * dofblur );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(-0.37,  0.15 ) * aspectcorrect ) * dofblur );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2( 0.40,  0.0  ) * aspectcorrect ) * dofblur );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2( 0.37, -0.15 ) * aspectcorrect ) * dofblur );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2( 0.29, -0.29 ) * aspectcorrect ) * dofblur );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(-0.15, -0.37 ) * aspectcorrect ) * dofblur );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2( 0.0,  -0.4  ) * aspectcorrect ) * dofblur );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(-0.15,  0.37 ) * aspectcorrect ) * dofblur );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(-0.29,  0.29 ) * aspectcorrect ) * dofblur );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2( 0.37,  0.15 ) * aspectcorrect ) * dofblur );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(-0.4,   0.0  ) * aspectcorrect ) * dofblur );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(-0.37, -0.15 ) * aspectcorrect ) * dofblur );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(-0.29, -0.29 ) * aspectcorrect ) * dofblur );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2( 0.15, -0.37 ) * aspectcorrect ) * dofblur );
          totalWeight += 1.0;

          // 8 at dofblur9
          col += texture2D( tColor, vUv.xy + ( vec2( 0.15,  0.37 ) * aspectcorrect ) * dofblur9 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(-0.37,  0.15 ) * aspectcorrect ) * dofblur9 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2( 0.37, -0.15 ) * aspectcorrect ) * dofblur9 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(-0.15, -0.37 ) * aspectcorrect ) * dofblur9 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(-0.15,  0.37 ) * aspectcorrect ) * dofblur9 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2( 0.37,  0.15 ) * aspectcorrect ) * dofblur9 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(-0.37, -0.15 ) * aspectcorrect ) * dofblur9 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2( 0.15, -0.37 ) * aspectcorrect ) * dofblur9 );
          totalWeight += 1.0;

          // 8 at dofblur7
          col += texture2D( tColor, vUv.xy + ( vec2( 0.29,  0.29 ) * aspectcorrect ) * dofblur7 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2( 0.40,  0.0  ) * aspectcorrect ) * dofblur7 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2( 0.29, -0.29 ) * aspectcorrect ) * dofblur7 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2( 0.0,  -0.4  ) * aspectcorrect ) * dofblur7 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(-0.29,  0.29 ) * aspectcorrect ) * dofblur7 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(-0.4,   0.0  ) * aspectcorrect ) * dofblur7 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(-0.29, -0.29 ) * aspectcorrect ) * dofblur7 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2( 0.0,   0.4  ) * aspectcorrect ) * dofblur7 );
          totalWeight += 1.0;

          // 8 at dofblur4
          col += texture2D( tColor, vUv.xy + ( vec2( 0.29,  0.29 ) * aspectcorrect ) * dofblur4 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2( 0.4,   0.0  ) * aspectcorrect ) * dofblur4 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2( 0.29, -0.29 ) * aspectcorrect ) * dofblur4 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2( 0.0,  -0.4  ) * aspectcorrect ) * dofblur4 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(-0.29,  0.29 ) * aspectcorrect ) * dofblur4 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(-0.4,   0.0  ) * aspectcorrect ) * dofblur4 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2(-0.29, -0.29 ) * aspectcorrect ) * dofblur4 );
          totalWeight += 1.0;
          col += texture2D( tColor, vUv.xy + ( vec2( 0.0,   0.4  ) * aspectcorrect ) * dofblur4 );
          totalWeight += 1.0;
        }
      }

      gl_FragColor = col / totalWeight;
      // Alpha is handled naturally by the blur - no special treatment needed

      // DEBUG: Visualize dofblur strength (white = lots of blur, black = no blur)
      // float blurStrength = length(dofblur) * 10.0; // Multiply to make visible
      // gl_FragColor.g = blurStrength; // Green channel shows blur amount

      // DEBUG: Color code to see which path is taken
      // if (isFrontJar) {
      //   gl_FragColor.r += 0.3; // Front jar = reddish tint
      // } else {
      //   gl_FragColor.b += 0.3; // Back jar = bluish tint
      // }
    }`;

    bokehShader = bokehShader.replace(originalMain, newMain);

    console.log("✅ Custom alpha-aware bokeh shader installed!");
    bokehPass.materialBokeh.fragmentShader = bokehShader;
    bokehPass.materialBokeh.needsUpdate = true;

    console.log("✅ Using ORIGINAL unmodified BokehPass to test halo!");
    composer.addPass(bokehPass);

    // Note: SMAA/FXAA breaks the bokeh blur entirely, even at 1% opacity - skip it!

    // FIX 2: Add OutputPass for proper sRGB conversion (fixes red bleed)
    const { OutputPass } = await import('three/examples/jsm/postprocessing/OutputPass.js');
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    console.log("✅ Using BokehPass with alpha fix + OutputPass for proper sRGB!");

    return composer
  } catch(e) {
    console.error("Failed to create postprocessing: ", e)
  }
}

export { addPostProcessing, addNativePostProcessing };
