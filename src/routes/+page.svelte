<script lang="ts">
	import RecentVisitsTable from '$lib/components/recent-visits-table.svelte';
	import VisitSummaryCards from '$lib/components/visit-summary-cards.svelte';

	let { data } = $props();

	const visitSummaries = [
		{
			title: "Today's Visits",
			count: data.visitsThisDay,
			actionText: 'View Records',
			actionHref: '/visits?filter=today'
		},
		{
			title: "This Month's Visits",
			count: data.visitsThisMonth,
			actionText: 'View Records',
			actionHref: '/visits?filter=month'
		},
		{
			title: 'All Visits',
			count: data.totalVisits,
			actionText: 'View Records',
			actionHref: '/visits'
		}
	];
</script>

<!-- Modern responsive dashboard layout -->
<main class="flex w-full max-w-none flex-1 flex-col md:max-w-6xl">
	<!-- Visit summaries section with responsive spacing -->
	<section class="py-6 md:py-8">
		<div class="px-4 md:px-6">
			<h2 class="medical-typography-heading mb-4 text-lg text-foreground md:text-xl lg:text-2xl">
				Visit Summaries
			</h2>
		</div>

		<VisitSummaryCards summaries={visitSummaries} />
	</section>

	<!-- Recent visits section with responsive layout -->
	<section class="pb-6 md:pb-8">
		<div class="px-4 md:px-6">
			<h2 class="medical-typography-heading mb-4 text-lg text-foreground md:text-xl lg:text-2xl">
				Recent Student Visits
			</h2>
		</div>

		<RecentVisitsTable visits={data.recentVisits} />
	</section>
</main>
