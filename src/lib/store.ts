import { writable, type Writable } from 'svelte/store';

export type DepthImage = {
	image: string;
	depth: string;
};

export const customImages: Writable<DepthImage[]> = writable<DepthImage[]>([]);

const folderPath = '/image2fake3d/images/';

export const presetImages: DepthImage[] = [
	{
		image: folderPath + 'forest.png',
		depth: folderPath + 'forest-depth.png'
	},
	{
		image: folderPath + 'lion.png',
		depth: folderPath + 'lion-depth.png'
	},
	{
		image: folderPath + 'architecture.png',
		depth: folderPath + 'architecture-depth.png'
	},
	{
		image: folderPath + 'soccer.png',
		depth: folderPath + 'soccer-depth.png'
	},
	{
		image: folderPath + 'flowers.png',
		depth: folderPath + 'flowers-depth.png'
	},
	{
		image: folderPath + 'street.png',
		depth: folderPath + 'street-depth.png'
	},
	{
		image: folderPath + 'corals.png',
		depth: folderPath + 'corals-depth.png'
	}
];

export const useCustomImage: Writable<boolean> = writable<boolean>(false);

export const currentImageIndex: Writable<number> = writable<number>(0);

export const showMenu: Writable<boolean> = writable<boolean>(false);
export const isRunning: Writable<boolean> = writable<boolean>(false);
