<script lang="ts">
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { ArrowLeft } from '@lucide/svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const { visit } = data;

	// Format the check-in date and time
	const visitDate = new Date(visit.checkInTime);
	const formattedDate = visitDate.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
	const formattedTime = visitDate.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	});

	// Format check-out time if available
	const checkOutFormatted = visit.checkOutTime
		? new Date(visit.checkOutTime).toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			})
		: null;

	// Get badge variant based on severity
	const getSeverityVariant = (severity: string) => {
		switch (severity) {
			case 'critical':
				return 'destructive';
			case 'high':
				return 'destructive';
			case 'medium':
				return 'secondary';
			default:
				return 'outline';
		}
	};

	// Get status badge variant
	const getStatusVariant = (status: string) => {
		switch (status) {
			case 'active':
				return 'default';
			case 'completed':
				return 'secondary';
			case 'cancelled':
				return 'outline';
			default:
				return 'outline';
		}
	};

	// Parse medications from the notes if they exist
	const parseMedications = (notes: string | null) => {
		if (!notes) return [];

		// Look for patterns like "Medications Given:" or "Medication:" in the notes
		const medicationSection = notes.match(/(?:medications?\s+given|medication):\s*([^\n]+)/i);
		if (medicationSection) {
			return medicationSection[1]
				.split(',')
				.map((med: string) => med.trim())
				.filter((med: string) => med);
		}

		// Check if medicationGiven field has data
		if (visit.medicationGiven) {
			return visit.medicationGiven
				.split(',')
				.map((med: string) => med.trim())
				.filter((med: string) => med);
		}

		return [];
	};

	const medications = parseMedications(visit.notes);
</script>

<svelte:head>
	<title>Visit Details - MediSYNC</title>
</svelte:head>

<div class="container mx-auto max-w-6xl px-4 py-8">
	<!-- Page Header -->
	<div class="mb-8 flex items-center gap-4">
		<div>
			<Button
				variant="outline"
				size="icon"
				onclick={() => {
					history.back();
				}}
			>
				<ArrowLeft class="size-4" />
				<span class="sr-only">Back</span>
			</Button>
		</div>
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Clinic Visit Details</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">Visit #{visit.visitNumber}</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Main Visit Information -->
		<div class="lg:col-span-2">
			<Card class="p-6">
				<div class="space-y-6">
					<!-- Visit Details Section -->
					<div>
						<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Visit</h3>

						<!-- Reason -->
						<div class="mb-4">
							<div class="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">Reason:</div>
							<div class="text-gray-900 dark:text-white">
								{visit.chiefComplaint || 'No reason specified'}
							</div>
						</div>

						<!-- Details from Notes -->
						{#if visit.notes}
							<div class="mb-4">
								<div class="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
									Details:
								</div>
								<div class="leading-relaxed whitespace-pre-wrap text-gray-900 dark:text-white">
									{visit.notes}
								</div>
							</div>
						{/if}

						<!-- Medications Given -->
						{#if medications.length > 0}
							<div class="mb-4">
								<div class="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
									Medications Given
								</div>
								<ul class="list-inside list-disc space-y-1">
									{#each medications as medication}
										<li class="text-sm text-gray-900 capitalize dark:text-white">{medication}</li>
									{/each}
								</ul>
							</div>
						{/if}

						<!-- Nurse Information -->
						<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
							<div class="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
								{visit.attendedBy.role === 'nurse' ? 'Nurse' : 'Attended by'}:
							</div>
							<div class="text-gray-900 dark:text-white">
								{visit.attendedBy.firstName}
								{visit.attendedBy.lastName}
							</div>
						</div>
					</div>
				</div>
			</Card>
		</div>

		<!-- Patient Information Card -->
		<div class="lg:col-span-1">
			<Card class="border-rose-200 bg-rose-50 p-6 dark:border-rose-800 dark:bg-rose-950/20">
				<div class="space-y-4">
					<h3 class="mb-4 text-lg font-semibold text-rose-900 dark:text-rose-100">Patient</h3>

					<!-- Patient Avatar and Name -->
					<div class="mb-4 flex items-center space-x-3">
						<Avatar class="h-12 w-12">
							{#if visit.student.profilePicture}
								<AvatarImage
									src={visit.student.profilePicture}
									alt={`${visit.student.firstName} ${visit.student.lastName}`}
								/>
							{/if}
							<AvatarFallback class="bg-rose-200 text-rose-800 dark:bg-rose-800 dark:text-rose-200">
								{visit.student.firstName.charAt(0)}{visit.student.lastName.charAt(0)}
							</AvatarFallback>
						</Avatar>
						<div>
							<div class="font-semibold text-rose-900 dark:text-rose-100">
								{visit.student.firstName}
								{visit.student.lastName}
							</div>
							<div class="text-sm text-rose-700 dark:text-rose-300">
								{visit.student.studentId}
							</div>
						</div>
					</div>

					<!-- Student Details -->
					<div class="space-y-2">
						<div class="flex justify-between">
							<span class="text-sm text-rose-700 dark:text-rose-300">Grade:</span>
							<span class="text-sm font-medium text-rose-900 dark:text-rose-100">
								{visit.student.grade}{visit.student.section ? ` ${visit.student.section}` : ''}
							</span>
						</div>
					</div>

					<!-- Visit Timing -->
					<div class="space-y-2 border-t border-rose-200 pt-4 dark:border-rose-800">
						<div class="flex justify-between">
							<span class="text-sm text-rose-700 dark:text-rose-300">Date:</span>
							<span class="text-sm font-medium text-rose-900 dark:text-rose-100"
								>{formattedDate}</span
							>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-rose-700 dark:text-rose-300">Time:</span>
							<span class="text-sm font-medium text-rose-900 dark:text-rose-100"
								>{formattedTime}</span
							>
						</div>
						{#if checkOutFormatted}
							<div class="flex justify-between">
								<span class="text-sm text-rose-700 dark:text-rose-300">Check-out:</span>
								<span class="text-sm font-medium text-rose-900 dark:text-rose-100"
									>{checkOutFormatted}</span
								>
							</div>
						{/if}
					</div>
				</div>
			</Card>
		</div>
	</div>
</div>
