<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import StudentFormModal from '$lib/components/student-form-modal.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { toTitleCase } from '$lib/utils';
	import {
		ArrowLeft,
		ArrowRight,
		Edit,
		Funnel,
		GraduationCap,
		Heart,
		MoreHorizontal,
		Plus,
		RotateCcw,
		Search,
		Trash,
		Trash2,
		X
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	// Props from the load function
	const { data }: { data: PageData } = $props();

	// Check if current user is admin using page store to access parent layout data
	const isAdmin = $derived($page.data.user?.role === 'admin');

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
	let deleteConfirmOpen = $state(false);
	let studentToDelete = $state<Student | null>(null);
	let isDeleting = $state(false);
	let reactivateConfirmOpen = $state(false);
	let studentToReactivate = $state<Student | null>(null);
	let isReactivating = $state(false);
	let permanentDeleteConfirmOpen = $state(false);
	let studentToPermanentDelete = $state<Student | null>(null);
	let isPermanentDeleting = $state(false);
	let filters = $state<FilterOptions>({
		grade: '',
		medicalCondition: '',
		gender: '',
		status: 'active'
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

	function handleDeleteStudent(studentId: string) {
		const student = allStudents.find((s) => s.id === studentId);
		if (student) {
			studentToDelete = student;
			deleteConfirmOpen = true;
		}
	}

	function cancelDeleteStudent() {
		deleteConfirmOpen = false;
		studentToDelete = null;
	}

	function handleReactivateStudent(studentId: string) {
		const student = allStudents.find((s) => s.id === studentId);
		if (student) {
			studentToReactivate = student;
			reactivateConfirmOpen = true;
		}
	}

	function cancelReactivateStudent() {
		reactivateConfirmOpen = false;
		studentToReactivate = null;
	}

	function handlePermanentDeleteStudent(studentId: string) {
		const student = allStudents.find((s) => s.id === studentId);
		if (student) {
			studentToPermanentDelete = student;
			permanentDeleteConfirmOpen = true;
		}
	}

	function cancelPermanentDeleteStudent() {
		permanentDeleteConfirmOpen = false;
		studentToPermanentDelete = null;
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

			{#if isAdmin}
				<Button onclick={handleAddStudent} class="w-full md:w-auto">
					<Plus class="mr-2 size-4" />
					Add Student
				</Button>
			{/if}
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
						<Table.Head class="hidden xl:table-cell">Status</Table.Head>
						<Table.Head>Medical Conditions</Table.Head>
						{#if isAdmin}
							<Table.Head class="w-[50px]"></Table.Head>
						{/if}
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#if paginatedStudents.length === 0}
						<Table.Row>
							<Table.Cell colspan={isAdmin ? 7 : 6} class="py-8 text-center">
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
										{#if isAdmin}
											<Button onclick={handleAddStudent} class="mt-2">
												<Plus class="mr-2 size-4" />
												Add First Student
											</Button>
										{/if}
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
										<div class="relative size-10">
											{#if student.profileUrl}
												<img
													src={student.profileUrl}
													alt="{student.firstName} {student.lastName}"
													class="size-10 rounded-full object-cover"
													onerror={(e) => {
														const target = e.target as HTMLImageElement;
														const fallback = target?.nextElementSibling as HTMLElement;
														if (target && fallback) {
															target.style.display = 'none';
															fallback.style.display = 'flex';
														}
													}}
												/>
												<div
													class="hidden size-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary"
												>
													{student.firstName[0]}{student.lastName[0]}
												</div>
											{:else}
												<div
													class="flex size-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary"
												>
													{student.firstName[0]}{student.lastName[0]}
												</div>
											{/if}
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
								<Table.Cell class="hidden xl:table-cell">
									<Badge variant={student.isActive ? 'default' : 'secondary'}>
										{student.isActive ? 'Active' : 'Inactive'}
									</Badge>
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
									{#if isAdmin}
										<DropdownMenu.Root>
											<DropdownMenu.Trigger>
												<Button variant="ghost" size="sm" class="size-8 p-0">
													<MoreHorizontal class="size-4" />
													<span class="sr-only">Actions</span>
												</Button>
											</DropdownMenu.Trigger>
											<DropdownMenu.Content align="end">
												<!-- <DropdownMenu.Item
													class="cursor-pointer"
													onclick={(e) => {
														e.stopPropagation();
														goto('/students/' + student.studentId);
													}}
												>
													<Eye class="mr-2 size-4" />
													View
												</DropdownMenu.Item> -->
												<DropdownMenu.Item
													class="cursor-pointer"
													onclick={(e) => {
														e.stopPropagation();
														handleEditStudent(student.id);
													}}
												>
													<Edit class="mr-2 size-4" />
													Edit
												</DropdownMenu.Item>
												{#if student.isActive}
													<DropdownMenu.Item
														onclick={(e) => {
															e.stopPropagation();
															handleDeleteStudent(student.id);
														}}
														class="cursor-pointer text-red-600"
													>
														<Trash2 class="mr-2 size-4" />
														Deactivate
													</DropdownMenu.Item>
												{:else}
													<DropdownMenu.Item
														onclick={(e) => {
															e.stopPropagation();
															handleReactivateStudent(student.id);
														}}
														class="cursor-pointer text-green-600"
													>
														<RotateCcw class="mr-2 size-4" />
														Reactivate
													</DropdownMenu.Item>
													<DropdownMenu.Item
														onclick={(e) => {
															e.stopPropagation();
															handlePermanentDeleteStudent(student.id);
														}}
														class="cursor-pointer text-red-600"
													>
														<Trash class="mr-2 size-4" />
														Delete Permanently
													</DropdownMenu.Item>
												{/if}
											</DropdownMenu.Content>
										</DropdownMenu.Root>
									{:else}
										<span class="text-sm text-muted-foreground">-</span>
									{/if}
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

<!-- Delete Confirmation Dialog -->
{#if deleteConfirmOpen && studentToDelete}
	<Dialog.Root bind:open={deleteConfirmOpen}>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title class="flex items-center gap-2 text-destructive">
					<Trash2 class="size-5" />
					Delete Student
				</Dialog.Title>
				<Dialog.Description>
					Are you sure you want to delete <span class="font-semibold"
						>{studentToDelete.firstName} {studentToDelete.lastName}</span
					>?
				</Dialog.Description>
			</Dialog.Header>

			<div class="rounded-lg bg-muted/50 p-4">
				<div class="text-sm text-muted-foreground">
					<p class="mb-2">
						<strong>Important:</strong> This action cannot be undone.
					</p>
					<ul class="list-disc space-y-1 pl-4">
						<li>
							If the student has clinic visit records, they will be deactivated instead of deleted
						</li>
						<li>If the student has no visit history, they will be permanently removed</li>
						<li>All emergency contacts will be removed</li>
					</ul>
				</div>
			</div>

			<Dialog.Footer class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
				<Button variant="outline" onclick={cancelDeleteStudent} disabled={isDeleting}>
					Cancel
				</Button>
				<form
					method="POST"
					action="?/deleteStudent"
					class="contents"
					use:enhance={() => {
						isDeleting = true;
						return async ({ result, update }) => {
							if (result.type === 'success') {
								toast.success('Student archived successfully', {
									description: `${studentToDelete?.firstName} ${studentToDelete?.lastName} has been moved to archived students.`
								});
								deleteConfirmOpen = false;
								studentToDelete = null;
								await update();
							} else if (result.type === 'failure') {
								toast.error('Failed to archive student', {
									description: 'There was an error archiving the student. Please try again.'
								});
							} else if (result.type === 'error') {
								toast.error('Error archiving student', {
									description: 'An unexpected error occurred. Please try again.'
								});
							}
							isDeleting = false;
						};
					}}
				>
					<input type="hidden" name="studentId" value={studentToDelete.id} />
					<Button type="submit" variant="destructive" disabled={isDeleting}>
						{#if isDeleting}
							<div class="flex items-center gap-2">
								<div
									class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
								></div>
								Deleting...
							</div>
						{:else}
							Delete Student
						{/if}
					</Button>
				</form>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}

<!-- Reactivate Confirmation Dialog -->
{#if reactivateConfirmOpen && studentToReactivate}
	<Dialog.Root bind:open={reactivateConfirmOpen}>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title class="flex items-center gap-2 text-green-600 dark:text-green-400">
					<RotateCcw class="size-5" />
					Reactivate Student
				</Dialog.Title>
				<Dialog.Description>
					Are you sure you want to reactivate <span class="font-semibold"
						>{studentToReactivate.firstName} {studentToReactivate.lastName}</span
					>?
				</Dialog.Description>
			</Dialog.Header>

			<div class="rounded-lg bg-muted/50 p-4">
				<div class="text-sm text-muted-foreground">
					<p class="mb-2">
						<strong>What happens when you reactivate:</strong>
					</p>
					<ul class="list-disc space-y-1 pl-4">
						<li>The student will become active and visible in the system</li>
						<li>They will be able to check in to the clinic again</li>
						<li>All their previous medical history and emergency contacts will remain intact</li>
						<li>QR code scanning will work for this student</li>
					</ul>
				</div>
			</div>

			<Dialog.Footer class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
				<Button variant="outline" onclick={cancelReactivateStudent} disabled={isReactivating}>
					Cancel
				</Button>
				<form
					method="POST"
					action="?/reactivateStudent"
					class="contents"
					use:enhance={() => {
						isReactivating = true;
						return async ({ result, update }) => {
							if (result.type === 'success') {
								toast.success('Student reactivated successfully', {
									description: `${studentToReactivate?.firstName} ${studentToReactivate?.lastName} has been reactivated and is now visible in the active students list.`
								});
								reactivateConfirmOpen = false;
								studentToReactivate = null;
								await update();
							} else if (result.type === 'failure') {
								toast.error('Failed to reactivate student', {
									description: 'There was an error reactivating the student. Please try again.'
								});
							} else if (result.type === 'error') {
								toast.error('Error reactivating student', {
									description: 'An unexpected error occurred. Please try again.'
								});
							}
							isReactivating = false;
						};
					}}
				>
					<input type="hidden" name="studentId" value={studentToReactivate.id} />
					<Button
						type="submit"
						variant="default"
						disabled={isReactivating}
						class="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
					>
						{#if isReactivating}
							<div class="flex items-center gap-2">
								<div
									class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
								></div>
								Reactivating...
							</div>
						{:else}
							Reactivate Student
						{/if}
					</Button>
				</form>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}

<!-- Permanent Delete Confirmation Dialog -->
{#if permanentDeleteConfirmOpen && studentToPermanentDelete}
	<Dialog.Root bind:open={permanentDeleteConfirmOpen}>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title class="flex items-center gap-2 text-red-700 dark:text-red-400">
					<Trash class="size-5" />
					Permanently Delete Student
				</Dialog.Title>
				<Dialog.Description>
					Are you sure you want to permanently delete <span class="font-semibold"
						>{studentToPermanentDelete.firstName} {studentToPermanentDelete.lastName}</span
					>?
				</Dialog.Description>
			</Dialog.Header>

			<div
				class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
			>
				<div class="text-sm text-red-800 dark:text-red-200">
					<p class="mb-2 font-semibold">⚠️ WARNING: This action is irreversible!</p>
					<ul class="list-disc space-y-1 pl-4">
						<li>The student will be permanently removed from the database</li>
						<li>All emergency contacts will be deleted</li>
						<li>All historical clinic visit records will be lost</li>
						<li>QR codes associated with this student will no longer work</li>
						<li>This data cannot be recovered</li>
					</ul>
				</div>
			</div>

			<Dialog.Footer class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
				<Button
					variant="outline"
					onclick={cancelPermanentDeleteStudent}
					disabled={isPermanentDeleting}
				>
					Cancel
				</Button>
				<form
					method="POST"
					action="?/permanentDeleteStudent"
					class="contents"
					use:enhance={() => {
						isPermanentDeleting = true;
						return async ({ result, update }) => {
							if (result.type === 'success') {
								toast.success('Student permanently deleted', {
									description: `${studentToPermanentDelete?.firstName} ${studentToPermanentDelete?.lastName} has been permanently removed from the system.`
								});
								permanentDeleteConfirmOpen = false;
								studentToPermanentDelete = null;
								await update();
							} else if (result.type === 'failure') {
								toast.error('Failed to delete student permanently', {
									description:
										'There was an error permanently deleting the student. Please try again.'
								});
							} else if (result.type === 'error') {
								toast.error('Error deleting student permanently', {
									description: 'An unexpected error occurred. Please try again.'
								});
							}
							isPermanentDeleting = false;
						};
					}}
				>
					<input type="hidden" name="studentId" value={studentToPermanentDelete.id} />
					<Button
						type="submit"
						variant="destructive"
						disabled={isPermanentDeleting}
						class="bg-red-700 hover:bg-red-800 dark:bg-red-700 dark:hover:bg-red-800"
					>
						{#if isPermanentDeleting}
							<div class="flex items-center gap-2">
								<div
									class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
								></div>
								Deleting...
							</div>
						{:else}
							Permanently Delete
						{/if}
					</Button>
				</form>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
