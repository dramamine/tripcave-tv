<script lang="ts">
	import { currentChannel, channels, nextChannel, previousChannel } from '$lib/stores/channelStore';
</script>

<div class="channelSwitcher">
	<button class="channelArrow" onclick={previousChannel} aria-label="Previous channel">
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
			<path fill="currentColor" d="M15.41 7.41L14 6l-6 6l6 6l1.41-1.41L10.83 12z" />
		</svg>
	</button>
	<div class="channelName">{$currentChannel}</div>
	<button class="channelArrow" onclick={nextChannel} aria-label="Next channel">
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
			<path fill="currentColor" d="M10 6L8.59 7.41L13.17 12l-4.58 4.59L10 18l6-6z" />
		</svg>
	</button>
</div>

<style>
	.channelSwitcher {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.channelName {
		color: white;
		font-size: 1.25rem;
		font-weight: 500;
		min-width: 200px;
		text-align: center;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}

	.channelArrow {
		background: rgba(255, 255, 255, 0.1);
		border: none;
		border-radius: 0.25rem;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		transition: background 0.2s;
	}

	.channelArrow:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.channelArrow svg {
		display: block;
	}
</style>
