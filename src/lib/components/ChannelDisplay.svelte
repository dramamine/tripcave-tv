<script lang="ts">
	import HydraVisualizer from './HydraVisualizer.svelte';
	import MilkdropVisualizer from './MilkdropVisualizer.svelte';
	import VideoChannel from './VideoChannel.svelte';
	import YoutubeChannel from './YoutubeChannel.svelte';
	import { currentChannelId, currentChannelConfig, previousChannel, nextChannel } from '$lib/stores/channelStore';
	import { getContext, onMount } from 'svelte';

	const toolbarsContext = getContext<{ value: boolean; show: () => void }>('showToolbars');
	let showToolbars = $derived(toolbarsContext?.value ?? true);

	let milkdropRef = $state<any>(null);
	let videoChannelRef = $state<any>(null);
	let prevChannelId = $state('');
	let mainWrapper: HTMLElement;
	let showFullscreenHint = $state(false);
	let lastTapTime = 0;

	// Get the active media channel reference based on channel type
	let activeMediaRef = $derived(
		$currentChannelConfig.channelType === 'video' ? videoChannelRef :
		$currentChannelConfig.channelType === 'milkdrop' ? milkdropRef :
		null
	);

	function handleKeydown(event: KeyboardEvent) {
		// Ignore if user is typing in an input field
		const target = event.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
			return;
		}

		// Show toolbar on any keyboard shortcut
		toolbarsContext?.show();

		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				previousChannel();
				break;
			case 'ArrowRight':
				event.preventDefault();
				nextChannel();
				break;
			case 'ArrowUp':
				event.preventDefault();
				activeMediaRef?.next();
				break;
			case 'ArrowDown':
				event.preventDefault();
				activeMediaRef?.previous();
				break;
			case ' ':
				event.preventDefault();
				activeMediaRef?.togglePlayPause();
				break;
		}
	}

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

	// Handle channel changes for milkdrop audio
	$effect(() => {
		const channelId = $currentChannelId;
		const config = $currentChannelConfig;

		if (channelId !== prevChannelId && milkdropRef) {
			if (config.channelType === 'milkdrop') {
				milkdropRef.resumeAudio();
			} else {
				milkdropRef.pauseAudio();
			}
			prevChannelId = channelId;
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

<svelte:window onkeydown={handleKeydown} />

<div
	id="mainWrapper"
	bind:this={mainWrapper}
	onclick={handleDoubleTap}
	ontouchend={handleDoubleTap}
	role="presentation"
>
	{#if $currentChannelConfig.channelType === 'hydra'}
		<HydraVisualizer />
	{:else if $currentChannelConfig.channelType === 'milkdrop'}
		<MilkdropVisualizer bind:this={milkdropRef} />
	{:else if $currentChannelConfig.channelType === 'video' && $currentChannelConfig.mediaFolder}
		<VideoChannel
			bind:this={videoChannelRef}
			mediaFolder={$currentChannelConfig.mediaFolder}
			showYoutubeLinks={$currentChannelConfig.showYoutubeLinks ?? true}
			randomOrder={$currentChannelConfig.randomOrder ?? true}
			useHls={$currentChannelConfig.hls}
		/>
	{:else if $currentChannelConfig.channelType === 'youtube' && $currentChannelConfig.playlistId}
		<YoutubeChannel playlistId={$currentChannelConfig.playlistId} />
	{/if}

	{#if showFullscreenHint}
		<div class="fullscreenHint">
			Double-tap for fullscreen
		</div>
	{/if}
</div>

<style>
	#mainWrapper {
		position: relative;
		width: 100%;
		height: 100vh;
		overflow: hidden;
	}

	.fullscreenHint {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 1rem 2rem;
		border-radius: 0.5rem;
		font-size: 1.25rem;
		pointer-events: none;
		z-index: 1000;
		animation: fadeInOut 4s ease-in-out;
	}

	@keyframes fadeInOut {
		0% {
			opacity: 0;
		}
		10% {
			opacity: 1;
		}
		90% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
</style>
