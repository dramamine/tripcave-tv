<script lang="ts">
	import MilkdropVisualizer from '$lib/components/MilkdropVisualizer.svelte';
	import VideoChannel from '$lib/components/VideoChannel.svelte';
	import YoutubeChannel from '$lib/components/YoutubeChannel.svelte';
	import { channelIndex, channelConfigs } from '$lib/stores/channelStore';
	import { getContext } from 'svelte';

	const toolbarsContext = getContext<{ value: boolean }>('showToolbars');
	let showToolbars = $derived(toolbarsContext?.value ?? true);

	let milkdropRef = $state<any>(null);
	let currentChannel = $state(0);

	let currentChannelConfig = $derived(channelConfigs[$channelIndex] || channelConfigs[0]);

	$effect(() => {
		const channel = $channelIndex;
		if (channel !== currentChannel && milkdropRef) {
			if (channel === 0) {
				milkdropRef.resumeAudio();
			} else {
				milkdropRef.pauseAudio();
			}
			currentChannel = channel;
		}
	});
</script>

<div id="mainWrapper">
	{#if currentChannelConfig.channelType === 'milkdrop'}
		<MilkdropVisualizer bind:this={milkdropRef} />
	{:else if currentChannelConfig.channelType === 'video' && currentChannelConfig.mediaFolder}
		<VideoChannel
			mediaFolder={currentChannelConfig.mediaFolder}
			showYoutubeLinks={currentChannelConfig.showYoutubeLinks ?? true}
			randomOrder={currentChannelConfig.randomOrder ?? true}
		/>
	{:else if currentChannelConfig.channelType === 'youtube' && currentChannelConfig.playlistId}
		<YoutubeChannel playlistId={currentChannelConfig.playlistId} />
	{/if}
</div>

<style>
	#mainWrapper {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
	}
</style>
