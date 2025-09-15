<script lang="ts">
	interface Props {
		showSubtitle?: boolean;
	}

	let { showSubtitle = true }: Props = $props();
</script>

<!-- Logo section -->
<a class="flex items-center gap-3" href="/">
	<div class="flex size-10 items-center justify-center">
		<img src="/logo.png" alt="CareLog logo" class="size-10 rounded-md shadow-md" />
	</div>
	<div>
		<h1 class="text-xl font-bold tracking-tight text-gray-900 dark:text-white">CareLog</h1>
		{#if showSubtitle}
			<p class="text-sm text-gray-500 dark:text-gray-400">Clinic Management</p>
		{/if}
	</div>
</a>
