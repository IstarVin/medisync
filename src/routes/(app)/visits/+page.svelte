<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import VisitsTable from '$lib/components/visits-table.svelte';
	import { toTitleCase } from '$lib/utils';
	import { ArrowLeft, ArrowRight, Calendar, Funnel, Search, X } from '@lucide/svelte';
	import type { PageData } from './$types';

	// Props from the load function
	const { data }: { data: PageData } = $props();

	// Types based on database schema
	type VisitStatus = 'active' | 'completed' | 'cancelled';
	type Severity = 'low' | 'medium' | 'high' | 'critical';

	type FilterOptions = {
		visitType: string;
		status: VisitStatus | '';
		severity: Severity | '';
		grade: string;
		dateRange: string;
	};

	// Client-side reactive state using Svelte 5 runes
	let searchQuery = $state('');
	let filters = $state<FilterOptions>({
		visitType: '',
		status: '',
		severity: '',
		grade: '',
		dateRange: ''
	});

	// Client-side pagination state
	let currentPage = $state(1);
	let itemsPerPage = $state(25);
	let itemsPerPageStr = $state('25');

	// Get data from load function
	let allVisits = $derived(
		data.visits.map((visit) => ({
			...visit,
			checkInTime: new Date(visit.checkInTime),
			checkOutTime: visit.checkOutTime ? new Date(visit.checkOutTime) : null
		}))
	);

	let visitStats = $derived(data.stats);
	let uniqueVisitTypes = $derived(data.filterOptions.visitTypes);
	let uniqueStatuses = $derived(data.filterOptions.statuses);
	let uniqueSeverities = $derived(data.filterOptions.severities);
	let uniqueGrades = $derived(data.filterOptions.grades);

	// Client-side filtering logic
	let filteredVisits = $derived.by(() => {
		let visits = allVisits;

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			visits = visits.filter(
				(visit) =>
					visit.student?.firstName.toLowerCase().includes(query) ||
					visit.student?.lastName.toLowerCase().includes(query) ||
					visit.student?.studentId.toLowerCase().includes(query) ||
					visit.chiefComplaint.toLowerCase().includes(query) ||
					visit.visitNumber.toString().includes(query)
			);
		}

		// Apply visit type filter
		if (filters.visitType) {
			visits = visits.filter((visit) => visit.visitType === filters.visitType);
		}

		// Apply status filter
		if (filters.status) {
			visits = visits.filter((visit) => visit.status === filters.status);
		}

		// Apply severity filter
		if (filters.severity) {
			visits = visits.filter((visit) => visit.severity === filters.severity);
		}

		// Apply grade filter
		if (filters.grade) {
			visits = visits.filter((visit) => visit.student?.grade === filters.grade);
		}

		// Apply date range filter
		if (filters.dateRange) {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			visits = visits.filter((visit) => {
				const visitDate = new Date(visit.checkInTime);
				visitDate.setHours(0, 0, 0, 0);

				switch (filters.dateRange) {
					case 'today':
						return visitDate.getTime() === today.getTime();
					case 'this-week':
						const weekStart = new Date(today);
						weekStart.setDate(today.getDate() - today.getDay());
						return visitDate >= weekStart;
					case 'this-month':
						return (
							visitDate.getMonth() === today.getMonth() &&
							visitDate.getFullYear() === today.getFullYear()
						);
					case 'last-30-days':
						const thirtyDaysAgo = new Date(today);
						thirtyDaysAgo.setDate(today.getDate() - 30);
						return visitDate >= thirtyDaysAgo;
					default:
						return true;
				}
			});
		}

		return visits;
	});

	// Client-side pagination logic
	let paginatedVisits = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredVisits.slice(startIndex, endIndex);
	});

	// Pagination info
	let paginationInfo = $derived.by(() => {
		const totalPages = Math.ceil(filteredVisits.length / itemsPerPage);
		return {
			currentPage,
			totalPages,
			totalItems: filteredVisits.length,
			hasNext: currentPage < totalPages,
			hasPrev: currentPage > 1,
			startIndex: (currentPage - 1) * itemsPerPage + 1,
			endIndex: Math.min(currentPage * itemsPerPage, filteredVisits.length)
		};
	});

	// Reset to first page when filters change
	$effect(() => {
		// Watch for changes in search query or filters
		searchQuery;
		filters.visitType;
		filters.status;
		filters.severity;
		filters.grade;
		filters.dateRange;

		// Reset to first page
		currentPage = 1;
	});

	// Reset to first page when items per page changes
	$effect(() => {
		itemsPerPage = parseInt(itemsPerPageStr);
		currentPage = 1;
	});

	// Check if any filters are active
	let hasActiveFilters = $derived(
		searchQuery.trim() ||
			filters.visitType ||
			filters.status ||
			filters.severity ||
			filters.grade ||
			filters.dateRange
	);

	// Helper functions
	function clearFilters() {
		searchQuery = '';
		filters = {
			visitType: '',
			status: '',
			severity: '',
			grade: '',
			dateRange: ''
		};
		currentPage = 1;
	}

	// Pagination handlers
	function goToPage(page: number) {
		if (page >= 1 && page <= paginationInfo.totalPages) {
			currentPage = page;
		}
	}

	function nextPage() {
		if (paginationInfo.hasNext) {
			currentPage++;
		}
	}

	function prevPage() {
		if (paginationInfo.hasPrev) {
			currentPage--;
		}
	}
</script>

<svelte:head>
	<title>Visits - MediSYNC</title>
	<meta name="description" content="View and manage clinic visit records" />
</svelte:head>

<!-- Modern responsive visits page layout -->
<main class="mx-5 flex w-full max-w-none flex-1 flex-col">
	<div class="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
		<!-- Page Header with Stats -->
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div class="flex flex-col gap-2">
				<h2 class="medical-typography-heading text-xl text-foreground md:text-2xl">
					Visit Records
				</h2>
			</div>
		</div>

		<!-- Search and Filters -->
		<div class="flex flex-col gap-4">
			<!-- Search Bar -->
			<div class="relative">
				<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search visits by student name, ID, visit number, or complaint..."
					bind:value={searchQuery}
					class="pl-10"
					id="searchInput"
					name="searchInput"
				/>
			</div>

			<!-- Filter Controls -->
			<div class="flex flex-wrap gap-3">
				<!-- Visit Type Filter -->
				<Select.Root bind:value={filters.visitType} type="single">
					<Select.Trigger class="w-full md:w-[180px]">
						<Funnel class="mr-2 size-4" />
						{filters.visitType ? toTitleCase(filters.visitType.replace('_', ' ')) : 'Visit Type'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">All Types</Select.Item>
						{#each uniqueVisitTypes as type}
							<Select.Item value={type}>{toTitleCase(type.replace('_', ' '))}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<!-- Status Filter -->
				<Select.Root type="single" bind:value={filters.status}>
					<Select.Trigger class="w-full md:w-[150px]">
						{filters.status ? toTitleCase(filters.status) : 'Status'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">All Status</Select.Item>
						{#each uniqueStatuses as status}
							<Select.Item value={status}>{toTitleCase(status)}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<!-- Severity Filter -->
				<Select.Root type="single" bind:value={filters.severity}>
					<Select.Trigger class="w-full md:w-[150px]">
						{filters.severity ? toTitleCase(filters.severity) : 'Severity'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">All Severities</Select.Item>
						{#each uniqueSeverities as severity}
							<Select.Item value={severity}>{toTitleCase(severity)}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<!-- Grade Filter -->
				<Select.Root type="single" bind:value={filters.grade}>
					<Select.Trigger class="w-full md:w-[150px]">
						{filters.grade ? `${filters.grade} Grade` : 'Grade'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">All Grades</Select.Item>
						{#each uniqueGrades as grade}
							<Select.Item value={grade}>{grade} Grade</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<!-- Date Range Filter -->
				<Select.Root type="single" bind:value={filters.dateRange}>
					<Select.Trigger class="w-full md:w-[150px]">
						<Calendar class="mr-2 size-4" />
						{filters.dateRange
							? filters.dateRange.replace('-', ' ').split(' ').map(toTitleCase).join(' ')
							: 'Date Range'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">All Time</Select.Item>
						<Select.Item value="today">Today</Select.Item>
						<Select.Item value="this-week">This Week</Select.Item>
						<Select.Item value="this-month">This Month</Select.Item>
						<Select.Item value="last-30-days">Last 30 Days</Select.Item>
					</Select.Content>
				</Select.Root>

				<!-- Clear Filters Button -->
				{#if hasActiveFilters}
					<Button variant="outline" onclick={clearFilters} class="w-full md:w-auto">
						<X class="mr-2 size-4" />
						Clear Filters
					</Button>
				{/if}
			</div>

			<!-- Results count and pagination info -->
			<div
				class="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between"
			>
				<div>
					{#if hasActiveFilters}
						Showing {paginationInfo.startIndex}-{paginationInfo.endIndex} of {filteredVisits.length}
						filtered visits (from {visitStats.total} total)
					{:else}
						Showing {paginationInfo.startIndex}-{paginationInfo.endIndex} of {visitStats.total} visits
					{/if}
				</div>

				<div class="flex items-center gap-4">
					{#if paginationInfo.totalPages > 1}
						<div class="text-sm">
							Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
						</div>
					{/if}

					<!-- Items per page selector -->
					<div class="flex items-center gap-2">
						<span class="text-sm">Show:</span>
						<Select.Root bind:value={itemsPerPageStr} type="single">
							<Select.Trigger class="w-20">
								{itemsPerPage}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="10">10</Select.Item>
								<Select.Item value="25">25</Select.Item>
								<Select.Item value="50">50</Select.Item>
								<Select.Item value="100">100</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				</div>
			</div>
		</div>

		<!-- Visits Table -->
		<VisitsTable visits={paginatedVisits} />

		<!-- Empty state for filtered results -->
		{#if paginatedVisits.length === 0 && hasActiveFilters}
			<div class="flex flex-col items-center gap-4 py-8">
				<Search class="size-12 text-muted-foreground/50" />
				<div class="text-center">
					<h3 class="text-lg font-medium">No visits found</h3>
					<p class="text-sm text-muted-foreground">No visits match your current search criteria.</p>
				</div>
				<Button variant="outline" onclick={clearFilters}>
					<X class="mr-2 size-4" />
					Clear Filters
				</Button>
			</div>
		{/if}

		<!-- Pagination -->
		{#if paginationInfo.totalPages > 1}
			<div class="flex items-center justify-between">
				<div class="text-sm text-muted-foreground">
					Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
					({paginationInfo.totalItems}
					{hasActiveFilters ? 'filtered' : 'total'} visits)
				</div>

				<div class="flex items-center gap-2">
					{#if paginationInfo.hasPrev}
						<Button variant="outline" size="sm" onclick={prevPage}>
							<ArrowLeft class="mr-2 size-4" />
							Previous
						</Button>
					{/if}

					<!-- Page numbers for larger screens -->
					<div class="hidden items-center gap-1 md:flex">
						{#each Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
							const totalPages = paginationInfo.totalPages;
							const current = paginationInfo.currentPage;

							if (totalPages <= 5) {
								return i + 1;
							}

							if (current <= 3) {
								return i + 1;
							}

							if (current > totalPages - 3) {
								return totalPages - 4 + i;
							}

							return current - 2 + i;
						}) as pageNum}
							<Button
								variant={pageNum === paginationInfo.currentPage ? 'default' : 'outline'}
								size="sm"
								onclick={() => goToPage(pageNum)}
								class="w-10"
							>
								{pageNum}
							</Button>
						{/each}
					</div>

					{#if paginationInfo.hasNext}
						<Button variant="outline" size="sm" onclick={nextPage}>
							Next
							<ArrowRight class="ml-2 size-4" />
						</Button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</main>
