import { writable, derived } from 'svelte/store';

export const channels = ['Milkdrop Visualizer', 'Neo-MTV'];

const channelIndex = writable(0);

export const currentChannel = derived(channelIndex, ($index) => channels[$index]);

export function nextChannel() {
	channelIndex.update((index) => (index + 1) % channels.length);
}

export function previousChannel() {
	channelIndex.update((index) => (index - 1 + channels.length) % channels.length);
}

export { channelIndex };
