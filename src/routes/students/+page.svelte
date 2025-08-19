<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import {
		AlertCircle,
		Edit,
		Eye,
		Funnel,
		GraduationCap,
		Heart,
		Plus,
		Search,
		UserPlus
	} from '@lucide/svelte';

	// Types based on database schema
	type StudentStatus = 'active' | 'inactive';
	type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

	type Student = {
		id: string;
		studentId: string;
		firstName: string;
		lastName: string;
		email?: string;
		dateOfBirth: Date;
		gender: Gender;
		grade: string;
		section?: string;
		chronicHealthConditions: string[];
		currentMedications: string[];
		enrollmentDate: Date;
		isActive: boolean;
		profilePicture?: string;
	};

	type FilterOptions = {
		grade: string;
		medicalCondition: string;
		gender: string;
		status: StudentStatus | '';
	};

	// Reactive state using Svelte 5 runes
	let searchQuery = $state('');
	let filters = $state<FilterOptions>({
		grade: '',
		medicalCondition: '',
		gender: '',
		status: ''
	});
	let isLoading = $state(false);

	// Sample data - in real app this would come from the database
	let allStudents = $state<Student[]>([
		{
			id: '1',
			studentId: '2023001',
			firstName: 'Ethan',
			lastName: 'Carter',
			email: 'ethan.carter@school.edu',
			dateOfBirth: new Date('2008-03-15'),
			gender: 'male',
			grade: '10th',
			section: 'A',
			chronicHealthConditions: [],
			currentMedications: [],
			enrollmentDate: new Date('2023-08-15'),
			isActive: true
		},
		{
			id: '2',
			studentId: '2023002',
			firstName: 'Olivia',
			lastName: 'Bennett',
			email: 'olivia.bennett@school.edu',
			dateOfBirth: new Date('2007-09-22'),
			gender: 'female',
			grade: '11th',
			section: 'B',
			chronicHealthConditions: ['Allergies (Peanuts)'],
			currentMedications: ['EpiPen'],
			enrollmentDate: new Date('2023-08-15'),
			isActive: true
		},
		{
			id: '3',
			studentId: '2023003',
			firstName: 'Noah',
			lastName: 'Thompson',
			email: 'noah.thompson@school.edu',
			dateOfBirth: new Date('2009-01-10'),
			gender: 'male',
			grade: '9th',
			section: 'A',
			chronicHealthConditions: ['Asthma'],
			currentMedications: ['Albuterol Inhaler'],
			enrollmentDate: new Date('2023-08-15'),
			isActive: true
		},
		{
			id: '4',
			studentId: '2023004',
			firstName: 'Sophia',
			lastName: 'Ramirez',
			email: 'sophia.ramirez@school.edu',
			dateOfBirth: new Date('2006-11-30'),
			gender: 'female',
			grade: '12th',
			section: 'A',
			chronicHealthConditions: ['Type 1 Diabetes'],
			currentMedications: ['Insulin'],
			enrollmentDate: new Date('2023-08-15'),
			isActive: true
		},
		{
			id: '5',
			studentId: '2023005',
			firstName: 'Liam',
			lastName: 'Foster',
			email: 'liam.foster@school.edu',
			dateOfBirth: new Date('2008-07-14'),
			gender: 'male',
			grade: '10th',
			section: 'B',
			chronicHealthConditions: [],
			currentMedications: [],
			enrollmentDate: new Date('2023-08-15'),
			isActive: true
		},
		{
			id: '6',
			studentId: '2023006',
			firstName: 'Ava',
			lastName: 'Mitchell',
			email: 'ava.mitchell@school.edu',
			dateOfBirth: new Date('2007-05-18'),
			gender: 'female',
			grade: '11th',
			section: 'A',
			chronicHealthConditions: ['Allergies (Dairy)'],
			currentMedications: [],
			enrollmentDate: new Date('2023-08-15'),
			isActive: true
		},
		{
			id: '7',
			studentId: '2023007',
			firstName: 'Jackson',
			lastName: 'Hayes',
			email: 'jackson.hayes@school.edu',
			dateOfBirth: new Date('2009-02-25'),
			gender: 'male',
			grade: '9th',
			section: 'C',
			chronicHealthConditions: ['Epilepsy'],
			currentMedications: ['Seizure medication'],
			enrollmentDate: new Date('2023-08-15'),
			isActive: true
		},
		{
			id: '8',
			studentId: '2023008',
			firstName: 'Isabella',
			lastName: 'Coleman',
			email: 'isabella.coleman@school.edu',
			dateOfBirth: new Date('2006-12-03'),
			gender: 'female',
			grade: '12th',
			section: 'B',
			chronicHealthConditions: [],
			currentMedications: [],
			enrollmentDate: new Date('2023-08-15'),
			isActive: true
		},
		{
			id: '9',
			studentId: '2023009',
			firstName: 'Lucas',
			lastName: 'Harper',
			email: 'lucas.harper@school.edu',
			dateOfBirth: new Date('2008-08-17'),
			gender: 'male',
			grade: '10th',
			section: 'A',
			chronicHealthConditions: ['Allergies (Gluten)'],
			currentMedications: [],
			enrollmentDate: new Date('2023-08-15'),
			isActive: true
		},
		{
			id: '10',
			studentId: '2023010',
			firstName: 'Mia',
			lastName: 'Powell',
			email: 'mia.powell@school.edu',
			dateOfBirth: new Date('2007-04-12'),
			gender: 'female',
			grade: '11th',
			section: 'C',
			chronicHealthConditions: [],
			currentMedications: [],
			enrollmentDate: new Date('2023-08-15'),
			isActive: true
		}
	]);

	// Filter and search functionality
	let filteredStudents = $derived.by(() => {
		let result = allStudents;

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(student) =>
					student.firstName.toLowerCase().includes(query) ||
					student.lastName.toLowerCase().includes(query) ||
					student.studentId.toLowerCase().includes(query) ||
					student.email?.toLowerCase().includes(query)
			);
		}

		// Apply grade filter
		if (filters.grade) {
			result = result.filter((student) => student.grade === filters.grade);
		}

		// Apply medical condition filter
		if (filters.medicalCondition) {
			if (filters.medicalCondition === 'none') {
				result = result.filter((student) => student.chronicHealthConditions.length === 0);
			} else {
				result = result.filter((student) =>
					student.chronicHealthConditions.some((condition) =>
						condition.toLowerCase().includes(filters.medicalCondition.toLowerCase())
					)
				);
			}
		}

		// Apply gender filter
		if (filters.gender) {
			result = result.filter((student) => student.gender === filters.gender);
		}

		// Apply status filter
		if (filters.status) {
			result = result.filter((student) =>
				filters.status === 'active' ? student.isActive : !student.isActive
			);
		}

		return result;
	});

	// Get unique values for filter options
	let uniqueGrades = $derived.by(() => {
		const grades = [...new Set(allStudents.map((s) => s.grade))];
		return grades.sort((a, b) => {
			const aNum = parseInt(a);
			const bNum = parseInt(b);
			return aNum - bNum;
		});
	});

	let uniqueMedicalConditions = $derived.by(() => {
		const conditions = new Set<string>();
		allStudents.forEach((student) => {
			student.chronicHealthConditions.forEach((condition) => {
				// Extract the main condition type (e.g., "Allergies" from "Allergies (Peanuts)")
				const mainCondition = condition.split('(')[0].trim();
				conditions.add(mainCondition);
			});
		});
		return Array.from(conditions).sort();
	});

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
		if (conditions.length === 0) return 'None';
		if (conditions.length === 1) return conditions[0];
		return `${conditions[0]} +${conditions.length - 1} more`;
	}

	function getMedicalSeverity(conditions: string[]): 'none' | 'low' | 'medium' | 'high' {
		if (conditions.length === 0) return 'none';

		const highRiskConditions = ['diabetes', 'epilepsy', 'asthma'];
		const hasHighRisk = conditions.some((condition) =>
			highRiskConditions.some((risk) => condition.toLowerCase().includes(risk))
		);

		if (hasHighRisk) return 'high';
		if (conditions.length > 2) return 'medium';
		return 'low';
	}

	function clearFilters() {
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

	// Statistics
	let studentStats = $derived.by(() => ({
		total: allStudents.length,
		active: allStudents.filter((s) => s.isActive).length,
		withMedicalConditions: allStudents.filter((s) => s.chronicHealthConditions.length > 0).length,
		recentlyEnrolled: allStudents.filter((s) => {
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
			return s.enrollmentDate > thirtyDaysAgo;
		}).length
	}));
</script>

<svelte:head>
	<title>Students - MediSYNC</title>
	<meta name="description" content="Manage student information and medical records" />
</svelte:head>

<!-- Modern responsive students page layout -->
<main class="flex w-full max-w-none flex-1 flex-col">
	<div class="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
		<!-- Page Header with Stats -->
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div class="flex flex-col gap-2">
				<h1 class="medical-typography-heading text-2xl text-foreground md:text-3xl">
					Student Management
				</h1>
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
				<Select.Root type="single" bind:value={filters.grade}>
					<Select.Trigger class="w-full md:w-[180px]">
						<Funnel class="mr-2 size-4" />
						All Grades
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
						Medical Conditions
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
				<Select.Root bind:value={filters.gender} type="single">
					<Select.Trigger class="w-full md:w-[150px]">All Genders</Select.Trigger>
					<Select.Content>
						<Select.Item value="">All Genders</Select.Item>
						<Select.Item value="male">Male</Select.Item>
						<Select.Item value="female">Female</Select.Item>
						<Select.Item value="other">Other</Select.Item>
						<Select.Item value="prefer_not_to_say">Prefer not to say</Select.Item>
					</Select.Content>
				</Select.Root>

				<!-- Status Filter -->
				<Select.Root bind:value={filters.status} type="single">
					<Select.Trigger class="w-full md:w-[140px]">All Status</Select.Trigger>
					<Select.Content>
						<Select.Item value="">All Status</Select.Item>
						<Select.Item value="active">Active</Select.Item>
						<Select.Item value="inactive">Inactive</Select.Item>
					</Select.Content>
				</Select.Root>

				<!-- Clear Filters Button -->
				{#if filters.grade || filters.medicalCondition || filters.gender || filters.status}
					<Button variant="outline" onclick={clearFilters} class="w-full md:w-auto">
						Clear Filters
					</Button>
				{/if}
			</div>

			<!-- Results count -->
			<div class="text-sm text-muted-foreground">
				Showing {filteredStudents.length} of {allStudents.length} students
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
					{#if isLoading}
						<Table.Row>
							<Table.Cell colspan={6} class="py-8 text-center">
								<div class="flex items-center justify-center gap-2">
									<div class="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
									Loading students...
								</div>
							</Table.Cell>
						</Table.Row>
					{:else if filteredStudents.length === 0}
						<Table.Row>
							<Table.Cell colspan={6} class="py-8 text-center">
								{#if searchQuery || filters.grade || filters.medicalCondition || filters.gender || filters.status}
									<div class="flex flex-col items-center gap-2">
										<Search class="size-8 text-muted-foreground" />
										<div class="text-sm text-muted-foreground">
											No students found matching your criteria
										</div>
										<Button variant="outline" onclick={clearFilters} class="mt-2">
											Clear Filters
										</Button>
									</div>
								{:else}
									<div class="flex flex-col items-center gap-2">
										<GraduationCap class="size-8 text-muted-foreground" />
										<div class="text-sm text-muted-foreground">No students have been added yet</div>
										<Button onclick={handleAddStudent} class="mt-2">
											<Plus class="mr-2 size-4" />
											Add First Student
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
	</div>
</main>
