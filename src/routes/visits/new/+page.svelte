<script lang="ts">
	import { goto } from '$app/navigation';
	import NewVisitModal from '$lib/components/new-visit-modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ArrowLeft } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let modalOpen = $state(true);

	// When modal closes, go back to student page
	function handleModalClose() {
		modalOpen = false;
		goto(`/students/${data.student.id}`);
	}

	// Auto-open modal on mount
	onMount(() => {
		modalOpen = true;
	});
</script>

<svelte:head>
	<title>New Visit - {data.student.firstName} {data.student.lastName} - MediSYNC</title>
	<meta
		name="description"
		content="Create a new clinic visit for {data.student.firstName} {data.student.lastName}"
	/>
</svelte:head>

<main class="mx-5 flex w-full max-w-none flex-1 flex-col">
	<div class="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
		<!-- Header with back navigation -->
		<div class="flex items-center gap-4">
			<Button variant="outline" size="icon" onclick={() => goto(`/students/${data.student.id}`)}>
				<ArrowLeft class="size-4" />
				<span class="sr-only">Back to student profile</span>
			</Button>
			<div class="flex flex-col gap-1">
				<h1 class="medical-typography-heading text-xl text-foreground md:text-2xl">
					New Clinic Visit
				</h1>
				<div class="text-sm text-muted-foreground">
					Creating visit for {data.student.firstName}
					{data.student.lastName}
				</div>
			</div>
		</div>

		<!-- Loading state or fallback content -->
		<div class="flex flex-1 items-center justify-center">
			<div class="text-center">
				<h2 class="mb-2 text-lg font-semibold text-foreground">Creating New Visit</h2>
				<p class="text-sm text-muted-foreground">
					Please complete the visit form to record the clinic visit.
				</p>
			</div>
		</div>
	</div>
</main>

<!-- New Visit Modal -->
<NewVisitModal
	bind:open={modalOpen}
	student={data.student}
	availableNurses={data.availableNurses}
/>

<style>
	/* Ensure modal appears on top */
	:global(.dialog-overlay) {
		z-index: 50;
	}
</style>
