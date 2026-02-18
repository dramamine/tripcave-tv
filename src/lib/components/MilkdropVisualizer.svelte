<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { shuffle } from '$lib/utils/shuffle';

	interface MediaItem {
		file: string;
		hls?: string;
	}

	const toolbarsContext = getContext<{ value: boolean; show?: () => void }>('showToolbars');
	let showToolbars = $derived(toolbarsContext?.value ?? true);

	let canvas: HTMLCanvasElement;
	let visualizer: any = null;
	let rendering = false;
	let audioContext: AudioContext | null = null;
	let sourceNode: AudioBufferSourceNode | null = null;
	let delayedAudible: DelayNode | null = null;
	let cycleInterval: number | null = null;

	let presets: Record<string, any> = {};
	let presetKeys: string[] = [];
	let presetIndexHist: number[] = [];
	let presetIndex = 0;

	let presetCycle = true;
	let presetCycleLength = 18;
	let presetRandom = true;
	let showStartButton = $state(true);
	let userClickedStart = false;
	let playlist: MediaItem[] = [];
	let currentTrackIndex = 0;
	let preloadedBuffer: AudioBuffer | null = null;
	let windowWidth = $state(0);
	let windowHeight = $state(0);

	function handleResize() {
		windowWidth = window.innerWidth;
		windowHeight = window.innerHeight;
		if (visualizer && canvas) {
			canvas.width = windowWidth;
			canvas.height = windowHeight;
			visualizer.setRendererSize(windowWidth, windowHeight);
		}
	}

	function connectToAudioAnalyzer(sourceNode: AudioNode) {
		if (!audioContext) return;

		if (delayedAudible) {
			delayedAudible.disconnect();
		}

		delayedAudible = audioContext.createDelay();
		delayedAudible.delayTime.value = 0.26;

		sourceNode.connect(delayedAudible);
		delayedAudible.connect(audioContext.destination);

		visualizer.connectAudio(delayedAudible);
	}

	function startRenderer() {
		if (!rendering) return;
		requestAnimationFrame(() => startRenderer());
		visualizer.render();
	}

	function playBufferSource(buffer: AudioBuffer, onEnded?: () => void) {
		if (!audioContext) return;

		if (!rendering) {
			rendering = true;
			startRenderer();
		}

		if (sourceNode) {
			sourceNode.disconnect();
		}

		sourceNode = audioContext.createBufferSource();
		sourceNode.buffer = buffer;
		connectToAudioAnalyzer(sourceNode);

		if (onEnded) {
			sourceNode.onended = onEnded;
		}

		sourceNode.start(0);
	}

	export async function loadLocalFiles(files: FileList, index = 0) {
		if (!audioContext) return;

		audioContext.resume();

		const reader = new FileReader();
		reader.onload = async (event) => {
			const arrayBuffer = event.target?.result as ArrayBuffer;
			const buf = await audioContext!.decodeAudioData(arrayBuffer);

			playBufferSource(buf, () => {
				if (files.length > index + 1) {
					loadLocalFiles(files, index + 1);
				} else {
					if (sourceNode) {
						sourceNode.disconnect();
						sourceNode = null;
					}
				}
			});
		};

		const file = files[index];
		reader.readAsArrayBuffer(file);
	}

	async function loadPlaylistTrack(index: number, skipResume = false) {
		if (!audioContext || !playlist.length || index >= playlist.length) return;

		currentTrackIndex = index;
		if (!skipResume) {
			audioContext.resume();
		}

		try {
			const track = playlist[index];
			const response = await fetch(`/media/music/${encodeURIComponent(track.file)}`);
			const arrayBuffer = await response.arrayBuffer();
			const buf = await audioContext.decodeAudioData(arrayBuffer);

			playBufferSource(buf, () => {
				const nextIndex = (currentTrackIndex + 1) % playlist.length;
				loadPlaylistTrack(nextIndex);
			});
		} catch (error) {
			console.error('Error loading playlist track:', error);
			const nextIndex = (currentTrackIndex + 1) % playlist.length;
			loadPlaylistTrack(nextIndex);
		}
	}

	async function loadPlaylist() {
		try {
			const response = await fetch('/media-index/music.json');
			let files = await response.json();

			// Shuffle the playlist
			files = shuffle(files);
			playlist = files;

			if (playlist.length > 0) {
				currentTrackIndex = 0;
				await preloadFirstTrack();

				if (userClickedStart) {
					await startPlayback();
				}
			}
		} catch (error) {
			console.error('Error loading playlist:', error);
		}
	}

	async function preloadFirstTrack() {
		if (!audioContext || !playlist.length) return;

		try {
			const track = playlist[currentTrackIndex];
			const response = await fetch(`/media/music/${encodeURIComponent(track.file)}`);
			const arrayBuffer = await response.arrayBuffer();
			preloadedBuffer = await audioContext.decodeAudioData(arrayBuffer);
		} catch (error) {
			console.error('Error preloading first track:', error);
		}
	}

	async function startPlayback() {
		if (!audioContext || !preloadedBuffer) return;

		showStartButton = false;
		await audioContext.resume();

		playBufferSource(preloadedBuffer, () => {
			const nextIndex = (currentTrackIndex + 1) % playlist.length;
			loadPlaylistTrack(nextIndex);
		});
	}

	async function handleStartPlaylist() {
		userClickedStart = true;

		if (preloadedBuffer) {
			await startPlayback();
		} else {
			showStartButton = false;
		}
	}

	function handleDocumentClick() {
		if (showStartButton) {
			handleStartPlaylist();
		}
	}

	function connectMicAudio(sourceNode: MediaStreamAudioSourceNode) {
		if (!audioContext) return;

		audioContext.resume();

		const gainNode = audioContext.createGain();
		gainNode.gain.value = 1.25;
		sourceNode.connect(gainNode);

		visualizer.connectAudio(gainNode);
		rendering = true;
		startRenderer();
	}

	export async function handleMicSelect() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			if (audioContext) {
				const micSourceNode = audioContext.createMediaStreamSource(stream);
				connectMicAudio(micSourceNode);
			}
		} catch (err) {
			console.error('Error getting audio stream from getUserMedia', err);
		}
	}

	export function pauseAudio() {
		if (audioContext && audioContext.state === 'running') {
			audioContext.suspend();
		}
	}

	export function resumeAudio() {
		if (audioContext && audioContext.state === 'suspended') {
			audioContext.resume();
		}
	}

	export function togglePlayPause() {
		if (!audioContext) return;
		if (audioContext.state === 'running') {
			pauseAudio();
		} else {
			resumeAudio();
		}
	}

	export function next() {
		if (playlist.length > 0) {
			const nextIndex = (currentTrackIndex + 1) % playlist.length;
			loadPlaylistTrack(nextIndex);
		}
	}

	export function previous() {
		if (playlist.length > 0) {
			const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
			loadPlaylistTrack(prevIndex);
		}
	}

	function nextPreset(blendTime = 5.7) {
		presetIndexHist.push(presetIndex);

		const numPresets = presetKeys.length;
		if (presetRandom) {
			presetIndex = Math.floor(Math.random() * presetKeys.length);
		} else {
			presetIndex = (presetIndex + 1) % numPresets;
		}

		visualizer.loadPreset(presets[presetKeys[presetIndex]], blendTime);
	}

	function prevPreset(blendTime = 5.7) {
		const numPresets = presetKeys.length;
		if (presetIndexHist.length > 0) {
			presetIndex = presetIndexHist.pop()!;
		} else {
			presetIndex = ((presetIndex - 1) + numPresets) % numPresets;
		}

		visualizer.loadPreset(presets[presetKeys[presetIndex]], blendTime);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === ' ' || e.key === 'ArrowRight') {
			e.preventDefault();
			nextPreset();
		} else if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
			e.preventDefault();
			prevPreset();
		} else if (e.key === 'h' || e.key === 'H') {
			nextPreset(0);
		}
	}

	function handleFileSelect() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'audio/*';
		input.multiple = true;

		input.onchange = () => {
			if (input.files) {
				loadLocalFiles(input.files);
			}
		};

		input.click();
	}

	onMount(() => {
		windowWidth = window.innerWidth;
		windowHeight = window.innerHeight;

		audioContext = new AudioContext();

		(async () => {
			const butterchurn = await import('butterchurn');
			const butterchurnPresets = await import('butterchurn-presets');

			const allPresets = butterchurnPresets.default.getPresets();
			presets = Object.keys(allPresets)
				.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
				.reduce((acc: Record<string, any>, key) => {
					acc[key] = allPresets[key];
					return acc;
				}, {});

			presetKeys = Object.keys(presets);
			presetIndex = Math.floor(Math.random() * presetKeys.length);

			visualizer = butterchurn.default.createVisualizer(audioContext, canvas, {
				width: windowWidth,
				height: windowHeight,
				pixelRatio: window.devicePixelRatio || 1,
				textureRatio: 1
			});

			nextPreset(0);
			cycleInterval = setInterval(() => nextPreset(2.7), presetCycleLength * 1000) as unknown as number;

			rendering = true;
			startRenderer();

			await loadPlaylist();

			// Try to autoplay - if it works, hide start button
			try {
				await audioContext!.resume();
				if (audioContext!.state === 'running' && preloadedBuffer) {
					showStartButton = false;
					userClickedStart = true;
					await startPlayback();
				}
			} catch (err) {
				console.log('Autoplay blocked, showing start button');
			}
		})();

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
			if (cycleInterval) {
				clearInterval(cycleInterval);
			}
			if (audioContext) {
				audioContext.close();
			}
		};
	});
</script>

<svelte:window onkeydown={handleKeyDown} />
<svelte:document onclick={handleDocumentClick} />

{#if showStartButton}
	<button id="startOverlay" onclick={handleStartPlaylist} aria-label="Click to start music">
	</button>
{/if}

<canvas bind:this={canvas} id="canvas" width={windowWidth} height={windowHeight}></canvas>

<div class="bottomToolbar" class:visible={showToolbars}>
	<button class="controlBtn" onclick={handleFileSelect} aria-label="Load local files">
		<img src="/files.svg" alt="Load local files" width="20" height="20" />
	</button>
	<button class="controlBtn" onclick={handleMicSelect} aria-label="Use Mic">
		<img src="/microphone.svg" alt="Use Mic" width="24" height="24" />
	</button>
</div>

<style>
	#canvas {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: black;
	}

	#startOverlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.3);
		border: none;
		cursor: pointer;
		z-index: 40;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}

	#startOverlay:hover {
		background: rgba(0, 0, 0, 0.4);
	}

	.bottomToolbar {
		position: fixed;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 1rem;
		background: rgba(0, 0, 0, 0.7);
		padding: 1rem 2rem;
		border-radius: 50px;
		backdrop-filter: blur(10px);
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.3s ease;
		z-index: 100;
	}

	.bottomToolbar.visible {
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

	.controlBtn img {
		filter: brightness(0) invert(1);
	}
</style>
