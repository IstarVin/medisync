<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { ChevronRight } from '@lucide/svelte';

	interface VisitSummary {
		title: string;
		count: number;
		actionText: string;
		actionHref?: string;
	}

	let { summaries }: { summaries: VisitSummary[] } = $props();
</script>

<!-- Responsive card layout -->
<div class="flex flex-wrap gap-4 p-4">
	{#each summaries as summary}
		<!-- Use responsive card sizing -->
		<Card.Root
			class="medical-card min-w-[12rem] flex-1 space-y-3 sm:min-w-[14rem] md:min-w-[16rem] lg:min-w-[18rem]"
		>
			<Card.Content class="space-y-3 p-0">
				<!-- Enhanced typography -->
				<h3 class="text-base leading-normal font-medium text-foreground">
					{summary.title}
				</h3>

				<!-- Large count display -->
				<div class="text-3xl leading-none font-bold tracking-tight text-foreground md:text-4xl">
					{summary.count.toLocaleString()}
				</div>

				<!-- Action link -->
				{#if summary.actionHref}
					<a
						href={summary.actionHref}
						class="inline-flex items-center text-sm font-medium text-muted-foreground
						       transition-all duration-150 ease-out
						       hover:text-foreground hover:underline hover:underline-offset-4
						       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
						       active:scale-[0.98]"
					>
						{summary.actionText}
						<ChevronRight class="size-4" />
					</a>
				{:else}
					<p class="text-sm font-medium text-muted-foreground">
						{summary.actionText}
					</p>
				{/if}
			</Card.Content>
		</Card.Root>
	{/each}
</div>
