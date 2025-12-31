<script lang="ts">
	import ChannelSwitcher from './ChannelSwitcher.svelte';
	import { siteName } from '$lib/stores/channelStore';

	let { showToolbars = $bindable(false) } = $props();
</script>

<div class="topToolbar" class:visible={showToolbars}>
	<div class="siteName">{siteName}</div>
	<div class="channelSwitcherWrapper">
		<ChannelSwitcher />
	</div>
	<div class="spacer"></div>
</div>

<style>
	.topToolbar {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 60px;
		background: rgba(0, 0, 0, 0.7);
		z-index: 50;
		display: flex;
		align-items: center;
		padding: 0 2rem;
		opacity: 0;
		pointer-events: none;
		transition: opacity 2s ease;
	}

	.topToolbar.visible {
		opacity: 1;
		pointer-events: auto;
	}

	.siteName {
		color: white;
		font-size: 1.5rem;
		font-weight: bold;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
		flex: 1;
	}

	.channelSwitcherWrapper {
		flex: 0 0 auto;
		display: flex;
		justify-content: center;
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
	}

	.spacer {
		flex: 1;
	}
</style>
