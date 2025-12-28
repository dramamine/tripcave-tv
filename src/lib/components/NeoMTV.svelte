<script lang="ts">
	// const videoFilename = 'SLUGABED - QUANTUM LEAP (official video) [7YdH18U2OLM].mp4';
	const videoFilename = 'PURE - COLLAPSE CODE [qkLXPAnBmcw].mp4';
  const videoSrc = `/api/videos/${encodeURIComponent(videoFilename)}`;
</script>

<div class="neoMtvContainer">
	<video controls autoplay>
		<source src={videoSrc} type="video/mp4" />
		<track kind="captions" />
		Your browser does not support the video tag.
	</video>
</div>

<style>
	.neoMtvContainer {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: black;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	video {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
</style>
