<script lang="ts">
	import { onMount } from "svelte";
	import { Pydnet } from "./model";
	import { currentImageIndex, customImages, isRunning, showMenu, useCustomImage } from "$lib/store";

	let isDragging = false;

	let input: HTMLInputElement;

	let files: FileList;
	let data: HTMLLabelElement;

	$: if (files) {
		const file = files?.[0];

		if (file) {
			runInference(file);
		}
	}

	function handleDragOver() {
		isDragging = true;
	}
	function handleDragOverEnd() {
		isDragging = false;
	}
	function handleDrop(event: DragEvent) {
		isDragging = false;

		if (event.dataTransfer && event.dataTransfer.files) {
			const droppedFiles = Array.from(event.dataTransfer.files);
			if (droppedFiles.length > 0) {
				// turn into urls
				files = event.dataTransfer.files;
			}
		}
	}

	let model: Pydnet | null = null;

	onMount(async () => {
		if (!('createImageBitmap' in window)) {
			// @ts-ignore
			window.createImageBitmap = async function (data: ImageData) {
				return new Promise((resolve, reject) => {
					let dataURL;
					const canvas = document.createElement('canvas');
					const ctx = canvas.getContext('2d');
					if(!ctx) throw new Error('Context not found');
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

	async function runInference(file: File) {
		var fr = new FileReader();
		fr.onload = function () {
			var img = new Image();
			img.onload = function () {
				display_result(img);
			};
			if(fr.result === null || typeof fr.result !== 'string') throw new Error('Result not found');
			img.src = fr.result;
		};

		fr.readAsDataURL(file);
	}

	async function display_result(img: HTMLImageElement) {
		if(!model) throw new Error('Model not loaded');
		var results = await model.predict(img);

		let canvas = document.createElement('canvas');
		let ctx = canvas.getContext('2d');
		canvas.width = img.width;
		canvas.height = img.height;

		let inputCanvas = document.createElement('canvas');
		let inputCtx = inputCanvas.getContext('2d');
		inputCanvas.width = img.width;
		inputCanvas.height = img.height;
		if(inputCtx) inputCtx.drawImage(img, 0, 0);

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
		if(!ctx) throw new Error('Context not found');
		ctx.drawImage(renderer, 0, 0, img.width, img.height);

		setTimeout(function () {
			$isRunning = true;
			$showMenu = false;

			$customImages = [
				...$customImages,
				{
					image: inputCanvas.toDataURL(),
					depth: canvas.toDataURL(),
				}
			];
			$currentImageIndex = $customImages.length - 1;

			$useCustomImage = true;
		}, 350);
	}
</script>

<div>
	<label
		for={data?.innerText.toLowerCase()}
		bind:this={data}
		class="block text-lg my-2 font-medium leading-6 text-neutral-900 dark:text-white"
		><slot>Try it with your image</slot></label
	>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="flex flex-col">
		<button
			type="button"
			class="mt-2 flex flex-col justify-center items-center rounded-lg border border-dashed border-neutral-900/25 dark:border-neutral-100/25 px-1 py-10 relative overflow-hidden h-40 w-full hover:bg-black/5 dark:hover:bg-white/5 {isDragging
				? 'bg-black/5 dark:bg-white/5'
				: ''}"
			on:dragover|preventDefault={handleDragOver}
			on:drop|preventDefault={handleDrop}
			on:dragleave|preventDefault={handleDragOverEnd}
			on:dragend|preventDefault={handleDragOverEnd}
			on:click={() => input.click()}
		>
				<svg
					class="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-400"
					viewBox="0 0 24 24"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						fill-rule="evenodd"
						d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
						clip-rule="evenodd"
					/>
				</svg>
				<p class="text-sm leading-6 text-neutral-300 dark:text-neutral-400">No file added</p>
			
		</button>
		<div class="text-center">
			<div class="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
				<label
					for={data?.innerText.toLowerCase()}
					class="relative cursor-pointer rounded-md font-semibold text-accent-600 dark:text-accent-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-accent-600 focus-within:ring-offset-2 hover:text-accent-500 dark:hover:text-accent-400"
				>
					<button type="button" on:click={() => input.click()}>Browse files</button>

					<input
						id={data?.innerText.toLowerCase()}
						bind:this={input}
						name={data?.innerText.toLowerCase()}
						type="file"
						accept="image/png, image/jpeg, image/webp"
						class="sr-only"
						bind:files
					/>
				</label>

				<p class="">or drag and drop</p>
				<p class="pt-2 text-xs">Your image stays on your device</p>
			</div>
		</div>
	</div>
</div>
