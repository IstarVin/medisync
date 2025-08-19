<script lang="ts">
	import MobileMenuButton from '$lib/components/mobile-menu-button.svelte';
	import MobileNavigation from '$lib/components/mobile-navigation.svelte';
	import RecentVisitsTable from '$lib/components/recent-visits-table.svelte';
	import SidebarNavigation from '$lib/components/sidebar-navigation.svelte';
	import ThemeSwitcher from '$lib/components/theme-switcher.svelte';
	import VisitSummaryCards from '$lib/components/visit-summary-cards.svelte';

	let isMobileMenuOpen = $state(false);

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}

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

<!-- Desktop sidebar - hidden on mobile -->
<div class="hidden md:block">
	<SidebarNavigation />
</div>

<!-- Mobile navigation overlay -->
<MobileNavigation isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />

<!-- Modern responsive dashboard layout -->
<main class="flex w-full max-w-none flex-1 flex-col md:max-w-6xl">
	<!-- Enhanced mobile-first header with navigation controls -->
	<header
		class="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card/50 p-4 md:p-6"
	>
		<div class="flex items-center gap-3">
			<!-- Mobile menu button -->
			<MobileMenuButton isOpen={isMobileMenuOpen} onToggle={toggleMobileMenu} />

			<!-- Header content -->
			<div class="flex min-w-0 flex-col gap-2">
				<h1 class="medical-typography-heading text-2xl text-foreground md:text-3xl lg:text-4xl">
					Dashboard
				</h1>
				<p class="medical-typography-body text-sm text-muted-foreground md:text-base lg:text-lg">
					Welcome back, <span class="font-medium text-foreground">Nurse Emily Carter</span>
				</p>
			</div>
		</div>

		<ThemeSwitcher />
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

		<RecentVisitsTable visits={recentVisits} />
	</section>
</main>
