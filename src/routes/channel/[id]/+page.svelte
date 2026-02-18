<script lang="ts">
	import HydraVisualizer from '$lib/components/HydraVisualizer.svelte';
	import MilkdropVisualizer from '$lib/components/MilkdropVisualizer.svelte';
	import VideoChannel from '$lib/components/VideoChannel.svelte';
	import YoutubeChannel from '$lib/components/YoutubeChannel.svelte';
	import { currentChannelId, currentChannelConfig, setChannelById } from '$lib/stores/channelStore';
	import { getContext, onMount } from 'svelte';

	interface PageData {
		channelId: string;
	}

	let { data }: { data: PageData } = $props();

	const toolbarsContext = getContext<{ value: boolean }>('showToolbars');
	let showToolbars = $derived(toolbarsContext?.value ?? true);

	let milkdropRef = $state<any>(null);
	let prevChannelId = $state('');
	let mainWrapper: HTMLElement;
	let showFullscreenHint = $state(false);
	let lastTapTime = 0;

	// Initialize channel from URL parameter
	onMount(() => {
		if (data.channelId && data.channelId !== $currentChannelId) {
			setChannelById(data.channelId);
		}

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
			mediaFolder={$currentChannelConfig.mediaFolder}
			showYoutubeLinks={$currentChannelConfig.showYoutubeLinks ?? true}
			randomOrder={$currentChannelConfig.randomOrder ?? true}
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
