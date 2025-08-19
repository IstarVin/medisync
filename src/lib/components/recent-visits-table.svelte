<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	interface StudentVisit {
		id: string;
		patientName: string;
		section: string;
		reasonForVisit: string;
		time: string;
		date: string;
	}

	let { visits }: { visits: StudentVisit[] } = $props();
</script>

<!-- Modern container queries for responsive table -->
<div class="medical-container @container px-4 py-3">
	{#if visits.length === 0}
		<!-- Empty state when no visits are available -->
		<Card.Root class="medical-card border-2 border-dashed border-muted-foreground/30">
			<Card.Content class="flex flex-col items-center justify-center px-6 py-12 text-center">
				<!-- Medical icon or illustration -->
				<div class="bg-surface mb-4 rounded-full p-6">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-12 w-12 text-muted-foreground"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
				</div>

				<!-- Empty state content -->
				<h3 class="medical-typography-heading mb-2 text-lg font-semibold text-foreground">
					No Recent Visits
				</h3>
				<p class="mb-6 max-w-md text-sm text-muted-foreground">
					When students visit the clinic, their information will appear here. The most recent 10
					visits are displayed for quick access.
				</p>

				<!-- Call to action buttons -->
				<div class="flex flex-col gap-3 sm:flex-row">
					<Button href="/students" variant="default" class="w-full sm:w-auto">
						Browse Students
					</Button>
					<Button href="/visits" variant="outline" class="w-full sm:w-auto">View All Visits</Button>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<!-- Normal table view when visits exist -->
		<div class="medical-card medical-card-hover overflow-hidden">
			<Table.Root>
				<Table.Header>
					<Table.Row class="bg-surface">
						<!-- Use container queries for responsive column widths -->
						<Table.Head
							class="px-4 py-3 text-left text-sm font-medium text-foreground @sm:hidden @lg:table-cell @lg:w-auto"
						>
							Patient
						</Table.Head>
						<Table.Head
							class="px-4 py-3 text-left text-sm font-medium text-foreground @xs:hidden @md:table-cell @md:w-auto"
						>
							Section
						</Table.Head>
						<Table.Head class="w-auto px-4 py-3 text-left text-sm font-medium text-foreground">
							Reason for Visit
						</Table.Head>
						<Table.Head
							class="px-4 py-3 text-left text-sm font-medium text-foreground @xs:hidden @sm:table-cell @sm:w-auto"
						>
							Time
						</Table.Head>
						<Table.Head
							class="px-4 py-3 text-left text-sm font-medium text-foreground @md:hidden @lg:table-cell @lg:w-auto"
						>
							Date
						</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each visits as visit}
						<Table.Row
							class="border-outline hover:bg-surface-variant/50 border-t transition-colors duration-[--duration-fast]"
						>
							<!-- Responsive table cells using container queries -->
							<Table.Cell
								class="h-[72px] py-2 text-sm font-normal text-foreground @sm:hidden @lg:table-cell @lg:px-4"
							>
								{visit.patientName}
							</Table.Cell>
							<Table.Cell
								class="h-[72px] py-2 text-sm font-normal text-muted-foreground @xs:hidden @md:table-cell @md:px-4"
							>
								{visit.section}
							</Table.Cell>
							<Table.Cell class="h-[72px] px-4 py-2 text-sm font-normal text-muted-foreground">
								<!-- Show patient name inline on small containers -->
								<div class="mb-1 font-medium text-foreground @lg:hidden">
									{visit.patientName}
								</div>
								<div class="mb-1 text-xs text-muted-foreground @md:hidden">
									{visit.section}
								</div>
								{visit.reasonForVisit}
								<!-- Show time/date inline on very small containers -->
								<div class="mt-1 space-y-0.5 text-xs text-muted-foreground @sm:hidden">
									<div>{visit.time}</div>
									<div class="@lg:hidden">{visit.date}</div>
								</div>
							</Table.Cell>
							<Table.Cell
								class="h-[72px] py-2 text-sm font-normal text-muted-foreground @xs:hidden @sm:table-cell @sm:px-4"
							>
								{visit.time}
							</Table.Cell>
							<Table.Cell
								class="h-[72px] py-2 text-sm font-normal text-muted-foreground @md:hidden @lg:table-cell @lg:px-4"
							>
								{visit.date}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
