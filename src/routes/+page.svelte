<script lang="ts">
	import HydraVisualizer from '$lib/components/HydraVisualizer.svelte';
	import MilkdropVisualizer from '$lib/components/MilkdropVisualizer.svelte';
	import VideoChannel from '$lib/components/VideoChannel.svelte';
	import YoutubeChannel from '$lib/components/YoutubeChannel.svelte';
	import { channelIndex, channelConfigs } from '$lib/stores/channelStore';
	import { getContext, onMount } from 'svelte';

	const toolbarsContext = getContext<{ value: boolean }>('showToolbars');
	let showToolbars = $derived(toolbarsContext?.value ?? true);

	let milkdropRef = $state<any>(null);
	let currentChannel = $state(0);
	let mainWrapper: HTMLElement;
	let showFullscreenHint = $state(false);
	let lastTapTime = 0;

	let currentChannelConfig = $derived(channelConfigs[$channelIndex] || channelConfigs[0]);

	$effect(() => {
		const channel = $channelIndex;
		if (channel !== currentChannel && milkdropRef) {
			if (channel === 1) {
				milkdropRef.resumeAudio();
			} else {
				milkdropRef.pauseAudio();
			}
			currentChannel = channel;
		}
	});

	onMount(() => {
		// Show hint on mobile devices after a short delay
		if ('ontouchstart' in window) {
			setTimeout(() => {
				showFullscreenHint = true;
				setTimeout(() => {
					showFullscreenHint = false;
				}, 4000);
			}, 2000);
		}
	});

	function handleDoubleTap(event: MouseEvent | TouchEvent) {
		const currentTime = new Date().getTime();
		const tapLength = currentTime - lastTapTime;

		// Double-tap detected (within 300ms)
		if (tapLength < 300 && tapLength > 0) {
			event.preventDefault();
			toggleFullscreen();
		}

		lastTapTime = currentTime;
	}

	async function toggleFullscreen() {
		if (!document.fullscreenElement) {
			// Enter fullscreen
			try {
				await mainWrapper.requestFullscreen();
			} catch (err) {
				console.error('Error attempting to enable fullscreen:', err);
			}
		} else {
			// Exit fullscreen
			if (document.exitFullscreen) {
				await document.exitFullscreen();
			}
		}
	}
</script>

<div
	id="mainWrapper"
	bind:this={mainWrapper}
	onclick={handleDoubleTap}
	ontouchend={handleDoubleTap}
	role="presentation"
>
	{#if currentChannelConfig.channelType === 'hydra'}
		<HydraVisualizer />
	{:else if currentChannelConfig.channelType === 'milkdrop'}
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

	{#if showFullscreenHint}
		<div class="fullscreenHint">
			Double-tap for fullscreen
		</div>
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

	.fullscreenHint {
		position: fixed;
		bottom: 80px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 1rem 2rem;
		border-radius: 8px;
		font-size: 1rem;
		z-index: 60;
		animation: fadeInOut 4s ease-in-out;
		pointer-events: none;
	}

	@keyframes fadeInOut {
		0% { opacity: 0; }
		10% { opacity: 1; }
		90% { opacity: 1; }
		100% { opacity: 0; }
	}
</style>
