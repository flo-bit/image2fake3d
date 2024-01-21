<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Scene from './Scene.svelte';
	import { swipe } from 'svelte-gestures';

	let depth = [
		'forest-depth.png',
		'city-depth.png',
		'flowers-depth.png',
		'corals-depth.png',
		'street-depth.png',
		'architecture-depth.png',
		'soccer-depth.png',
		'lion-depth.png'
	];
	let images = [
		'forest.png',
		'city.png',
		'flowers.png',
		'corals.png',
		'street.png',
		'architecture.png',
		'soccer.png',
		'lion.png'
	];

	let useMotion = false;

	function requestOrientationPermission() {
		// @ts-ignore
		if (typeof DeviceOrientationEvent.requestPermission === 'function') {
			// @ts-ignore
			DeviceOrientationEvent.requestPermission();

			useMotion = true;
		}
	}

	let isRunning = false;

	let isCalibrated = false;

	let showMenu = false;

	let currentImage: number = 0;

	function keyPressed(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			showMenu = !showMenu;
			isRunning = !isRunning;
		}

		if (event.key === 'ArrowLeft') {
			setImage(currentImage - 1 + images.length);
		}
		if (event.key === 'ArrowRight') {
			setImage(currentImage + 1);
		}
	}

	function setImage(i: number) {
		currentImage = i % images.length;
		isCalibrated = false;
	}

	function onSwipe(event: CustomEvent) {
		let direction = event.detail.direction;
		if (direction === 'left') {
			setImage(currentImage - 1 + images.length);
		}
		if (direction === 'right') {
			setImage(currentImage + 1);
		}
	}
</script>

<svelte:window on:keyup={keyPressed} />

<div
	class="w-screen h-screen"
	use:swipe={{ timeframe: 300, minSwipeDistance: 100, touchAction: 'pan-x' }}
	on:swipe={onSwipe}
>
	{#if !isRunning}
		<div class="fixed z-10 w-screen h-screen bg-black/70 backdrop-blur-sm">
			<div class="flex items-center justify-center h-screen">
				{#if !showMenu}
					<button
						class="bg-white/5 hover:bg-white/10 border text-xl font-semibold border-white/10 text-white py-3 px-5 rounded-md m-4"
						on:click={() => {
							requestOrientationPermission();
							isRunning = true;
						}}
					>
						start
					</button>
				{:else}
					<div class="overflow-scroll h-screen">
						<div class="grid grid-cols-2 md:grid-cols-3 max-w-3xl">
							{#each images as image, i}
								<button
									on:click={() => {
										currentImage = i;
										showMenu = false;
										isRunning = true;
									}}
									class="hover:opacity-80"
								>
									<img
										src={'/images/' + image}
										alt="hello"
										class="aspect-square w-full object-cover"
									/>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="fixed bottom-0 text-white w-full flex justify-center text-xs">
			<div class="px-3 py-1.5 bg-black/50 rounded-t-md">
				{useMotion ? 'tilt phone' : 'move mouse'} to see effect
			</div>
		</div>
		<div class="fixed bottom-0 text-white w-full flex justify-between text-xs">
			{#if useMotion}
				<button
					on:click={() => {
						isCalibrated = false;
					}}
					class="px-3 py-1.5 bg-black/50 rounded-tr-md hover:bg-black/90">Reset</button
				>
			{:else}
				<div></div>
			{/if}

			<button
				on:click={() => {
					showMenu = true;
					isRunning = false;
				}}
				class="px-3 py-1.5 bg-black/50 rounded-tl-md hover:bg-black/90">Change</button
			>
		</div>
	{/if}

	<Canvas>
		{#key currentImage}
			<Scene
				bind:isCalibrated
				image={'/image2fake3d/images/' + images[currentImage]}
				depth={'/image2fake3d/images/' + depth[currentImage]}
			/>
		{/key}
	</Canvas>
</div>
