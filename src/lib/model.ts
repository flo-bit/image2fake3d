import * as tf from '@tensorflow/tfjs';

export class Pydnet {
	model: tf.GraphModel<string | tf.io.IOHandler> | null;
	height: number;
	width: number;

	constructor() {
		this.model = null;
		this.height = 0;
		this.width = 0;
	}

	async init() {
		const MODEL =
			'https://raw.githubusercontent.com/FilippoAleotti/demo_live/master/assets/js/pydnet.json';
		this.model = await tf.loadGraphModel(MODEL);
		this.height = 384;
		this.width = 640;
		return this;
	}

	async predict(
		img:
			| HTMLCanvasElement
			| HTMLImageElement
			| ImageData
			| HTMLVideoElement
			| ImageBitmap
			| tf.PixelData
	) {
		const [data, resizeInputData] = tf.tidy(() => {
			if (!this.model) throw new Error('Model not loaded');

			const raw_input = tf.browser.fromPixels(img);
			let upsampledraw_input = tf.image.resizeBilinear(raw_input, [this.height, this.width]);
			let preprocessedInput = upsampledraw_input.expandDims();
			preprocessedInput = tf.div(preprocessedInput, 255.0);
			let result = this.model.predict(preprocessedInput);
			result = this.prepareOutput(result);
			upsampledraw_input = tf.cast(upsampledraw_input, 'int32');
			// @ts-expect-error - dont know
			const data = result.dataSync();
			const resizeInputData = upsampledraw_input.dataSync();
			return [data, resizeInputData];
		});
		await tf.nextFrame();
		return [data, resizeInputData];
	}

	// @ts-expect-error - dont know
	prepareOutput(tensor) {
		return tf.tidy(() => {
			tensor = tf.relu(tensor);
			tensor = tf.squeeze(tensor);
			const min_value = tf.min(tensor);
			const max_value = tf.max(tensor);
			tensor = tf.div(tf.sub(tensor, min_value), tf.sub(max_value, min_value));
			tensor = tf.mul(tensor, 255.0);
			tensor = tf.cast(tensor, 'int32');
			return tensor;
		});
	}
}
