<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { useTexture, Align } from '@threlte/extras';

	import { Vector2, ShaderMaterial, PlaneGeometry } from 'three';

	export let image: string;
	export let depth: string;

	const map = useTexture(image);
	const depthMap = useTexture(depth);

	const mouse = new Vector2(0.5, 0.5);

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
    vec3 newPosition = position + vec3(0.0, 0.0, depth * 2.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}`,
		fragmentShader: `
uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
    gl_FragColor = texture2D(uTexture, vUv);
}`
	});

	let h = 1344;
	let w = 896;
	let scl = 0.005;

	const geometry = new PlaneGeometry(w * scl, h * scl, 500, 500);

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

			mouse.x = Math.min(Math.max(relativeGamma / 50, -0.5), 0.5);
			mouse.y = Math.min(Math.max(relativeBeta / 50, -0.5), 0.5);
		}
		useOrientation = true;
	}

	let mouseMoved = -1;

	function onDocumentMouseMove(event: MouseEvent) {
		// convert to [-0.5, 0.5]
		mouse.x = event.clientX / window.innerWidth - 0.5;
		mouse.y = 1 - event.clientY / window.innerHeight - 0.5;

		mouseMoved = 3;
	}

	let time = 0;
	const { stop, start } = useTask((dt) => {
		if (mouseMoved > 0) {
			mouseMoved -= dt;
		} else {
			time += dt;
			mouse.x = Math.sin(time) * 0.5;
			mouse.y = Math.cos(time) * 0.5;
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
></T.PerspectiveCamera>

{#await map then mapValue}
	{#await depthMap then depthValue}
		<Align>
			<T.Mesh rotation.x={mouse.y * 0.4} rotation.y={mouse.x * 0.4}>
				<T is={geometry} />
				<T
					is={material}
					uniforms={{
						depthMap: { value: depthValue },
						uTexture: { value: mapValue },
						mouse: { value: mouse }
					}}
				/>
			</T.Mesh>
		</Align>
	{/await}
{/await}
