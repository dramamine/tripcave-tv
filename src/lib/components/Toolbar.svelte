<script lang="ts">
	import ChannelSwitcher from './ChannelSwitcher.svelte';

	let { showToolbars = $bindable(false) } = $props();
</script>

<div class="topToolbar" class:visible={showToolbars}>
	<div class="siteName">helpimstoned</div>
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
		background: rgba(0, 0, 0, 0.5);
		z-index: 50;
		display: flex;
		align-items: center;
		padding: 0 2rem;
		opacity: 0;
		pointer-events: none;
		transition: opacity 2s ease;
		justify-content: space-between;
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
		flex: 0 0 auto;
	}

	.channelSwitcherWrapper {
		flex: 1;
		display: flex;
		justify-content: center;
	}

	.spacer {
		flex: 0 0 auto;
		width: 200px;
	}
</style>
