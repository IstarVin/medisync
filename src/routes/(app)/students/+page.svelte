<script lang="ts">
	import { goto } from '$app/navigation';
	import StudentFormModal from '$lib/components/student-form-modal.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { toTitleCase } from '$lib/utils';
	import {
		ArrowLeft,
		ArrowRight,
		Edit,
		Eye,
		Funnel,
		GraduationCap,
		Heart,
		Plus,
		Search,
		X
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	// Props from the load function
	const { data }: { data: PageData } = $props();

	// Types based on database schema
	type StudentStatus = 'active' | 'inactive';

	type FilterOptions = {
		grade: string;
		medicalCondition: string;
		gender: string;
		status: StudentStatus | '';
	};

	type EmergencyContact = {
		id: string;
		name: string;
		relationship: 'parent' | 'guardian' | 'sibling' | 'grandparent' | 'other' | 'adviser';
		phoneNumber: string;
		alternatePhone: string | null;
		email: string | null;
		address: string | null;
		isPrimary: boolean;
		priority: number;
	};

	type Student = {
		id: string;
		studentId: string;
		firstName: string;
		lastName: string;
		middleName: string | null;
		email: string | null;
		dateOfBirth: Date | string;
		gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
		grade: string;
		section: string | null;
		address: string | null;
		chronicHealthConditions: string[];
		currentMedications: string[];
		healthHistory: string | null;
		enrollmentDate: Date | string;
		isActive: boolean;
		emergencyContacts: EmergencyContact[];
	};

	// Client-side reactive state using Svelte 5 runes
	let searchQuery = $state('');
	let studentFormModalOpen = $state(false);
	let modalMode = $state<'add' | 'edit'>('add');
	let selectedStudent = $state<Student | null>(null);
	let selectedEmergencyContacts = $state<EmergencyContact[]>([]);
	let filters = $state<FilterOptions>({
		grade: '',
		medicalCondition: '',
		gender: '',
		status: ''
	});

	// Client-side pagination state
	let currentPage = $state(1);
	let itemsPerPage = $state(25); // Items per page for client-side pagination
	let itemsPerPageStr = $state('25'); // String version for the select component

	// Get data from load function
	let allStudents = $derived(
		data.students.map((student) => ({
			...student,
			dateOfBirth: new Date(student.dateOfBirth),
			enrollmentDate: new Date(student.enrollmentDate)
		}))
	);

	let studentStats = $derived(data.stats);
	let uniqueGrades = $derived(data.filterOptions.grades);
	let uniqueMedicalConditions = $derived(data.filterOptions.medicalConditions);

	// Client-side filtering logic
	let filteredStudents = $derived.by(() => {
		let students = allStudents;

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			students = students.filter(
				(student) =>
					student.firstName.toLowerCase().includes(query) ||
					student.lastName.toLowerCase().includes(query) ||
					student.studentId.toLowerCase().includes(query) ||
					(student.email && student.email.toLowerCase().includes(query))
			);
		}

		// Apply grade filter
		if (filters.grade) {
			students = students.filter((student) => student.grade === filters.grade);
		}

		// Apply medical condition filter
		if (filters.medicalCondition) {
			if (filters.medicalCondition === 'none') {
				students = students.filter((student) => student.chronicHealthConditions.length === 0);
			} else {
				students = students.filter((student) =>
					student.chronicHealthConditions.some((condition) =>
						condition.toLowerCase().includes(filters.medicalCondition.toLowerCase())
					)
				);
			}
		}

		// Apply gender filter
		if (filters.gender) {
			students = students.filter((student) => student.gender === filters.gender);
		}

		// Apply status filter
		if (filters.status) {
			const isActive = filters.status === 'active';
			students = students.filter((student) => student.isActive === isActive);
		}

		return students;
	});

	// Client-side pagination logic
	let paginatedStudents = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredStudents.slice(startIndex, endIndex);
	});

	// Pagination info
	let paginationInfo = $derived.by(() => {
		const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
		return {
			currentPage,
			totalPages,
			totalItems: filteredStudents.length,
			hasNext: currentPage < totalPages,
			hasPrev: currentPage > 1,
			startIndex: (currentPage - 1) * itemsPerPage + 1,
			endIndex: Math.min(currentPage * itemsPerPage, filteredStudents.length)
		};
	});

	// Reset to first page when filters change
	$effect(() => {
		// Watch for changes in search query or filters
		searchQuery;
		filters.grade;
		filters.medicalCondition;
		filters.gender;
		filters.status;

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
			filters.grade ||
			filters.medicalCondition ||
			filters.gender ||
			filters.status
	);

	// Helper functions
	function calculateAge(dateOfBirth: Date): number {
		const today = new Date();
		let age = today.getFullYear() - dateOfBirth.getFullYear();
		const monthDiff = today.getMonth() - dateOfBirth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
			age--;
		}
		return age;
	}

	function formatConditions(conditions: string[]): string {
		conditions = conditions.map(toTitleCase);
		if (conditions.length === 0) return 'None';
		if (conditions.length === 1) return conditions[0];
		return `${conditions[0]} +${conditions.length - 1} more`;
	}

	function getMedicalSeverity(conditions: string[]): 'none' | 'low' | 'medium' | 'high' {
		return 'none';
		// if (conditions.length === 0) return 'none';

		// const highRiskConditions = ['diabetes', 'epilepsy', 'asthma'];
		// const hasHighRisk = conditions.some((condition) =>
		// 	highRiskConditions.some((risk) => condition.toLowerCase().includes(risk))
		// );

		// if (hasHighRisk) return 'high';
		// if (conditions.length > 2) return 'medium';
		// return 'low';
	}

	function clearFilters() {
		searchQuery = '';
		filters = {
			grade: '',
			medicalCondition: '',
			gender: '',
			status: ''
		};
		currentPage = 1;
	}

	function handleAddStudent() {
		modalMode = 'add';
		selectedStudent = null;
		selectedEmergencyContacts = [];
		studentFormModalOpen = true;
	}

	function handleEditStudent(studentId: string) {
		const student = allStudents.find((s) => s.id === studentId);
		if (student) {
			modalMode = 'edit';
			selectedStudent = student;
			selectedEmergencyContacts = student.emergencyContacts || [];
			studentFormModalOpen = true;
		}
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
	<title>Students</title>
	<meta name="description" content="Manage student information and medical records" />
</svelte:head>

<!-- Modern responsive students page layout -->
<main class="mx-5 flex w-full max-w-none flex-1 flex-col">
	<div class="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
		<!-- Page Header with Stats -->
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div class="flex flex-col gap-2">
				<h2 class="medical-typography-heading text-xl text-foreground md:text-2xl">
					Student Management
				</h2>
			</div>

			<Button onclick={handleAddStudent} class="w-full md:w-auto">
				<Plus class="mr-2 size-4" />
				Add Student
			</Button>
		</div>

		<!-- Search and Filters -->
		<div class="flex flex-col gap-4">
			<!-- Search Bar -->
			<div class="relative">
				<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search students by name, ID, or email..."
					bind:value={searchQuery}
					class="pl-10"
					id="searchInput"
					name="searchInput"
				/>
			</div>

			<!-- Filter Controls -->
			<div class="flex flex-wrap gap-3">
				<!-- Grade Filter -->
				<Select.Root bind:value={filters.grade} type="single">
					<Select.Trigger class="w-full md:w-[180px]">
						<Funnel class="mr-2 size-4" />
						{filters.grade ? `${filters.grade} Grade` : 'All Grades'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">All Grades</Select.Item>
						{#each uniqueGrades as grade}
							<Select.Item value={grade}>{grade} Grade</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<!-- Medical Condition Filter -->
				<Select.Root type="single" bind:value={filters.medicalCondition}>
					<Select.Trigger class="w-full md:w-[200px]">
						<Heart class="mr-2 size-4" />
						{filters.medicalCondition || 'Medical Conditions'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">All Conditions</Select.Item>
						<Select.Item value="none">No Conditions</Select.Item>
						{#each uniqueMedicalConditions as condition}
							<Select.Item value={condition}>{toTitleCase(condition)}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<!-- Gender Filter -->
				<Select.Root type="single" bind:value={filters.gender}>
					<Select.Trigger class="w-full md:w-[150px]">
						{filters.gender
							? filters.gender.charAt(0).toUpperCase() + filters.gender.slice(1)
							: 'All Genders'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">All Genders</Select.Item>
						<Select.Item value="male">Male</Select.Item>
						<Select.Item value="female">Female</Select.Item>
						<Select.Item value="other">Other</Select.Item>
						<Select.Item value="prefer_not_to_say">Prefer not to say</Select.Item>
					</Select.Content>
				</Select.Root>

				<!-- Status Filter -->
				<Select.Root type="single" bind:value={filters.status}>
					<Select.Trigger class="w-full md:w-[140px]">
						{filters.status
							? filters.status.charAt(0).toUpperCase() + filters.status.slice(1)
							: 'All Status'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">All Status</Select.Item>
						<Select.Item value="active">Active</Select.Item>
						<Select.Item value="inactive">Inactive</Select.Item>
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
						Showing {paginationInfo.startIndex}-{paginationInfo.endIndex} of {filteredStudents.length}
						filtered students (from {studentStats.total} total)
					{:else}
						Showing {paginationInfo.startIndex}-{paginationInfo.endIndex} of {studentStats.total} students
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

		<!-- Students Table -->
		<div class="rounded-lg border border-border bg-background">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-[200px]">Student</Table.Head>
						<Table.Head class="hidden md:table-cell">ID</Table.Head>
						<Table.Head class="hidden lg:table-cell">Grade</Table.Head>
						<Table.Head class="hidden lg:table-cell">Age</Table.Head>
						<Table.Head>Medical Conditions</Table.Head>
						<Table.Head class="w-[120px]">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#if paginatedStudents.length === 0}
						<Table.Row>
							<Table.Cell colspan={6} class="py-8 text-center">
								{#if hasActiveFilters}
									<div class="flex flex-col items-center gap-2">
										<Search class="size-8 text-muted-foreground" />
										<div class="text-sm text-muted-foreground">
											No students found matching your criteria
										</div>
										<Button variant="outline" onclick={clearFilters} class="mt-2">
											Clear Filters
										</Button>
									</div>
								{:else if allStudents.length === 0}
									<div class="flex flex-col items-center gap-2">
										<GraduationCap class="size-8 text-muted-foreground" />
										<div class="text-sm text-muted-foreground">No students enrolled yet</div>
										<Button onclick={handleAddStudent} class="mt-2">
											<Plus class="mr-2 size-4" />
											Add First Student
										</Button>
									</div>
								{:else}
									<div class="flex flex-col items-center gap-2">
										<Search class="size-8 text-muted-foreground" />
										<div class="text-sm text-muted-foreground">No students match your search</div>
										<Button variant="outline" onclick={clearFilters} class="mt-2">
											Clear Filters
										</Button>
									</div>
								{/if}
							</Table.Cell>
						</Table.Row>
					{:else}
						{#each paginatedStudents as student (student.id)}
							<Table.Row
								class="cursor-pointer hover:bg-muted/50"
								onclick={() => {
									goto('/students/' + student.studentId);
								}}
							>
								<Table.Cell>
									<div class="flex items-center gap-3">
										<div
											class="flex size-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary"
										>
											{student.firstName[0]}{student.lastName[0]}
										</div>
										<div class="flex min-w-0 flex-col">
											<div class="font-medium text-foreground">
												{student.firstName}
												{student.lastName}
											</div>
											<div class="truncate text-sm text-muted-foreground">
												{student.email || 'No email'}
											</div>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell class="hidden font-mono text-sm md:table-cell">
									{student.studentId}
								</Table.Cell>
								<Table.Cell class="hidden lg:table-cell">
									<Badge variant="outline">{student.grade}</Badge>
								</Table.Cell>
								<Table.Cell class="hidden lg:table-cell">
									{calculateAge(student.dateOfBirth)} years
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<Tooltip.Provider delayDuration={300}>
											<Tooltip.Root>
												<Tooltip.Trigger>
													{#if student.chronicHealthConditions.length === 0}
														<Badge variant="secondary">None</Badge>
													{:else}
														<Badge variant="outline" class="flex items-center gap-1">
															{formatConditions(student.chronicHealthConditions)}
														</Badge>
													{/if}</Tooltip.Trigger
												>
												<Tooltip.Content>
													{student.chronicHealthConditions.map(toTitleCase).join(', ')}
												</Tooltip.Content>
											</Tooltip.Root>
										</Tooltip.Provider>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon"
											class="size-8"
											href="/students/{student.studentId}"
										>
											<Eye class="size-4" />
											<span class="sr-only">View student</span>
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onclick={(e) => {
												e.stopPropagation();
												handleEditStudent(student.id);
											}}
											class="size-8"
										>
											<Edit class="size-4" />
											<span class="sr-only">Edit student</span>
										</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					{/if}
				</Table.Body>
			</Table.Root>
		</div>

		<!-- Pagination -->
		{#if paginationInfo.totalPages > 1}
			<div class="flex items-center justify-between">
				<div class="text-sm text-muted-foreground">
					Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
					({paginationInfo.totalItems}
					{hasActiveFilters ? 'filtered' : 'total'} students)
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

<!-- Student Form Modal -->
{#if studentFormModalOpen}
	<StudentFormModal
		bind:open={studentFormModalOpen}
		mode={modalMode}
		student={selectedStudent}
		emergencyContacts={selectedEmergencyContacts}
		availableDoctors={data.availableDoctors}
	/>
{/if}
