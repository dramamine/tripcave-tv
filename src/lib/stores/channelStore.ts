import { writable, derived } from 'svelte/store';
import channelsData from '../../../channels.json';

interface ChannelConfig {
	id: string;
	title: string;
	channelType: 'milkdrop' | 'video';
	mediaFolder?: string;
	showYoutubeLinks?: boolean;
	randomOrder?: boolean;
}

const channelsConfig: ChannelConfig[] = channelsData.channels;

export const channels = channelsConfig.map(c => c.title);
export const channelConfigs = channelsConfig;

const channelIndex = writable(0);

export const currentChannel = derived(channelIndex, ($index) => channels[$index]);

export function nextChannel() {
	channelIndex.update((index) => (index + 1) % channels.length);
}

export function previousChannel() {
	channelIndex.update((index) => (index - 1 + channels.length) % channels.length);
}

export { channelIndex };
