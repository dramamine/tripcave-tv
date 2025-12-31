<script lang="ts">
	import { onMount } from 'svelte';

	interface VideoChannelProps {
		mediaFolder: string;
		showYoutubeLinks: boolean;
		randomOrder: boolean;
	}

	let { mediaFolder, showYoutubeLinks, randomOrder }: VideoChannelProps = $props();

	let videoElement = $state<HTMLVideoElement | undefined>(undefined);
	let playlist = $state<string[]>([]);
	let currentVideoIndex = $state(0);
	let isPlaying = $state(false);
	let showControls = $state(true);
	let controlsTimeout: number | null = null;

	let currentVideoSrc = $derived(playlist.length > 0
		? `/api/media/${mediaFolder}/${encodeURIComponent(playlist[currentVideoIndex])}`
		: '');

	function extractYouTubeId(filename: string): string | null {
		const match = filename.match(/\[([^\]]+)\]\.\w+$/);
		return match ? match[1] : null;
	}

	function extractDisplayName(filename: string): string {
		// Try to extract name before [{id}].extension
		const matchWithId = filename.match(/^(.+?)\s+\[.+\]\.\w+$/);
		if (matchWithId) {
			return matchWithId[1];
		}
		// Otherwise just remove extension
		const matchNoId = filename.match(/^(.+)\.\w+$/);
		return matchNoId ? matchNoId[1] : filename;
	}

	let youtubeUrl = $derived.by(() => {
		if (!showYoutubeLinks || playlist.length === 0) return null;
		const id = extractYouTubeId(playlist[currentVideoIndex]);
		return id ? `https://www.youtube.com/watch?v=${id}` : null;
	});

	let videoDisplayName = $derived.by(() => {
		if (playlist.length === 0) return '';
		return extractDisplayName(playlist[currentVideoIndex]);
	});

	async function loadPlaylist() {
		try {
			const url = `/api/media?folder=${encodeURIComponent(mediaFolder)}${randomOrder ? '' : '&randomize=false'}`;
			const response = await fetch(url);
			playlist = await response.json();
			if (playlist.length > 0) {
				currentVideoIndex = 0;
			}
		} catch (error) {
			console.error(`Error loading ${mediaFolder} playlist:`, error);
		}
	}

	function nextVideo() {
		if (playlist.length > 0) {
			currentVideoIndex = (currentVideoIndex + 1) % playlist.length;
		}
	}

	function previousVideo() {
		if (playlist.length > 0) {
			currentVideoIndex = (currentVideoIndex - 1 + playlist.length) % playlist.length;
		}
	}

	$effect(() => {
		if (videoElement && currentVideoSrc) {
			videoElement.load();
			videoElement.play().catch(err => {
				console.error('Error playing video:', err);
				// Auto-skip broken videos
				setTimeout(() => {
					nextVideo();
				}, 2000);
			});
		}
	});

	function togglePlayPause() {
		if (videoElement) {
			if (videoElement.paused) {
				videoElement.play();
			} else {
				videoElement.pause();
			}
		}
	}

	function handleVideoEnded() {
		// Auto-play next video
		nextVideo();
	}

	function handlePlay() {
		isPlaying = true;
	}

	function handlePause() {
		isPlaying = false;
	}

	function handleMouseMove() {
		showControls = true;
		if (controlsTimeout) {
			clearTimeout(controlsTimeout);
		}
		controlsTimeout = setTimeout(() => {
			showControls = false;
		}, 3000) as unknown as number;
	}

	function handleMouseLeave() {
		if (controlsTimeout) {
			clearTimeout(controlsTimeout);
		}
		controlsTimeout = setTimeout(() => {
			showControls = false;
		}, 1000) as unknown as number;
	}

	$effect(() => {
		// Reload playlist when mediaFolder changes
		loadPlaylist();
	});

	onMount(() => {
		handleMouseMove();

		return () => {
			if (controlsTimeout) clearTimeout(controlsTimeout);
		};
	});
</script>

<div
	class="videoChannelContainer"
	role="region"
	aria-label="Video player"
	onmousemove={handleMouseMove}
	onmouseleave={handleMouseLeave}
>
	{#if currentVideoSrc}
		<video
			bind:this={videoElement}
			src={currentVideoSrc}
			autoplay
			onended={handleVideoEnded}
			onplay={handlePlay}
			onpause={handlePause}
			onerror={() => {
				console.error('Video element error, skipping to next');
				setTimeout(() => nextVideo(), 2000);
			}}
		>
			<track kind="captions" />
			Your browser does not support the video tag.
		</video>

		<div class="customControls" class:visible={showControls}>
			<button class="controlBtn" onclick={previousVideo} aria-label="Previous video">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M19 20L9 12l10-8v16z" />
					<path d="M5 19V5" />
				</svg>
			</button>

			<button class="controlBtn playPause" onclick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
				{#if isPlaying}
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="6" y="4" width="4" height="16" />
						<rect x="14" y="4" width="4" height="16" />
					</svg>
				{:else}
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M5 3l14 9-14 9V3z" />
					</svg>
				{/if}
			</button>

			<button class="controlBtn" onclick={nextVideo} aria-label="Next video">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M5 4l10 8-10 8V4z" />
					<path d="M19 5v14" />
				</svg>
			</button>
		</div>

		{#if youtubeUrl}
			<a href={youtubeUrl} target="_blank" rel="noopener noreferrer" class="youtubeLink" class:visible={showControls} aria-label="Watch on YouTube">
				<img src="/youtube.svg" alt="YouTube" width="24" height="24" />
			</a>
		{/if}

		<div class="videoTitle" class:visible={showControls}>
			{videoDisplayName}
		</div>
	{/if}
</div>

<style>
	.videoChannelContainer {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: black;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: none;
	}

	.videoChannelContainer:hover {
		cursor: default;
	}

	video {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.customControls {
		position: fixed;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 1rem;
		background: rgba(0, 0, 0, 0.7);
		padding: 1rem 2rem;
		border-radius: 40px;
		backdrop-filter: blur(10px);
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.3s ease;
		z-index: 100;
	}

	.customControls.visible {
		opacity: 1;
		pointer-events: auto;
	}

	.controlBtn {
		background: transparent;
		border: none;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		transition: transform 0.2s ease, opacity 0.2s ease;
	}

	.controlBtn:hover {
		transform: scale(1.1);
		opacity: 0.8;
	}

	.controlBtn.playPause {
		padding: 0.5rem 1rem;
	}

	.controlBtn svg {
		fill: white;
	}

	.youtubeLink {
		position: fixed;
		bottom: 20px;
		right: 20px;
		background: rgba(0, 0, 0, 0.7);
		padding: 1rem;
		border-radius: 50px;
		backdrop-filter: blur(10px);
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.3s ease, transform 0.2s ease;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.youtubeLink.visible {
		opacity: 1;
		pointer-events: auto;
	}

	.youtubeLink:hover {
		transform: scale(1.1);
	}

	.youtubeLink img {
		filter: brightness(0) invert(1);
		transition: opacity 0.2s ease;
	}

	.youtubeLink:hover img {
		opacity: 0.8;
	}

	.videoTitle {
		position: fixed;
		top: 80px;
		left: 50%;
		transform: translateX(-50%);
		color: white;
		background: rgba(0, 0, 0, 0.7);
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		backdrop-filter: blur(10px);
		font-size: 1rem;
		max-width: 80%;
		text-align: center;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.3s ease;
		z-index: 100;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.videoTitle.visible {
		opacity: 1;
	}
</style>
