<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import { onMount, setContext } from 'svelte';

	let { children } = $props();
	
	let showToolbars = $state(true);
	let mouseInactivityTimer: number | null = null;
	let mouseLeaveFadeTimer: number | null = null;

	function showToolbarsAndResetTimer() {
		showToolbars = true;

		if (mouseInactivityTimer) {
			clearTimeout(mouseInactivityTimer);
		}
		if (mouseLeaveFadeTimer) {
			clearTimeout(mouseLeaveFadeTimer);
		}

		mouseInactivityTimer = setTimeout(() => {
			showToolbars = false;
		}, 5000) as unknown as number;
	}

	// Make showToolbars available to child components via context
	setContext('showToolbars', {
		get value() { return showToolbars; },
		show: showToolbarsAndResetTimer
	});

	function handleMouseMove() {
		showToolbarsAndResetTimer();
	}

	function handleMouseLeave() {
		if (mouseInactivityTimer) {
			clearTimeout(mouseInactivityTimer);
		}

		mouseLeaveFadeTimer = setTimeout(() => {
			showToolbars = false;
		}, 2000) as unknown as number;
	}

	function handleMouseEnter() {
		if (mouseLeaveFadeTimer) {
			clearTimeout(mouseLeaveFadeTimer);
		}
		showToolbars = true;
	}

	onMount(() => {
		handleMouseMove();
		
		return () => {
			if (mouseInactivityTimer) clearTimeout(mouseInactivityTimer);
			if (mouseLeaveFadeTimer) clearTimeout(mouseLeaveFadeTimer);
		};
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<svelte:window 
	onmousemove={handleMouseMove}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
/>

<Toolbar bind:showToolbars />
{@render children()}
