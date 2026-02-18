<script lang="ts">
	import ChannelDisplay from '$lib/components/ChannelDisplay.svelte';
	import { setChannelById, channelConfigs } from '$lib/stores/channelStore';
	import { onMount } from 'svelte';

	// Initialize channel from URL parameter if present
	onMount(() => {
		// Check if URL has a channel ID in the path
		const match = window.location.pathname.match(/\/channel\/([^/]+)/);
		if (match) {
			const channelId = match[1];
			const config = channelConfigs.find(c => c.id === channelId);
			if (config) {
				setChannelById(channelId);
			}
		}
	});
</script>

<ChannelDisplay />

