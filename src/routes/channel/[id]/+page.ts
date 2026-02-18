import { error } from '@sveltejs/kit';
import { channelConfigs } from '$lib/stores/channelStore';

export const prerender = 'auto';
export const ssr = false;

export const load = ({ params }: { params: { id: string } }) => {
	const channel = channelConfigs.find(c => c.id === params.id);

	if (!channel) {
		throw error(404, 'Channel not found');
	}

	return {
		channelId: params.id
	};
};

// Optional: Define entries for prerendering known channels
export const entries = () => {
	return channelConfigs.map(c => ({ id: c.id }));
};
