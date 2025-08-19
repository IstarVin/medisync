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
<main class="mx-5 flex w-full flex-1 flex-col">
	<!-- Dashboard header -->
	<header class="border-b border-border bg-background px-4 py-6 md:px-6">
		<div class="flex min-w-0 flex-col gap-2">
			<h1 class="medical-typography-heading text-2xl text-foreground md:text-3xl lg:text-4xl">
				Dashboard
			</h1>
			<p class="medical-typography-body text-sm text-muted-foreground md:text-base lg:text-lg">
				Welcome back, Nurse Emily Carter
			</p>
		</div>
	</header>

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
