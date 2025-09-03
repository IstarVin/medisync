<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { fade } from 'svelte/transition';

	let showTransition = $state(false);

	beforeNavigate(async (e) => {
		const sleep = new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 300));
		const res = await Promise.race([sleep, e.complete]);
		if (res) {
			showTransition = true;
		}
		await e.complete;
		showTransition = false;
	});
</script>

{#if showTransition}
	<div
		class="fixed z-10000 h-screen w-full animate-pulse bg-black/50!"
		transition:fade={{ duration: 200 }}
	></div>
{/if}
