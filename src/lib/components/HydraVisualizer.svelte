<script lang="ts">
	import { onMount, getContext } from 'svelte';

	const toolbarsContext = getContext<{ value: boolean }>('showToolbars');
	let showToolbars = $derived(toolbarsContext?.value ?? true);

	let canvas: HTMLCanvasElement;
	let hydra: any = null;
	let windowWidth = $state(0);
	let windowHeight = $state(0);

	function handleResize() {
		windowWidth = window.innerWidth;
		windowHeight = window.innerHeight;
		if (canvas) {
			canvas.width = windowWidth;
			canvas.height = windowHeight;
		}
		if (hydra) {
			hydra.setResolution(windowWidth, windowHeight);
		}
	}

	onMount(async () => {
		windowWidth = window.innerWidth;
		windowHeight = window.innerHeight;

		// Polyfill global for browser environment
		if (typeof (window as any).global === 'undefined') {
			(window as any).global = window;
		}

		const Hydra = (await import('hydra-synth')).default;

		hydra = new Hydra({
			canvas: canvas,
			width: windowWidth,
			height: windowHeight,
			autoLoop: true,
			makeGlobal: true,
			detectAudio: false,
			numSources: 4,
			numOutputs: 4
		});

		// Example visualization
		osc(4, 0.1, 1.2).out();

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
			if (hydra) {
				hydra.hush();
			}
		};
	});
</script>

<canvas bind:this={canvas} id="canvas" width={windowWidth} height={windowHeight}></canvas>

<div class="bottomToolbar" class:visible={showToolbars}>
	<div class="info">Hydra Synth Visualizer</div>
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

	.info {
		color: white;
		font-size: 0.9rem;
	}
</style>
