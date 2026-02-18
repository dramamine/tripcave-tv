import { writable, derived, get } from 'svelte/store';
import channelsData from '../../../channels.json';
import { browser } from '$app/environment';

interface ChannelConfig {
	id: string;
	title: string;
	channelType: 'hydra' | 'milkdrop' | 'video' | 'youtube';
	mediaFolder?: string;
	showYoutubeLinks?: boolean;
	randomOrder?: boolean;
	playlistId?: string;
	hidden?: boolean;
}

const channelsConfig = channelsData.channels as unknown as ChannelConfig[];

export const siteName = channelsData.siteName;
export const channelConfigs = channelsConfig;

// Check if a hidden channel ID is in the current URL
function isHiddenChannelInUrl(): string | null {
	if (!browser) return null;
	const match = window.location.pathname.match(/\/channel\/([^/]+)/);
	if (match) {
		const channelId = match[1];
		const config = channelsConfig.find(c => c.id === channelId);
		if (config?.hidden) {
			return channelId;
		}
	}
	return null;
}

// Filter channels: include visible channels + hidden channel if it's in the URL
const hiddenChannelInUrl = isHiddenChannelInUrl();
const visibleChannels = channelsConfig.filter(c => !c.hidden || c.id === hiddenChannelInUrl);

export const channels = visibleChannels.map(c => c.title);

// Store the current channel ID (not index)
const currentChannelId = writable<string>(channelsConfig[0]?.id || '');

export const currentChannel = derived(currentChannelId, ($id) => {
	const config = channelsConfig.find(c => c.id === $id);
	return config?.title || '';
});

export const currentChannelConfig = derived(currentChannelId, ($id) => {
	return channelsConfig.find(c => c.id === $id) || channelsConfig[0];
});

// Set channel by ID (allows hidden channels if navigated directly via URL)
export function setChannelById(id: string) {
	const config = channelsConfig.find(c => c.id === id);
	if (config) {
		currentChannelId.set(id);
	}
}

// Get the index of current channel in visible channels
function getCurrentIndex(): number {
	const id = get(currentChannelId);
	return visibleChannels.findIndex(c => c.id === id);
}

export function nextChannel() {
	const currentIndex = getCurrentIndex();
	const nextIndex = (currentIndex + 1) % visibleChannels.length;
	setChannelById(visibleChannels[nextIndex].id);
}

export function previousChannel() {
	const currentIndex = getCurrentIndex();
	const prevIndex = (currentIndex - 1 + visibleChannels.length) % visibleChannels.length;
	setChannelById(visibleChannels[prevIndex].id);
}

export { currentChannelId };
