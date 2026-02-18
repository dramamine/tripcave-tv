<script lang="ts">
	import ChannelDisplay from '$lib/components/ChannelDisplay.svelte';
	import { currentChannelId, setChannelById } from '$lib/stores/channelStore';
	import { onMount } from 'svelte';

	interface PageData {
		channelId: string;
	}

	let { data }: { data: PageData } = $props();

	// Initialize channel from URL parameter
	onMount(() => {
		if (data.channelId && data.channelId !== $currentChannelId) {
			setChannelById(data.channelId);
		}
	});
</script>

<ChannelDisplay />
