<script lang="ts">
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { AlertTriangle, ArrowLeft, User } from '@lucide/svelte';
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

	// Calculate visit duration
	const visitDuration = visit.checkOutTime
		? Math.round(
				(new Date(visit.checkOutTime).getTime() - new Date(visit.checkInTime).getTime()) /
					(1000 * 60)
			)
		: Math.round((new Date().getTime() - new Date(visit.checkInTime).getTime()) / (1000 * 60));

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

	// Calculate student age
	const calculateAge = (birthDate: Date | string) => {
		const today = new Date();
		const birth = new Date(birthDate);
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		return age;
	};

	const studentAge = calculateAge(visit.student.dateOfBirth);

	// Format vital signs for display
	const formatVitalSigns = (vitals: any) => {
		if (!vitals) return null;
		return {
			temperature: vitals.temperature ? `${vitals.temperature}°F` : null,
			bloodPressure:
				vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic
					? `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg`
					: null,
			pulse: vitals.pulse ? `${vitals.pulse} bpm` : null,
			respiratoryRate: vitals.respiratoryRate ? `${vitals.respiratoryRate} breaths/min` : null,
			oxygenSaturation: vitals.oxygenSaturation ? `${vitals.oxygenSaturation}%` : null,
			height: vitals.heightCm ? `${vitals.heightCm} cm` : null,
			weight: vitals.weightKg ? `${vitals.weightKg} kg` : null,
			bmi: vitals.bmi ? vitals.bmi.toFixed(1) : null,
			bloodSugar: vitals.bloodSugar ? `${vitals.bloodSugar} mg/dL` : null
		};
	};

	const vitalSigns = formatVitalSigns(visit.vitalSigns);
</script>

<svelte:head>
	<title>Visit Details</title>
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<!-- Page Header -->
	<div class="mb-8 flex items-center justify-between">
		<div class="flex items-center gap-4">
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
			<div>
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Clinic Visit Details</h1>
				<p class="mt-2 text-gray-600 dark:text-gray-400">Visit #{visit.visitNumber}</p>
			</div>
		</div>

		<!-- Status and Emergency Badges -->
		<!-- <div class="flex items-center gap-3">
			{#if visit.isEmergency}
				<Badge variant="destructive" class="flex items-center gap-1">
					<AlertTriangle class="size-3" />
					Emergency
				</Badge>
			{/if}
			<Badge variant={getStatusVariant(visit.status)} class="capitalize">
				{visit.status}
			</Badge>
			<Badge variant={getSeverityVariant(visit.severity)} class="capitalize">
				{visit.severity} Priority
			</Badge>
		</div> -->
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Main Visit Information Card -->
		<div class="lg:col-span-2">
			<Card class="p-6">
				<div class="space-y-6">
					<!-- Visit Header -->
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

						<!-- Symptoms -->
						{#if visit.symptoms}
							<div class="mb-4">
								<div class="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
									Details:
								</div>
								<div class="whitespace-pre-wrap text-gray-900 dark:text-white">
									{visit.symptoms}
								</div>
							</div>
						{/if}

						<!-- Diagnosis -->
						{#if visit.diagnosis}
							<div class="mb-4">
								<div class="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
									Diagnosis:
								</div>
								<div class="text-gray-900 dark:text-white">
									{visit.diagnosis}
								</div>
							</div>
						{/if}

						<!-- Treatment -->
						{#if visit.treatment}
							<div class="mb-4">
								<div class="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
									Treatment:
								</div>
								<div class="whitespace-pre-wrap text-gray-900 dark:text-white">
									{visit.treatment}
								</div>
							</div>
						{/if}

						<!-- Medications Given -->
						{#if visit.medicationGiven || medications.length > 0}
							<div class="mb-4">
								<div class="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
									Medications Given
								</div>
								{#if visit.medicationGiven}
									<ul class="list-inside list-disc space-y-1">
										{#each visit.medicationGiven.split(',') as medication}
											<li class="text-sm text-gray-900 dark:text-white">{medication.trim()}</li>
										{/each}
									</ul>
								{:else if medications.length > 0}
									<ul class="list-inside list-disc space-y-1">
										{#each medications as medication}
											<li class="text-sm text-gray-900 capitalize dark:text-white">{medication}</li>
										{/each}
									</ul>
								{/if}
							</div>
						{/if}

						<!-- Instructions -->
						{#if visit.instructions}
							<div class="mb-4">
								<div class="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
									Instructions:
								</div>
								<div class="whitespace-pre-wrap text-gray-900 dark:text-white">
									{visit.instructions}
								</div>
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

		<!-- Patient Information Sidebar -->
		<div class="lg:col-span-1">
			<div class="space-y-6">
				<!-- Patient Info Card -->
				<Card class="border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/20">
					<CardHeader>
						<CardTitle class="flex items-center gap-2 text-rose-900 dark:text-rose-100">
							<User class="size-5" />
							Patient Information
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<!-- Patient Avatar and Name -->
						<div class="flex items-center space-x-3">
							<Avatar class="h-16 w-16">
								{#if visit.student.profilePicture}
									<AvatarImage
										src={visit.student.profilePicture}
										alt={`${visit.student.firstName} ${visit.student.lastName}`}
									/>
								{/if}
								<AvatarFallback
									class="bg-rose-200 text-rose-800 dark:bg-rose-800 dark:text-rose-200"
								>
									{visit.student.firstName.charAt(0)}{visit.student.lastName.charAt(0)}
								</AvatarFallback>
							</Avatar>
							<div>
								<div class="font-semibold text-rose-900 dark:text-rose-100">
									{visit.student.firstName}
									{visit.student.lastName}
								</div>
								<div class="text-sm text-rose-700 dark:text-rose-300">
									ID: {visit.student.studentId}
								</div>
								<div class="text-sm text-rose-700 dark:text-rose-300">
									Age: {studentAge} years old
								</div>
							</div>
						</div>

						<Separator class="border-rose-200 dark:border-rose-800" />

						<!-- Student Details -->
						<div class="space-y-3">
							<div class="flex justify-between">
								<span class="text-sm text-rose-700 dark:text-rose-300">Grade:</span>
								<span class="text-sm font-medium text-rose-900 dark:text-rose-100">
									{visit.student.grade}{visit.student.section ? ` ${visit.student.section}` : ''}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-sm text-rose-700 dark:text-rose-300">Date of Birth:</span>
								<span class="text-sm font-medium text-rose-900 dark:text-rose-100">
									{new Date(visit.student.dateOfBirth).toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
										year: 'numeric'
									})}
								</span>
							</div>
						</div>

						<Separator class="border-rose-200 dark:border-rose-800" />

						<!-- Visit Timing -->
						<div class="space-y-3">
							<div class="flex justify-between">
								<span class="text-sm text-rose-700 dark:text-rose-300">Visit Date:</span>
								<span class="text-sm font-medium text-rose-900 dark:text-rose-100">
									{formattedDate}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-sm text-rose-700 dark:text-rose-300">Check-in:</span>
								<span class="text-sm font-medium text-rose-900 dark:text-rose-100">
									{formattedTime}
								</span>
							</div>
							{#if checkOutFormatted}
								<div class="flex justify-between">
									<span class="text-sm text-rose-700 dark:text-rose-300">Check-out:</span>
									<span class="text-sm font-medium text-rose-900 dark:text-rose-100">
										{checkOutFormatted}
									</span>
								</div>
							{/if}
						</div>
					</CardContent>
				</Card>

				<!-- Medical History -->
				{#if visit.student.chronicHealthConditions?.length > 0 || visit.student.currentMedications?.length > 0 || visit.student.healthHistory}
					<Card class="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
						<CardHeader>
							<CardTitle class="flex items-center gap-2 text-amber-900 dark:text-amber-100">
								<AlertTriangle class="size-5" />
								Medical History
							</CardTitle>
						</CardHeader>
						<CardContent class="space-y-4">
							{#if visit.student.chronicHealthConditions?.length > 0}
								<div>
									<div class="mb-2 text-sm font-medium text-amber-700 dark:text-amber-300">
										Health Conditions
									</div>
									<ul class="space-y-1">
										{#each visit.student.chronicHealthConditions as condition}
											<li class="text-sm text-amber-900 capitalize dark:text-amber-100">
												• {condition}
											</li>
										{/each}
									</ul>
								</div>
							{/if}

							{#if visit.student.currentMedications?.length > 0}
								<div>
									<div class="mb-2 text-sm font-medium text-amber-700 dark:text-amber-300">
										Current Medications
									</div>
									<ul class="space-y-1">
										{#each visit.student.currentMedications as medication}
											<li class="text-sm text-amber-900 capitalize dark:text-amber-100">
												• {medication}
											</li>
										{/each}
									</ul>
								</div>
							{/if}

							{#if visit.student.healthHistory}
								<div>
									<div class="mb-2 text-sm font-medium text-amber-700 dark:text-amber-300">
										Health History
									</div>
									<div class="text-sm whitespace-pre-wrap text-amber-900 dark:text-amber-100">
										{visit.student.healthHistory}
									</div>
								</div>
							{/if}
						</CardContent>
					</Card>
				{/if}
			</div>
		</div>
	</div>
</div>
