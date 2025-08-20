<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { cn, toTitleCase } from '$lib/utils.js';
	import { DateFormatter, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { CalendarIcon, Loader2 } from '@lucide/svelte';

	// Props
	let {
		open = $bindable(false)
	}: {
		open?: boolean;
	} = $props();

	// Form state
	let submitting = $state(false);
	let errors = $state<Record<string, string[]>>({});

	// Grade options
	const gradeOptions = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

	// Relationship options
	const relationshipOptions = [
		{ value: 'parent', label: 'Parent' },
		{ value: 'guardian', label: 'Guardian' },
		{ value: 'sibling', label: 'Sibling' },
		{ value: 'grandparent', label: 'Grandparent' },
		{ value: 'other', label: 'Other' }
	];

	// Gender options
	const genderOptions = [
		{ value: 'male', label: 'Male' },
		{ value: 'female', label: 'Female' },
		{ value: 'other', label: 'Other' },
		{ value: 'prefer_not_to_say', label: 'Prefer not to say' }
	];

	// Form values
	let formData = $state({
		studentId: '',
		firstName: '',
		lastName: '',
		middleName: '',
		email: '',
		dateOfBirth: '',
		gender: '',
		grade: '',
		section: '',
		address: '',
		chronicHealthConditions: '',
		currentMedications: '',
		healthHistory: '',
		emergencyContactName: '',
		emergencyContactRelationship: '',
		emergencyContactPhone: '',
		emergencyContactAlternatePhone: '',
		emergencyContactEmail: '',
		emergencyContactAddress: ''
	});

	// Calendar state for date of birth
	let dateOfBirth = $state<DateValue>();

	// Date formatter
	const df = new DateFormatter('en-US', {
		dateStyle: 'medium'
	});

	// Convert calendar date to string for form submission
	$effect(() => {
		if (dateOfBirth) {
			formData.dateOfBirth = `${dateOfBirth.year}-${String(dateOfBirth.month).padStart(2, '0')}-${String(dateOfBirth.day).padStart(2, '0')}`;
		}
	});

	// Close dialog when clicking outside or escape
	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
		if (!isOpen) {
			// Reset form when dialog closes
			resetForm();
		}
	}

	function resetForm() {
		formData = {
			studentId: '',
			firstName: '',
			lastName: '',
			middleName: '',
			email: '',
			dateOfBirth: '',
			gender: '',
			grade: '',
			section: '',
			address: '',
			chronicHealthConditions: '',
			currentMedications: '',
			healthHistory: '',
			emergencyContactName: '',
			emergencyContactRelationship: '',
			emergencyContactPhone: '',
			emergencyContactAlternatePhone: '',
			emergencyContactEmail: '',
			emergencyContactAddress: ''
		};
		dateOfBirth = undefined;
		errors = {};
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="flex max-h-[90vh] flex-col overflow-hidden" style="max-width: 768px;">
		<Dialog.Header>
			<Dialog.Title>Add New Student</Dialog.Title>
			<Dialog.Description>
				Enter the student's information and emergency contact details.
			</Dialog.Description>
		</Dialog.Header>

		<div class="flex-1 overflow-y-auto pr-2">
			<form
				method="POST"
				action="?/addStudent"
				use:enhance={() => {
					submitting = true;
					return async ({ result }) => {
						submitting = false;

						if (result.type === 'failure') {
							errors = (result.data?.errors as any) || {};
						} else if (result.type === 'success') {
							await invalidate('app:students');
							open = false;
							// Optionally show success message
						}
					};
				}}
				class="w-full space-y-6"
			>
				<!-- Personal Information Section -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold">Personal Information</h3>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<!-- Student ID -->
						<div class="space-y-2">
							<Label for="studentId">Student ID *</Label>
							<Input
								id="studentId"
								name="studentId"
								bind:value={formData.studentId}
								placeholder="Enter student ID"
								class="w-full"
								required
							/>
							{#if errors.studentId}
								<p class="text-sm text-destructive">{errors.studentId[0]}</p>
							{/if}
						</div>

						<!-- Grade -->
						<div class="space-y-2">
							<Label>Grade *</Label>
							<Select.Root bind:value={formData.grade} type="single">
								<Select.Trigger class="w-full">
									{formData.grade ? formData.grade : 'Select grade'}
								</Select.Trigger>
								<Select.Content>
									{#each gradeOptions as grade}
										<Select.Item value={grade}>{grade}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<input type="hidden" name="grade" bind:value={formData.grade} />
							{#if errors.grade}
								<p class="text-sm text-destructive">{errors.grade[0]}</p>
							{/if}
						</div>

						<!-- First Name -->
						<div class="space-y-2">
							<Label for="firstName">First Name *</Label>
							<Input
								id="firstName"
								name="firstName"
								bind:value={formData.firstName}
								placeholder="Enter first name"
								class="w-full"
								required
							/>
							{#if errors.firstName}
								<p class="text-sm text-destructive">{errors.firstName[0]}</p>
							{/if}
						</div>

						<!-- Last Name -->
						<div class="space-y-2">
							<Label for="lastName">Last Name *</Label>
							<Input
								id="lastName"
								name="lastName"
								bind:value={formData.lastName}
								placeholder="Enter last name"
								class="w-full"
								required
							/>
							{#if errors.lastName}
								<p class="text-sm text-destructive">{errors.lastName[0]}</p>
							{/if}
						</div>

						<!-- Middle Name -->
						<div class="space-y-2">
							<Label for="middleName">Middle Name</Label>
							<Input
								id="middleName"
								name="middleName"
								bind:value={formData.middleName}
								placeholder="Enter middle name (optional)"
								class="w-full"
							/>
							{#if errors.middleName}
								<p class="text-sm text-destructive">{errors.middleName[0]}</p>
							{/if}
						</div>

						<!-- Section -->
						<div class="space-y-2">
							<Label for="section">Section</Label>
							<Input
								id="section"
								name="section"
								bind:value={formData.section}
								placeholder="Enter section (optional)"
								class="w-full"
							/>
							{#if errors.section}
								<p class="text-sm text-destructive">{errors.section[0]}</p>
							{/if}
						</div>

						<!-- Email -->
						<div class="space-y-2">
							<Label for="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								bind:value={formData.email}
								placeholder="Enter email (optional)"
								class="w-full"
								autocomplete="email"
							/>
							{#if errors.email}
								<p class="text-sm text-destructive">{errors.email[0]}</p>
							{/if}
						</div>

						<!-- Date of Birth -->
						<div class="space-y-2">
							<Label>Date of Birth *</Label>
							<Popover.Root>
								<Popover.Trigger class="w-full justify-start">
									{#snippet child({ props })}
										<Button
											variant="outline"
											class={cn(
												'w-full justify-start text-left font-normal',
												!dateOfBirth && 'text-muted-foreground'
											)}
											{...props}
										>
											<CalendarIcon class="mr-2 size-4" />
											{dateOfBirth
												? df.format(dateOfBirth.toDate(getLocalTimeZone()))
												: 'Select date of birth'}
										</Button>
									{/snippet}
								</Popover.Trigger>
								<Popover.Content class="w-auto p-0">
									<Calendar
										type="single"
										bind:value={dateOfBirth}
										maxValue={today(getLocalTimeZone())}
										initialFocus
										captionLayout="dropdown"
									/>
								</Popover.Content>
							</Popover.Root>
							<input type="hidden" name="dateOfBirth" bind:value={formData.dateOfBirth} required />
							{#if errors.dateOfBirth}
								<p class="text-sm text-destructive">{errors.dateOfBirth[0]}</p>
							{/if}
						</div>

						<!-- Gender -->
						<div class="space-y-2 md:col-span-2">
							<Label>Gender *</Label>
							<Select.Root bind:value={formData.gender} type="single">
								<Select.Trigger class="w-full">
									{formData.gender ? toTitleCase(formData.gender) : 'Select gender'}
								</Select.Trigger>
								<Select.Content>
									{#each genderOptions as gender}
										<Select.Item value={gender.value}>{gender.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<input type="hidden" name="gender" bind:value={formData.gender} />
							{#if errors.gender}
								<p class="text-sm text-destructive">{errors.gender[0]}</p>
							{/if}
						</div>
					</div>

					<!-- Address -->
					<div class="space-y-2">
						<Label for="address">Address</Label>
						<Textarea
							id="address"
							name="address"
							bind:value={formData.address}
							placeholder="Enter full address (optional)"
							class="w-full"
							rows={2}
							autocomplete="address-line1"
						/>
						{#if errors.address}
							<p class="text-sm text-destructive">{errors.address[0]}</p>
						{/if}
					</div>
				</div>

				<!-- Medical Information Section -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold">Medical Information</h3>

					<!-- Chronic Health Conditions -->
					<div class="space-y-2">
						<Label for="chronicHealthConditions">Chronic Health Conditions</Label>
						<Textarea
							id="chronicHealthConditions"
							name="chronicHealthConditions"
							bind:value={formData.chronicHealthConditions}
							placeholder="Enter any chronic health conditions (e.g., asthma, diabetes, allergies)"
							class="w-full"
							rows={2}
						/>
						<p class="text-sm text-muted-foreground">
							List any ongoing medical conditions, allergies, or health concerns.
						</p>
						{#if errors.chronicHealthConditions}
							<p class="text-sm text-destructive">{errors.chronicHealthConditions[0]}</p>
						{/if}
					</div>

					<!-- Current Medications -->
					<div class="space-y-2">
						<Label for="currentMedications">Current Medications</Label>
						<Textarea
							id="currentMedications"
							name="currentMedications"
							bind:value={formData.currentMedications}
							placeholder="Enter current medications and dosages"
							class="w-full"
							rows={2}
						/>
						<p class="text-sm text-muted-foreground">
							Include medication names, dosages, and frequency.
						</p>
						{#if errors.currentMedications}
							<p class="text-sm text-destructive">{errors.currentMedications[0]}</p>
						{/if}
					</div>

					<!-- Health History -->
					<div class="space-y-2">
						<Label for="healthHistory">Health History</Label>
						<Textarea
							id="healthHistory"
							name="healthHistory"
							bind:value={formData.healthHistory}
							placeholder="Enter any additional health history or notes"
							class="w-full"
							rows={3}
						/>
						<p class="text-sm text-muted-foreground">
							Any additional medical history, previous surgeries, or special care instructions.
						</p>
						{#if errors.healthHistory}
							<p class="text-sm text-destructive">{errors.healthHistory[0]}</p>
						{/if}
					</div>
				</div>

				<!-- Emergency Contact Section -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold">Emergency Contact</h3>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<!-- Emergency Contact Name -->
						<div class="space-y-2">
							<Label for="emergencyContactName">Contact Name *</Label>
							<Input
								id="emergencyContactName"
								name="emergencyContactName"
								bind:value={formData.emergencyContactName}
								placeholder="Enter emergency contact name"
								class="w-full"
								required
							/>
							{#if errors.emergencyContactName}
								<p class="text-sm text-destructive">{errors.emergencyContactName[0]}</p>
							{/if}
						</div>

						<!-- Emergency Contact Relationship -->
						<div class="space-y-2">
							<Label>Relationship *</Label>
							<Select.Root bind:value={formData.emergencyContactRelationship} type="single">
								<Select.Trigger class="w-full">
									{formData.emergencyContactRelationship
										? toTitleCase(formData.emergencyContactRelationship)
										: 'Select relationship'}
								</Select.Trigger>
								<Select.Content>
									{#each relationshipOptions as relationship}
										<Select.Item value={relationship.value}>{relationship.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<input
								type="hidden"
								name="emergencyContactRelationship"
								bind:value={formData.emergencyContactRelationship}
							/>
							{#if errors.emergencyContactRelationship}
								<p class="text-sm text-destructive">{errors.emergencyContactRelationship[0]}</p>
							{/if}
						</div>
						<!-- Emergency Contact Phone -->
						<div class="space-y-2">
							<Label for="emergencyContactPhone">Phone Number *</Label>
							<Input
								id="emergencyContactPhone"
								name="emergencyContactPhone"
								type="tel"
								bind:value={formData.emergencyContactPhone}
								placeholder="Enter phone number"
								class="w-full"
								required
							/>
							{#if errors.emergencyContactPhone}
								<p class="text-sm text-destructive">{errors.emergencyContactPhone[0]}</p>
							{/if}
						</div>

						<!-- Emergency Contact Alternate Phone -->
						<div class="space-y-2">
							<Label for="emergencyContactAlternatePhone">Alternate Phone</Label>
							<Input
								id="emergencyContactAlternatePhone"
								name="emergencyContactAlternatePhone"
								type="tel"
								bind:value={formData.emergencyContactAlternatePhone}
								placeholder="Enter alternate phone (optional)"
								class="w-full"
							/>
							{#if errors.emergencyContactAlternatePhone}
								<p class="text-sm text-destructive">{errors.emergencyContactAlternatePhone[0]}</p>
							{/if}
						</div>

						<!-- Emergency Contact Email -->
						<div class="space-y-2 md:col-span-2">
							<Label for="emergencyContactEmail">Email</Label>
							<Input
								id="emergencyContactEmail"
								name="emergencyContactEmail"
								type="email"
								bind:value={formData.emergencyContactEmail}
								placeholder="Enter email (optional)"
								class="w-full"
							/>
							{#if errors.emergencyContactEmail}
								<p class="text-sm text-destructive">{errors.emergencyContactEmail[0]}</p>
							{/if}
						</div>
					</div>

					<!-- Emergency Contact Address -->
					<div class="space-y-2">
						<Label for="emergencyContactAddress">Contact Address</Label>
						<Textarea
							id="emergencyContactAddress"
							name="emergencyContactAddress"
							bind:value={formData.emergencyContactAddress}
							placeholder="Enter emergency contact address (optional)"
							class="w-full"
							rows={2}
						/>
						{#if errors.emergencyContactAddress}
							<p class="text-sm text-destructive">{errors.emergencyContactAddress[0]}</p>
						{/if}
					</div>
				</div>

				<Dialog.Footer class="border-t pt-4">
					<Button
						type="button"
						variant="outline"
						onclick={() => (open = false)}
						disabled={submitting}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={submitting} class="min-w-[100px]">
						{#if submitting}
							<Loader2 class="mr-2 size-4 animate-spin" />
							Adding...
						{:else}
							Add Student
						{/if}
					</Button>
				</Dialog.Footer>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>
