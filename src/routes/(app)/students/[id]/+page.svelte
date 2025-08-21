<script lang="ts">
	import { goto } from '$app/navigation';
	import NewVisitModal from '$lib/components/new-visit-modal.svelte';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import VisitsTable from '$lib/components/visits-table.svelte';
	import { toTitleCase } from '$lib/utils';
	import {
		ArrowLeft,
		Clock,
		GraduationCap,
		Heart,
		Mail,
		Phone,
		Plus,
		Stethoscope,
		User,
		UserCheck,
		Users
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	// Derived data
	let student = $derived(data.student);
	let emergencyContacts = $derived(data.emergencyContacts);
	let recentVisits = $derived(data.recentVisits);

	// Modal state
	let newVisitModalOpen = $state(false);

	// Helper functions
	function calculateAge(dateOfBirth: string): number {
		const today = new Date();
		const birthDate = new Date(dateOfBirth);
		let age = today.getFullYear() - birthDate.getFullYear();
		const monthDiff = today.getMonth() - birthDate.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
			age--;
		}
		return age;
	}

	function getRelationshipIcon(relationship: string) {
		switch (relationship) {
			case 'parent':
			case 'guardian':
				return Users;
			case 'sibling':
				return User;
			case 'grandparent':
				return UserCheck;
			default:
				return User;
		}
	}

	// Actions
	function handleBack() {
		history.back();
	}

	function handleNewVisit() {
		// Open the new visit modal
		newVisitModalOpen = true;
	}

	function handleViewVisit(visitId: string) {
		// Navigate to visit details
		goto(`/visits/${visitId}`);
	}

	// Get initials for avatar
	let studentInitials = $derived(`${student.firstName[0]}${student.lastName[0]}`.toUpperCase());

	// Primary emergency contact
	let primaryContact = $derived(
		emergencyContacts.find((contact) => contact.isPrimary) || emergencyContacts[0]
	);
</script>

<svelte:head>
	<title>{student.firstName} {student.lastName} - MediSYNC</title>
	<meta name="description" content="Student profile for {student.firstName} {student.lastName}" />
</svelte:head>

<main class="mx-5 flex w-full max-w-none flex-1 flex-col">
	<div class="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
		<!-- Header with navigation -->
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div class="flex items-center gap-4">
				<Button variant="outline" size="icon" onclick={handleBack}>
					<ArrowLeft class="size-4" />
					<span class="sr-only">Back to students</span>
				</Button>
				<div class="flex flex-col gap-1">
					<h1 class="medical-typography-heading text-xl text-foreground md:text-2xl">
						{student.firstName}
						{student.lastName}
					</h1>
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<GraduationCap class="size-4" />
						<span>Student ID: {student.studentId}</span>
						{#if student.grade}
							<span>•</span>
							<span>{student.grade}</span>
						{/if}
						{#if student.section}
							<span>({student.section})</span>
						{/if}
					</div>
				</div>
			</div>

			<div class="flex gap-2">
				<!-- <Button variant="outline" onclick={handleEdit}>
					<Edit class="mr-2 size-4" />
					Edit Student
				</Button> -->
				<Button onclick={handleNewVisit}>
					<Plus class="mr-2 size-4" />
					New Visit
				</Button>
			</div>
		</div>

		<!-- Main content grid -->
		<div class="grid gap-6 lg:grid-cols-4">
			<!-- Left column - Student profile (condensed) -->
			<div class="space-y-6 lg:col-span-1">
				<!-- Basic Information Card (Condensed) -->
				<Card.Root class="gap-3">
					<Card.Header>
						<Card.Title class="flex items-center gap-2 text-lg">
							<User class="size-4" />
							Student Info
						</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<!-- Student photo and basic info -->
						<div class="flex flex-col items-center gap-3">
							<Avatar class="size-16">
								{#if student.profilePicture}
									<AvatarImage
										src={student.profilePicture}
										alt="{student.firstName} {student.lastName}"
									/>
								{/if}
								<AvatarFallback class="text-base font-semibold">
									{studentInitials}
								</AvatarFallback>
							</Avatar>

							<div class="space-y-1 text-center">
								<h3 class="text-sm font-medium">
									{student.firstName}
									{student.lastName}
								</h3>
								<div class="space-y-0.5 text-xs text-muted-foreground">
									<div>ID: {student.studentId}</div>
									<div>{student.grade}{student.section ? ` (${student.section})` : ''}</div>
									<div>{calculateAge(student.dateOfBirth)} years old</div>
									<div>{toTitleCase(student.gender.replace('_', ' '))}</div>
								</div>
							</div>
						</div>

						{#if student.email}
							<div class="flex items-center gap-2 text-xs">
								<Mail class="size-3 text-muted-foreground" />
								<a href="mailto:{student.email}" class="truncate text-primary hover:underline">
									{student.email}
								</a>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>

				<!-- Emergency Contacts (Condensed) -->
				<Card.Root class="gap-0">
					<Card.Header class="pb-4">
						<Card.Title class="flex items-center gap-2 text-lg">
							<Phone class="size-4" />
							Emergency Contacts
						</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						{#if emergencyContacts.length > 0}
							{#each emergencyContacts as contact}
								{@const RelationshipIcon = getRelationshipIcon(contact.relationship)}
								<div class="space-y-1 rounded-md border p-2">
									<div class="flex items-center gap-2">
										<RelationshipIcon class="size-3 text-muted-foreground" />
										<span class="text-xs font-medium">{contact.name}</span>
										<Badge variant="default" class="px-1 py-0 text-xs">
											{toTitleCase(contact.relationship)}
										</Badge>
									</div>
									<div class="space-y-0.5 text-xs text-muted-foreground">
										<!-- <div class="capitalize">{contact.relationship}</div> -->
										<div class="flex items-center gap-1">
											<Phone class="size-2.5" />
											<a href="tel:{contact.phoneNumber}" class="hover:text-foreground">
												{contact.phoneNumber}
											</a>
										</div>
										{#if contact.alternatePhone}
											<div class="flex items-center gap-1">
												<Phone class="size-2.5" />
												<a href="tel:{contact.alternatePhone}" class="hover:text-foreground">
													{contact.alternatePhone} (Alt)
												</a>
											</div>
										{/if}
									</div>
								</div>
							{/each}
						{:else}
							<div class="text-xs text-muted-foreground">No emergency contacts recorded</div>
						{/if}
					</Card.Content>
				</Card.Root>
			</div>

			<!-- Right column - Medical information and visits -->
			<div class="space-y-6 lg:col-span-3">
				<!-- Medical Information Card (Primary Focus) -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="flex items-center gap-2 text-xl">
							<Heart class="size-5" />
							Medical Information
						</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-6">
						<!-- Chronic Health Conditions -->
						<div>
							<h4 class="mb-2 text-sm font-medium text-muted-foreground">
								Chronic Health Conditions
							</h4>
							<div>
								{#if student.chronicHealthConditions.length > 0}
									<div class="flex flex-wrap gap-2">
										{#each student.chronicHealthConditions as condition}
											<Badge variant="outline" class="text-sm">{toTitleCase(condition)}</Badge>
										{/each}
									</div>
								{:else}
									<span class="text-sm text-muted-foreground">
										No chronic health conditions recorded
									</span>
								{/if}
							</div>
						</div>

						<!-- Current Medications -->
						<div>
							<h4 class="mb-2 text-sm font-medium text-muted-foreground">Current Medications</h4>
							<div>
								{#if student.currentMedications.length > 0}
									<div class="flex flex-wrap gap-2">
										{#each student.currentMedications as medication}
											<Badge variant="secondary" class="text-sm">{toTitleCase(medication)}</Badge>
										{/each}
									</div>
								{:else}
									<span class="text-sm text-muted-foreground">No current medications</span>
								{/if}
							</div>
						</div>

						<!-- Health History -->
						{#if student.healthHistory}
							<div>
								<h4 class="mb-2 text-sm font-medium text-muted-foreground">Health History</h4>
								<div class="rounded-md bg-muted/30 p-3 text-sm">{student.healthHistory}</div>
							</div>
						{/if}

						<!-- Assigned Doctor -->
						{#if student.doctorFirstName}
							<Separator />
							<div>
								<h4 class="mb-2 text-sm font-medium text-muted-foreground">Assigned Doctor</h4>
								<div class="flex items-center gap-3">
									<Stethoscope class="size-4 text-muted-foreground" />
									<span class="text-sm font-medium">
										Dr. {student.doctorFirstName}
										{student.doctorLastName}
									</span>
									{#if student.doctorEmail}
										<a href="mailto:{student.doctorEmail}" class="text-primary hover:underline">
											<Mail class="size-4" />
										</a>
									{/if}
								</div>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>

				<!-- Recent Visits (Primary Focus) -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="flex items-center gap-2 text-xl">
							<Clock class="size-5" />
							Recent Clinic Visits
						</Card.Title>
					</Card.Header>
					<Card.Content>
						<VisitsTable
							visits={recentVisits}
							showStudentInfo={false}
							showVisitNumber={false}
							maxHeight="600px"
							emptyStateTitle="No clinic visits recorded"
							emptyStateDescription="This student hasn't visited the clinic yet."
							onViewVisit={handleViewVisit}
						/>

						{#if recentVisits.length === 0}
							<div class="py-4 text-center">
								<Button onclick={handleNewVisit}>
									<Plus class="mr-2 size-4" />
									Record First Visit
								</Button>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</div>
</main>

<!-- New Visit Modal -->
<NewVisitModal bind:open={newVisitModalOpen} {student} availableNurses={data.availableNurses} />
