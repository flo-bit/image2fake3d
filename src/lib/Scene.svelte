<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { useTexture, Align, OrbitControls } from '@threlte/extras';

	import { Vector2, ShaderMaterial, PlaneGeometry, LinearEncoding } from 'three';

	import type { DepthImage } from '$lib/store';

	export let image: DepthImage;

	const map = useTexture(image.image, {
		transform: (texture) => {
			texture.encoding = LinearEncoding
			return texture;
		}
	});
	const depthMap = useTexture(image.depth, {
		transform: (texture) => {
			//texture.encoding = LinearEncoding;
			return texture;
		}
	});

	const rotation = new Vector2(0.5, 0.5);

	const uniforms = {
		uTexture: { type: 't', value: map },
		depthMap: { type: 't', value: depthMap }
	};
	const material = new ShaderMaterial({
		uniforms: uniforms,
		vertexShader: `
varying vec2 vUv;
uniform sampler2D depthMap;

void main() {
    vUv = uv;
    // move z position based on the depth map
    float depth = texture2D(depthMap, vUv).r;
    vec3 newPosition = position + vec3(0.0, 0.0, depth * 1.5);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}`,
		fragmentShader: `
uniform sampler2D uTexture;
// uniform sampler2D depthMap;
// uniform vec2 mouse;
varying vec2 vUv;

void main() {
	// float shift = texture2D(depthMap, vUv).r;
	// vec2 uv = vUv + mouse * shift * 0.03;

    gl_FragColor = texture2D(uTexture, vUv);
}`
	});

	const geometry = new PlaneGeometry(7, 7, 500, 500);

	// Variables to store initial orientation
	let initialAlpha = 0,
		initialBeta = 0,
		initialGamma = 0;
	export let isCalibrated = false;

	let useOrientation = false;

	// Function to handle device orientation event
	function handleOrientation(event: DeviceOrientationEvent) {
		if (!isCalibrated) {
			// Calibrate the initial orientation
			initialAlpha = event.alpha ?? 0;
			initialBeta = event.beta ?? 0;
			initialGamma = event.gamma ?? 0;
			isCalibrated = true;
		} else {
			// Calculate relative orientation
			const relativeAlpha = (event.alpha ?? 0) - initialAlpha;
			const relativeBeta = (event.beta ?? 0) - initialBeta;
			const relativeGamma = (event.gamma ?? 0) - initialGamma;

			rotation.x = Math.min(Math.max(relativeGamma / 50, -0.5), 0.5);
			rotation.y = Math.min(Math.max(relativeBeta / 50, -0.5), 0.5);
		}
		useOrientation = true;
	}

	let mouseMoved = -1;

	function onDocumentMouseMove(event: MouseEvent) {
		// convert to [-0.5, 0.5]
		rotation.x = event.clientX / window.innerWidth - 0.5;
		rotation.y = 1 - event.clientY / window.innerHeight - 0.5;

		mouseMoved = 3;
	}

	export let time = 0;
	const { stop, start } = useTask((dt) => {
		if (mouseMoved > 0) {
			mouseMoved -= dt;
		} else {
			time += dt;
			rotation.x = Math.sin(time) * 0.5;
			rotation.y = Math.cos(time) * 0.5;
		}
	});

	$: if (!useOrientation) {
		start();
	} else {
		stop();
	}
</script>

<svelte:window on:deviceorientation={handleOrientation} on:mousemove={onDocumentMouseMove} />

<T.PerspectiveCamera
	makeDefault
	position={[0, 0, 10]}
	on:create={({ ref }) => {
		ref.lookAt(0, 0, 0);
	}}
>
	<OrbitControls enableRotate={false} enablePan={false}></OrbitControls>
</T.PerspectiveCamera>

{#await map then mapValue}
	{#await depthMap then depthValue}
		<Align>
			<T.Mesh
				rotation.x={rotation.y * 0.4}
				rotation.y={rotation.x * 0.4}
				scale.x={mapValue.image.width / mapValue.image.height}
			>
				<T is={geometry} />
				<T
					is={material}
					uniforms={{
						depthMap: { value: depthValue },
						uTexture: { value: mapValue },
						mouse: { value: rotation }
					}}
				/>
			</T.Mesh>
		</Align>
	{/await}
{/await}
