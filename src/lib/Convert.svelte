<script lang="ts">
	let isDragging = false;

	let input: HTMLInputElement;

	let files: FileList;
	let data: HTMLLabelElement;

	$: if (files) {
		const file = files?.[0];

		if (file) {
			selectedFile(file);
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

	export let selectedFile = (file: File) => {};

	export let text = 'No file added';
</script>

<div>
	<label
		for={data?.innerText.toLowerCase()}
		bind:this={data}
		class="block text-lg my-2 font-medium leading-6 text-white"
		><slot>Try it with your image</slot></label
	>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="flex flex-col">
		<button
			type="button"
			class="mt-2 flex flex-col justify-center items-center rounded-lg border border-dashed border-neutral-100/25 px-1 py-10 relative overflow-hidden h-40 w-full hover:bg-white/5  {isDragging
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
				<p class="text-sm leading-6 text-neutral-300">{text}</p>
			
		</button>
		<div class="text-center">
			<div class="mt-2 text-sm flex leading-6 text-neutral-300 dark:text-neutral-300 justify-center">
				<label
					for={data?.innerText.toLowerCase()}
					class="relative cursor-pointer rounded-md font-semibold text-neutral-200 dark:text-neutral-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-accent-600 focus-within:ring-offset-2 hover:text-accent-500 dark:hover:text-accent-400"
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

				<p class="ml-1">or drag and drop</p>
			</div>
			<p class="pt-2 text-xs text-neutral-200">Your image stays on your device<br>On device depth estimation is currently broken for some images on iOS</p>
		</div>
	</div>
</div>
