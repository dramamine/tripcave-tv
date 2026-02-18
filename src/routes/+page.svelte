<script lang="ts">
	import { channelConfigs } from '$lib/stores/channelStore';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// Redirect to the first visible channel
		const firstVisibleChannel = channelConfigs.find(c => !c.hidden);
		if (firstVisibleChannel) {
			goto(`/channel/${firstVisibleChannel.id}`, { replaceState: true });
		}
	});
</script>

