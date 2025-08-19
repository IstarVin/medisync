<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { toTitleCase } from '$lib/utils';
	import {
		AlertCircle,
		ArrowLeft,
		ArrowRight,
		Edit,
		Eye,
		Funnel,
		GraduationCap,
		Heart,
		Plus,
		Search,
		UserPlus,
		X
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	// Props from the load function
	const { data }: { data: PageData } = $props();

	// Types based on database schema
	type StudentStatus = 'active' | 'inactive';
	type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

	type Student = {
		id: string;
		studentId: string;
		firstName: string;
		lastName: string;
		email?: string | null;
		dateOfBirth: Date;
		gender: Gender;
		grade: string;
		section?: string | null;
		chronicHealthConditions: string[];
		currentMedications: string[];
		enrollmentDate: Date;
		isActive: boolean;
		profilePicture?: string | null;
	};

	type FilterOptions = {
		grade: string;
		medicalCondition: string;
		gender: string;
		status: StudentStatus | '';
	};

	// Client-side reactive state using Svelte 5 runes
	let searchQuery = $state('');
	let filters = $state<FilterOptions>({
		grade: '',
		medicalCondition: '',
		gender: '',
		status: ''
	});

	// Get data from load function
	let allStudents = $state<Student[]>(
		data.allStudents.map((student) => ({
			...student,
			dateOfBirth: new Date(student.dateOfBirth),
			enrollmentDate: new Date(student.enrollmentDate)
		}))
	);
	let currentPageStudents = $state<Student[]>(
		data.students.map((student) => ({
			...student,
			dateOfBirth: new Date(student.dateOfBirth),
			enrollmentDate: new Date(student.enrollmentDate)
		}))
	);

	let studentStats = $state(data.stats);
	let uniqueGrades = $state(data.filterOptions.grades);
	let uniqueMedicalConditions = $state(data.filterOptions.medicalConditions);
	let pagination = $state(data.pagination);

	// Client-side filtering logic
	let filteredStudents = $derived.by(() => {
		let students = currentPageStudents;

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
	}

	function handleAddStudent() {
		// In real app, this would open a modal or navigate to add student page
		console.log('Add student clicked');
	}

	function handleViewStudent(studentId: string) {
		// In real app, this would navigate to student profile
		console.log('View student:', studentId);
	}

	function handleEditStudent(studentId: string) {
		// In real app, this would open edit modal or navigate to edit page
		console.log('Edit student:', studentId);
	}
</script>

<svelte:head>
	<title>Students - MediSYNC</title>
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
				<div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
					<div class="flex items-center gap-1">
						<GraduationCap class="size-4" />
						<span>{studentStats.total} Total Students</span>
					</div>
					<div class="flex items-center gap-1">
						<Heart class="size-4" />
						<span>{studentStats.withMedicalConditions} With Medical Conditions</span>
					</div>
					<div class="flex items-center gap-1">
						<UserPlus class="size-4" />
						<span>{studentStats.recentlyEnrolled} Recently Enrolled</span>
					</div>
				</div>
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
							<Select.Item value={condition}>{condition}</Select.Item>
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
						Showing {filteredStudents.length} of {currentPageStudents.length} students on this page (filtered
						from {studentStats.total} total)
					{:else}
						Showing {filteredStudents.length} students on page {pagination.page} of {pagination.totalPages}
						({studentStats.total} total)
					{/if}
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
					{#if filteredStudents.length === 0}
						<Table.Row>
							<Table.Cell colspan={6} class="py-8 text-center">
								{#if hasActiveFilters}
									<div class="flex flex-col items-center gap-2">
										<Search class="size-8 text-muted-foreground" />
										<div class="text-sm text-muted-foreground">
											No students found matching your criteria on this page
										</div>
										<Button variant="outline" onclick={clearFilters} class="mt-2">
											Clear Filters
										</Button>
									</div>
								{:else if currentPageStudents.length === 0}
									<div class="flex flex-col items-center gap-2">
										<GraduationCap class="size-8 text-muted-foreground" />
										<div class="text-sm text-muted-foreground">No students on this page</div>
										<Button onclick={handleAddStudent} class="mt-2">
											<Plus class="mr-2 size-4" />
											Add Student
										</Button>
									</div>
								{:else}
									<div class="flex flex-col items-center gap-2">
										<Search class="size-8 text-muted-foreground" />
										<div class="text-sm text-muted-foreground">
											No students match your search on this page
										</div>
										<Button variant="outline" onclick={clearFilters} class="mt-2">
											Clear Filters
										</Button>
									</div>
								{/if}
							</Table.Cell>
						</Table.Row>
					{:else}
						{#each filteredStudents as student (student.id)}
							<Table.Row class="hover:bg-muted/50">
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
										{#if student.chronicHealthConditions.length === 0}
											<Badge variant="secondary">None</Badge>
										{:else}
											{@const severity = getMedicalSeverity(student.chronicHealthConditions)}
											<Badge
												variant={severity === 'high'
													? 'destructive'
													: severity === 'medium'
														? 'default'
														: 'secondary'}
												class="flex items-center gap-1"
											>
												{#if severity === 'high'}
													<AlertCircle class="size-3" />
												{/if}
												{formatConditions(student.chronicHealthConditions)}
											</Badge>
										{/if}
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon"
											onclick={() => handleViewStudent(student.id)}
											class="size-8"
										>
											<Eye class="size-4" />
											<span class="sr-only">View student</span>
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onclick={() => handleEditStudent(student.id)}
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
		{#if !hasActiveFilters && pagination.totalPages > 1}
			<div class="flex items-center justify-between">
				<div class="text-sm text-muted-foreground">
					Page {pagination.page} of {pagination.totalPages}
				</div>

				<div class="flex items-center gap-2">
					{#if pagination.hasPrev}
						<Button variant="outline" size="sm" href="/students/{pagination.page - 1}">
							<ArrowLeft class="mr-2 size-4" />
							Previous
						</Button>
					{/if}

					{#if pagination.hasNext}
						<Button variant="outline" size="sm" href="/students/{pagination.page + 1}">
							Next
							<ArrowRight class="ml-2 size-4" />
						</Button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</main>
