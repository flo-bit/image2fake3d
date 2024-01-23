<script lang="ts">
	import { onMount } from 'svelte';
	import { swipe } from 'svelte-gestures';
	import { Canvas } from '@threlte/core';

	import Scene from '$lib/Scene.svelte';
	import Convert from '$lib/Convert.svelte';
	import {
		customImages,
		useCustomImage,
		currentImageIndex,
		presetImages,
		isRunning,
		showMenu
	} from '$lib/store';

	import { Pydnet } from '$lib/model';

	let useMotion = false;
	let isCalibrated = false;

	onMount(async () => {
		// @ts-ignore
		if (typeof DeviceOrientationEvent.requestPermission !== 'function') {
			$isRunning = true;
		}

		if (!('createImageBitmap' in window)) {
			// @ts-ignore
			window.createImageBitmap = async function (data: ImageData) {
				return new Promise((resolve, reject) => {
					let dataURL;
					const canvas = document.createElement('canvas');
					const ctx = canvas.getContext('2d');
					if (!ctx) throw new Error('Context not found');
					canvas.width = data.width;
					canvas.height = data.height;
					ctx.putImageData(data, 0, 0);
					dataURL = canvas.toDataURL();

					const img = document.createElement('img');
					img.addEventListener('load', function () {
						resolve(this);
					});
					img.src = dataURL;
				});
			};
		}

		model = await new Pydnet().init();
	});

	function requestOrientationPermission() {
		// @ts-ignore
		if (typeof DeviceOrientationEvent.requestPermission === 'function') {
			// @ts-ignore
			DeviceOrientationEvent.requestPermission();

			useMotion = true;
		}
	}

	function keyPressed(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			$showMenu = !$showMenu;
			$isRunning = !$isRunning;
		}

		if (event.key === 'ArrowLeft') {
			setImage($currentImageIndex - 1);
		}
		if (event.key === 'ArrowRight') {
			setImage($currentImageIndex + 1);
		}
	}
	function onSwipe(event: CustomEvent) {
		let direction = event.detail.direction;
		if (direction === 'left') {
			setImage($currentImageIndex + 1);
		} else if (direction === 'right') {
			setImage($currentImageIndex - 1);
		}
	}

	function setImage(i: number) {
		if ($useCustomImage) {
			if (i < 0) {
				i = presetImages.length - 1;
				$useCustomImage = false;
			} else if (i >= $customImages.length) {
				i = 0;
				$useCustomImage = false;
			}
		} else {
			if (i < 0) {
				i = $customImages.length - 1;
				if ($customImages.length === 0) {
					i = presetImages.length - 1;
				}
				$useCustomImage = $customImages.length > 0;
			} else if (i >= presetImages.length) {
				i = 0;
				$useCustomImage = $customImages.length > 0;
			}
		}
		$currentImageIndex = i;
		isCalibrated = false;
	}

	let time = 0;
	let model: Pydnet | null = null;

	let imageDropperText = 'No file added';

	async function runInference(file: File) {
		imageDropperText = 'Processing file...';
		var fr = new FileReader();
		fr.onload = function () {
			console.log('onload filereader');
			var img = new Image();
			img.onload = function () {
				console.log('onload image');
				display_result(img);
			};
			if (fr.result === null || typeof fr.result !== 'string') throw new Error('Result not found');
			img.src = fr.result;
		};

		fr.readAsDataURL(file);
	}

	async function display_result(img: HTMLImageElement, tries = 0) {
		if (!model) {
			if (tries > 10) {
				alert('This sadly doesnt work on your device :(');
				return;
			}
			setTimeout(() => {
				display_result(img, tries + 1);
			}, 500);
			return;
		}
		console.log('before predict');
		var results = await model.predict(img);
		console.log('after predict');

		let canvas = document.createElement('canvas');
		let ctx = canvas.getContext('2d');
		canvas.width = img.width;
		canvas.height = img.height;

		let inputCanvas = document.createElement('canvas');
		let inputCtx = inputCanvas.getContext('2d');
		inputCanvas.width = img.width;
		inputCanvas.height = img.height;
		if (inputCtx) inputCtx.drawImage(img, 0, 0);

		let buffer = new Uint8ClampedArray(model.width * model.height * 4);
		let i = 0;
		for (let y = 0; y < model.height; y++) {
			for (let x = 0; x < model.width; x++) {
				let index = y * model.width + x;
				let depth = results[0][index];
				buffer[i] = depth;
				buffer[i + 1] = depth;
				buffer[i + 2] = depth;
				buffer[i + 3] = 255.0;
				i += 4;
			}
		}

		const imageData = new ImageData(buffer, model.width, model.height);
		const renderer = await createImageBitmap(imageData);
		if (!ctx) throw new Error('Context not found');
		ctx.drawImage(renderer, 0, 0, img.width, img.height);

		setTimeout(function () {
			$isRunning = true;
			$showMenu = false;

			$customImages = [
				...$customImages,
				{
					image: inputCanvas.toDataURL(),
					depth: canvas.toDataURL()
				}
			];
			$currentImageIndex = $customImages.length - 1;

			$useCustomImage = true;
		}, 350);
	}
</script>

<svelte:window on:keyup={keyPressed} />
<div class="fixed inset-0 flex justify-center items-center text-neutral-200 -z-10">Loading...</div>

<div
	class="w-screen h-screen"
	use:swipe={{ timeframe: 300, minSwipeDistance: 100, touchAction: 'pan-x' }}
	on:swipe={onSwipe}
>
	{#if !$isRunning}
		<div class="fixed z-10 w-screen h-screen bg-black/70 backdrop-blur-sm">
			<div class="flex items-center justify-center h-screen">
				{#if !$showMenu}
					<button
						class="bg-white/5 hover:bg-white/10 border text-xl font-semibold border-white/10 text-white py-3 px-5 rounded-md m-4"
						on:click={() => {
							requestOrientationPermission();
							$isRunning = true;
						}}
					>
						start
					</button>
				{:else}
					<div class="overflow-scroll h-screen">
						<div class="grid grid-cols-2 md:grid-cols-3 max-w-3xl p-4">
							<div class="p-4 col-span-full">
								<Convert selectedFile={runInference} text={imageDropperText} />
							</div>

							{#each $customImages as image, i}
								<button
									on:click={() => {
										$currentImageIndex = i;
										$showMenu = false;
										$isRunning = true;
										$useCustomImage = true;
									}}
									class="hover:opacity-80"
								>
									<img src={image.image} alt="hello" class="aspect-square w-full object-cover" />
								</button>
							{/each}
							{#each presetImages as image, i}
								<button
									on:click={() => {
										$currentImageIndex = i;
										$showMenu = false;
										$isRunning = true;
										$useCustomImage = false;
									}}
									class="hover:opacity-80"
								>
									<img src={image.image} alt="hello" class="aspect-square w-full object-cover" />
								</button>
							{/each}
						</div>
						<div class="h-20"></div>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="fixed bottom-0 text-neutral-200 w-full flex justify-center text-xs">
			<div class="px-3 py-1.5 bg-black/50 font-semibold rounded-t-md text-center">
				{useMotion ? 'tilt phone' : 'move mouse'} to see effect <br />
				{useMotion ? 'swipe' : 'arrow keys'} to change image
			</div>
		</div>
		<div class="fixed bottom-0 text-neutral-200 font-semibold w-full flex justify-between text-xs">
			{#if useMotion}
				<button
					on:click={() => {
						isCalibrated = false;
					}}
					class="px-3 py-1.5 bg-black/50 rounded-tr-md hover:bg-black/90 hover:text-neutral-400"
					>Reset</button
				>
			{:else}
				<div></div>
			{/if}

			<button
				on:click={() => {
					$showMenu = true;
					$isRunning = false;
				}}
				class="px-3 py-1.5 bg-black/50 rounded-tl-md hover:bg-black/90 hover:text-neutral-400"
				>Change</button
			>
		</div>

		<div class="fixed top-2 right-2 text-neutral-600 hover:text-neutral-400">
			<a href="https://github.com/flo-bit/image2fake3d" target="_blank"
				><svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" class="w-6 h-6">
					<path
						fill-rule="evenodd"
						d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
						clip-rule="evenodd"
					/>
				</svg></a
			>
		</div>
	{/if}

	<div class="z-10 w-full h-full">
		<Canvas>
			{#key $currentImageIndex.toString() + $useCustomImage.toString()}
				<Scene
					bind:time
					bind:isCalibrated
					image={$useCustomImage
						? $customImages[$currentImageIndex]
						: presetImages[$currentImageIndex]}
				/>
			{/key}
		</Canvas>
	</div>
</div>
