<script lang="ts">
	import { goto } from '$app/navigation';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { toTitleCase } from '$lib/utils';
	import {
		ArrowLeft,
		Clock,
		Edit,
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

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatDateTime(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function getVisitTypeColor(
		visitType: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (visitType) {
			case 'emergency':
				return 'destructive';
			case 'illness':
			case 'injury':
				return 'default';
			case 'checkup':
				return 'secondary';
			default:
				return 'outline';
		}
	}

	function getSeverityColor(severity: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (severity) {
			case 'critical':
			case 'high':
				return 'destructive';
			case 'medium':
				return 'default';
			case 'low':
				return 'secondary';
			default:
				return 'outline';
		}
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
		goto('/students');
	}

	function handleEdit() {
		// Navigate to edit mode - this would typically open the same form modal
		// For now, go back to students list where edit functionality exists
		goto('/students');
	}

	function handleNewVisit() {
		// Navigate to create new clinic visit
		goto(`/visits/new?studentId=${student.id}`);
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
				<Button variant="outline" onclick={handleEdit}>
					<Edit class="mr-2 size-4" />
					Edit Student
				</Button>
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
										{#if contact.isPrimary}
											<Badge variant="default" class="px-1 py-0 text-xs">Primary</Badge>
										{/if}
									</div>
									<div class="space-y-0.5 text-xs text-muted-foreground">
										<div class="capitalize">{contact.relationship}</div>
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
											<Badge variant="secondary" class="text-sm">{medication}</Badge>
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
						{#if recentVisits.length > 0}
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head>Date & Time</Table.Head>
										<Table.Head>Type</Table.Head>
										<Table.Head>Chief Complaint</Table.Head>
										<Table.Head>Severity</Table.Head>
										<Table.Head>Status</Table.Head>
										<Table.Head>Actions</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each recentVisits as visit}
										<Table.Row>
											<Table.Cell class="text-sm">
												{formatDateTime(visit.checkInTime)}
											</Table.Cell>
											<Table.Cell>
												<Badge variant={getVisitTypeColor(visit.visitType)}>
													{toTitleCase(visit.visitType)}
												</Badge>
											</Table.Cell>
											<Table.Cell class="max-w-[250px] text-sm">
												{visit.chiefComplaint}
											</Table.Cell>
											<Table.Cell>
												<Badge variant={getSeverityColor(visit.severity)}>
													{toTitleCase(visit.severity)}
												</Badge>
											</Table.Cell>
											<Table.Cell>
												<Badge variant={visit.status === 'completed' ? 'secondary' : 'default'}>
													{toTitleCase(visit.status)}
												</Badge>
											</Table.Cell>
											<Table.Cell>
												<Button variant="ghost" size="sm" onclick={() => handleViewVisit(visit.id)}>
													View
												</Button>
											</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						{:else}
							<div class="py-12 text-center">
								<Clock class="mx-auto mb-4 size-12 text-muted-foreground/50" />
								<h3 class="mb-2 text-lg font-medium">No clinic visits recorded</h3>
								<p class="mb-4 text-sm text-muted-foreground">
									This student hasn't visited the clinic yet.
								</p>
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
