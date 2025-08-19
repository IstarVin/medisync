<script lang="ts">
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
	<div class="overflow-hidden medical-card medical-card-hover">
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
						class="border-t border-outline transition-colors duration-[--duration-fast] hover:bg-surface-variant/50"
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
</div>
