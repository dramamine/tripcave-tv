<script lang="ts">
	import MilkdropVisualizer from '$lib/components/MilkdropVisualizer.svelte';
	import NeoMTV from '$lib/components/NeoMTV.svelte';
	import { channelIndex } from '$lib/stores/channelStore';
	import { getContext } from 'svelte';

	const toolbarsContext = getContext<{ value: boolean }>('showToolbars');
	let showToolbars = $derived(toolbarsContext?.value ?? true);

	let milkdropRef = $state<any>(null);
	let currentChannel = $state(0);

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

	function handleFileSelect() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'audio/*';
		input.multiple = true;

		input.onchange = () => {
			if (input.files && milkdropRef) {
				milkdropRef.loadLocalFiles(input.files);
			}
		};

		input.click();
	}

	async function handleMicSelect() {
		if (milkdropRef) {
			milkdropRef.handleMicSelect();
		}
	}
</script>

<div id="mainWrapper">
	{#if $channelIndex === 0}
		<MilkdropVisualizer bind:this={milkdropRef} />
	{:else if $channelIndex === 1}
		<NeoMTV />
	{/if}

	{#if $channelIndex === 0}
		<div class="bottomToolbar" class:visible={showToolbars}>
			<div id="audioSelectWrapper">
				<button id="localFileBut" onclick={handleFileSelect}>
					<img src="/files.svg" alt="Load local files" width="16" height="16" />
					<span>Load local files</span>
				</button>
				<button id="micSelect" onclick={handleMicSelect}>
					<img src="/microphone.svg" alt="Use Mic" width="24" height="24" />
				</button>
			</div>
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

	.bottomToolbar {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 80px;
		background: rgba(0, 0, 0, 0.5);
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		pointer-events: none;
		transition: opacity 2s ease;
	}

	.bottomToolbar.visible {
		opacity: 1;
		pointer-events: auto;
	}

	#audioSelectWrapper {
		display: flex;
		gap: 1rem;
	}

	#audioSelectWrapper button {
		padding: 0.5rem 1rem;
		background: #4a5568;
		color: white;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	#audioSelectWrapper button img {
		filter: brightness(0) invert(1);
	}

	#audioSelectWrapper button:hover {
		background: #2d3748;
	}
</style>
