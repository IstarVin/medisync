<script lang="ts">
	import RecentVisitsTable from '$lib/components/recent-visits-table.svelte';
	import SidebarNavigation from '$lib/components/sidebar-navigation.svelte';
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

<SidebarNavigation />

<!-- Modern dashboard layout with container queries and advanced Tailwind patterns -->
<main
	class="medical-container layout-content-container @container flex max-w-[--container-medical-dashboard] flex-1 flex-col"
>
	<!-- Enhanced header section with better typography -->
	<header class="flex flex-wrap justify-between gap-6 border-b border-outline bg-surface/50 p-6">
		<div class="@container flex min-w-[18rem] flex-col gap-3">
			<!-- Using medical typography utility and semantic colors -->
			<h1 class="medical-typography-heading text-3xl text-foreground @md:text-4xl">Dashboard</h1>
			<p class="medical-typography-body text-base text-muted-foreground @md:text-lg">
				Welcome back, <span class="font-medium text-foreground">Nurse Emily Carter</span>
			</p>
		</div>

		<!-- Optional status indicator using custom utility -->
		<!-- <div
			class="flex items-center gap-2 rounded-full border border-medical-success/20 bg-medical-success/10 px-4 py-2 text-medical-success"
		>
			<div class="h-2 w-2 animate-pulse rounded-full bg-medical-success"></div>
			<span class="text-sm font-medium">System Online</span>
		</div> -->
	</header>

	<!-- Visit summaries section with enhanced spacing -->
	<section class="medical-section">
		<div class="px-6">
			<h2 class="mb-4 medical-typography-heading text-xl text-foreground @md:text-2xl">
				Visit Summaries
			</h2>
		</div>

		<VisitSummaryCards summaries={visitSummaries} />
	</section>

	<!-- Recent visits section with better organization -->
	<section class="medical-section pb-8">
		<div class="px-6">
			<h2 class="mb-4 medical-typography-heading text-xl text-foreground @md:text-2xl">
				Recent Student Visits
			</h2>
		</div>

		<RecentVisitsTable visits={recentVisits} />
	</section>
</main>
