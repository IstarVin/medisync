<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';

	interface VisitSummary {
		title: string;
		count: number;
		actionText: string;
		actionHref?: string;
	}

	let { summaries }: { summaries: VisitSummary[] } = $props();
</script>

<!-- Container queries for responsive card layout -->
<div class="medical-container @container flex flex-wrap gap-4 p-4">
	{#each summaries as summary}
		<!-- Use container queries for adaptive card sizing -->
		<Card.Root
			class="flex-1 space-y-3 medical-card medical-card-hover @xs:min-w-[12rem] @sm:min-w-[14rem] @md:min-w-[16rem] @lg:min-w-[18rem]"
		>
			<Card.Content class="space-y-3 p-0">
				<!-- Enhanced typography with semantic color usage -->
				<h3 class="text-base leading-normal font-medium text-foreground">
					{summary.title}
				</h3>

				<!-- Large count display with enhanced styling -->
				<div class="text-3xl leading-none font-bold tracking-tight text-foreground @md:text-4xl">
					{summary.count.toLocaleString()}
				</div>

				<!-- Action link with improved hover states -->
				{#if summary.actionHref}
					<a
						href={summary.actionHref}
						class="inline-flex items-center text-sm font-medium text-muted-foreground
						       transition-all duration-[--duration-fast] ease-out
						       hover:text-foreground hover:underline hover:underline-offset-4
						       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
						       active:scale-[0.98]"
					>
						{summary.actionText}
						<!-- Arrow icon using arbitrary SVG -->
						<svg
							class="ml-1 h-3 w-3 transition-transform duration-[--duration-fast] group-hover:translate-x-0.5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/>
						</svg>
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
