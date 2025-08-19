<script lang="ts">
	import RecentVisitsTable from '$lib/components/recent-visits-table.svelte';
	import VisitSummaryCards from '$lib/components/visit-summary-cards.svelte';

	// Sample data - in a real app this would come from a load function
	const visitSummaries = [
		{
			title: "Today's Visits",
			count: 7,
			actionText: 'View Records',
			actionHref: '/visits/today'
		},
		{
			title: "This Month's Visits",
			count: 25,
			actionText: 'View Records',
			actionHref: '/visits/month'
		},
		{
			title: 'All Visits',
			count: 150,
			actionText: 'View Records',
			actionHref: '/visits/all'
		}
	];

	const recentVisits = [
		{
			id: '1',
			patientName: 'Liam Harper',
			section: 'Grade 10',
			reasonForVisit: 'Fever and cough',
			time: '10:00 AM',
			date: '2024-07-26'
		},
		{
			id: '2',
			patientName: 'Olivia Hayes',
			section: 'Grade 11',
			reasonForVisit: 'Head injury',
			time: '2:30 PM',
			date: '2024-07-25'
		},
		{
			id: '3',
			patientName: 'Ethan Reed',
			section: 'Grade 9',
			reasonForVisit: 'Sprained ankle',
			time: '11:45 AM',
			date: '2024-07-24'
		},
		{
			id: '4',
			patientName: 'Ava Foster',
			section: 'Grade 12',
			reasonForVisit: 'Allergic reaction',
			time: '9:15 AM',
			date: '2024-07-23'
		},
		{
			id: '5',
			patientName: 'Noah Parker',
			section: 'Grade 10',
			reasonForVisit: 'Sore throat',
			time: '1:00 PM',
			date: '2024-07-22'
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

		<RecentVisitsTable visits={recentVisits} />
	</section>
</main>
