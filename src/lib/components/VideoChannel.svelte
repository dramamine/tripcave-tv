<script lang="ts">
	import { onMount } from 'svelte';
	import { shuffle } from '$lib/utils/shuffle';
	import Hls from 'hls.js';

	interface VideoChannelProps {
		mediaFolder: string;
		showYoutubeLinks: boolean;
		randomOrder: boolean;
		useHls?: boolean;
	}

	interface MediaItem {
		file: string;
		hls?: string;
	}

	let { mediaFolder, showYoutubeLinks, randomOrder, useHls = true }: VideoChannelProps = $props();

	let videoElement = $state<HTMLVideoElement | undefined>(undefined);
	let playlist = $state<MediaItem[]>([]);
	let currentVideoIndex = $state(0);
	let isPlaying = $state(false);
	let showControls = $state(true);
	let controlsTimeout: number | null = null;
	let hls: Hls | null = null;

	let currentVideoItem = $derived(playlist.length > 0 ? playlist[currentVideoIndex] : null);

	let currentVideoSrc = $derived(
		currentVideoItem
			? currentVideoItem.hls && useHls !== false
				? `/media/${mediaFolder}/${currentVideoItem.hls}`
				: `/media/${mediaFolder}/${encodeURIComponent(currentVideoItem.file)}`
			: ''
	);

	let isHlsVideo = $derived(currentVideoItem?.hls !== undefined && useHls !== false);

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
		const id = extractYouTubeId(currentVideoItem?.file || '');
		return id ? `https://www.youtube.com/watch?v=${id}` : null;
	});

	let videoDisplayName = $derived.by(() => {
		if (playlist.length === 0) return '';
		return extractDisplayName(currentVideoItem?.file || '');
	});

	async function loadPlaylist() {
		try {
			const response = await fetch(`/media-index/${mediaFolder}.json`);
			let files = await response.json();

			// Apply randomization if enabled
			if (randomOrder) {
				files = shuffle(files);
			}

			playlist = files;
			if (playlist.length > 0) {
				currentVideoIndex = 0;
			}
		} catch (error) {
			console.error(`Error loading ${mediaFolder} playlist:`, error);
		}
	}

	export function next() {
		if (playlist.length > 0) {
			currentVideoIndex = (currentVideoIndex + 1) % playlist.length;
		}
	}

	export function previous() {
		if (playlist.length > 0) {
			currentVideoIndex = (currentVideoIndex - 1 + playlist.length) % playlist.length;
		}
	}

	$effect(() => {
		if (videoElement && currentVideoSrc) {
			// Clean up existing HLS instance
			if (hls) {
				hls.destroy();
				hls = null;
			}

			if (isHlsVideo && Hls.isSupported()) {
				// Use hls.js for HLS playback
				hls = new Hls({
					enableWorker: true,
					lowLatencyMode: false
				});
				hls.loadSource(currentVideoSrc);
				hls.attachMedia(videoElement);

				hls.on(Hls.Events.MANIFEST_PARSED, () => {
					videoElement?.play().catch(err => {
						if (err.name === 'AbortError') return;
						console.error('Error playing video:', err);
					});
				});

				hls.on(Hls.Events.ERROR, (event, data) => {
					if (data.fatal) {
						console.error('Fatal HLS error:', data);
						switch (data.type) {
							case Hls.ErrorTypes.NETWORK_ERROR:
								console.log('Network error, trying to recover...');
								hls?.startLoad();
								break;
							case Hls.ErrorTypes.MEDIA_ERROR:
								console.log('Media error, trying to recover...');
								hls?.recoverMediaError();
								break;
							default:
								console.log('Fatal error, skipping to next video');
							setTimeout(() => next(), 2000);
								break;
						}
					}
				});
			} else if (isHlsVideo && videoElement.canPlayType('application/vnd.apple.mpegurl')) {
				// Native HLS support (Safari)
				videoElement.src = currentVideoSrc;
				videoElement.load();
				videoElement.play().catch(err => {
					if (err.name === 'AbortError') return;
					console.error('Error playing video:', err);
				});
			} else {
				// Regular video file
				videoElement.src = currentVideoSrc;
				videoElement.load();
				videoElement.play().catch(err => {
					if (err.name === 'AbortError') return;
					console.error('Error playing video:', err);
				});
			}
		}
	});

	export function togglePlayPause() {
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
		next();
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
			if (hls) {
				hls.destroy();
				hls = null;
			}
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
			autoplay
			onended={handleVideoEnded}
			onplay={handlePlay}
			onpause={handlePause}
			onerror={(e) => {
				// Only skip if it's a media error, not an abort
				const target = e.target as HTMLVideoElement;
				if (target.error && target.error.code !== target.error.MEDIA_ERR_ABORTED) {
					console.error('Video element error, skipping to next');
					setTimeout(() => next(), 2000);
				}
			}}
		>
			<track kind="captions" />
			Your browser does not support the video tag.
		</video>

		<div class="customControls" class:visible={showControls}>
			<button class="controlBtn" onclick={previous} aria-label="Previous video">
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

			<button class="controlBtn" onclick={next} aria-label="Next video">
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
