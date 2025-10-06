export default /* glsl */`
#ifdef USE_ENVMAP

	// ROOT CAUSE FOUND: Environment map is Linear but being treated as sRGB
	vec3 fixEnvironmentColor( vec3 color ) {
    return color;
		// The bug: When outputColorSpace is sRGB, Three.js seems to assume
		// the envmap texture follows the output colorspace, but PMREMGenerator
		// ALWAYS outputs Linear! This causes reflection paths to get wrong colors.

		// Since sRGB->Linear made reflections stronger, let's do partial conversion
		// to find the sweet spot
		vec3 adjusted = mix(
			color,  // Original (too dark)
			// sRGB->Linear conversion
			pow((color + vec3(0.055)) / 1.055, vec3(2.4)),
			0.5  // 50% mix
		);
		adjusted.r *= 0.85;  // Reduce red specifically
		return adjusted;

		// The proper fix would be to tell Three.js that this specific texture
		// should not be converted, or to fix the assumption in the renderer.
	}

	vec3 getIBLIrradiance( const in vec3 normal ) {

		#ifdef ENVMAP_TYPE_CUBE_UV

			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );

			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );

			return PI * fixEnvironmentColor(envMapColor.rgb) * envMapIntensity;

		#else

			return vec3( 0.0 );

		#endif

	}

	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {

		#ifdef ENVMAP_TYPE_CUBE_UV

			vec3 reflectVec = reflect( - viewDir, normal );

			// Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );

			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );

			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );

			return fixEnvironmentColor(envMapColor.rgb) * envMapIntensity;

		#else

			return vec3( 0.0 );

		#endif

	}

	#ifdef USE_ANISOTROPY

		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {

			#ifdef ENVMAP_TYPE_CUBE_UV

			  // https://google.github.io/filament/Filament.md.html#lighting/imagebasedlights/anisotropy
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );

				return getIBLRadiance( viewDir, bentNormal, roughness );

			#else

				return vec3( 0.0 );

			#endif

		}

	#endif

#endif
`;
