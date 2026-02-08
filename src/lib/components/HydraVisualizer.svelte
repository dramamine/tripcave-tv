<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import REGL from 'regl';
	import { Hydra, generators } from 'hydra-ts';
	import ArrayUtils from 'hydra-ts/src/lib/array-utils';

	const toolbarsContext = getContext<{ value: boolean }>('showToolbars');
	let showToolbars = $derived(toolbarsContext?.value ?? true);

	let canvas: HTMLCanvasElement;
	let hydra: Hydra | null = null;
	let windowWidth = $state(0);
	let windowHeight = $state(0);
	let currentAnimation = $state('waves');
	let transitionProgress = $state(0); // 0 = show currentOutput, 1 = show nextOutput
	let isTransitioning = $state(false);
	let currentOutput = $state(0); // Index: 0 or 1
	let nextOutput = $state(1); // Index: 0 or 1

	// Individual animation functions that render to a specified output
	function renderWaves(output: any) {
		const { osc } = generators;
		osc(4, 0.1, 1.2).out(output);
	}

	function renderKaleidoscope(output: any) {
		const { osc, shape } = generators;
		shape(4).diff(osc(2, 0.1, 1.2)).kaleid(4).out(output);
	}

	function startAnimation(animName: string, output: any) {
		if (animName === 'waves') {
			renderWaves(output);
		} else if (animName === 'kaleidoscope') {
			renderKaleidoscope(output);
		}
	}

	function setupBlending(hydra: Hydra) {
		const { sources, outputs, render } = hydra;
		const [o0, o1, o2, o3] = outputs;
		const { src } = generators;

		// Blend between o0 and o1 based on currentOutput and transitionProgress
		// If currentOutput is 0: blend from o0 to o1
		// If currentOutput is 1: blend from o1 to o0
		src(currentOutput === 0 ? o0 : o1)
			.blend(src(currentOutput === 0 ? o1 : o0), () => transitionProgress)
			.out(o2);

		render(o2);
	}

	function switchAnimation(animName: string) {
		if (!hydra || isTransitioning || currentAnimation === animName) return;

		const { outputs } = hydra;
		const [o0, o1] = outputs;

		isTransitioning = true;

		// Start the new animation on the nextOutput
		const targetOutput = currentOutput === 0 ? o1 : o0;
		startAnimation(animName, targetOutput);

		// Animate the transition over 1 second
		const startTime = Date.now();
		const duration = 1000; // 1 second

		function animate() {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Easing function (ease-in-out)
			const eased = progress < 0.5
				? 2 * progress * progress
				: 1 - Math.pow(-2 * progress + 2, 2) / 2;

			transitionProgress = eased;

			if (progress < 1) {
				requestAnimationFrame(animate);
			} else {
				// Transition complete - swap current and next
				currentOutput = currentOutput === 0 ? 1 : 0;
				nextOutput = nextOutput === 0 ? 1 : 0;
				transitionProgress = 0;
				currentAnimation = animName;
				isTransitioning = false;

				// Re-setup blending with new currentOutput
				setupBlending(hydra);
			}
		}

		animate();
	}

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

		// Set canvas dimensions
		canvas.width = windowWidth;
		canvas.height = windowHeight;

		// Initialize ArrayUtils before creating Hydra instance
		ArrayUtils.init();

		const regl = REGL(canvas);

		hydra = new Hydra({
			regl,
			width: windowWidth,
			height: windowHeight,
			numSources: 4,
			numOutputs: 4,
			precision: 'mediump'
		});

		// Start the render loop
		hydra.loop.start();

		// Get initial output
		const { outputs } = hydra;
		const [o0, o1] = outputs;

		// Start initial animation on o0
		startAnimation(currentAnimation, o0);

		// Setup blending system
		setupBlending(hydra);

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
	<button
		class="controlBtn"
		class:active={currentAnimation === 'waves'}
		onclick={() => switchAnimation('waves')}
		aria-label="Waves animation"
	>
		Waves
	</button>
	<button
		class="controlBtn"
		class:active={currentAnimation === 'kaleidoscope'}
		onclick={() => switchAnimation('kaleidoscope')}
		aria-label="Kaleidoscope animation"
	>
		Kaleidoscope
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
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		transition: all 0.2s ease;
		font-size: 0.9rem;
	}

	.controlBtn:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.5);
	}

	.controlBtn.active {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.7);
	}
</style>
