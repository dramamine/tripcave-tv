<script lang="ts">
	interface YoutubeChannelProps {
		playlistId: string;
	}

	let { playlistId }: YoutubeChannelProps = $props();

	let embedUrl = $derived(`https://www.youtube.com/embed?listType=playlist&list=${playlistId}`);
</script>

<div class="youtubeChannelContainer">
	<div class="toolbarOverlay"></div>
	<iframe
		src={embedUrl}
		title="YouTube playlist player"
		frameborder="0"
		allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
		referrerpolicy="strict-origin-when-cross-origin"
		allowfullscreen
	></iframe>
</div>

<style>
	.youtubeChannelContainer {
		position: fixed;
		top: 60px;
		left: 0;
		width: 100vw;
		height: calc(100vh - 60px);
		background: black;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.toolbarOverlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 60px;
		background: black;
		z-index: 10;
		pointer-events: none;
	}

	iframe {
		width: 100%;
		height: 100%;
		border: none;
	}
</style>
