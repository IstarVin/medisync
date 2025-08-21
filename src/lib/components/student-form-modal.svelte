<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import type { NurseComboboxOption } from '$lib/types/nurse.js';
	import { cn, toTitleCase } from '$lib/utils.js';
	import {
		CalendarDate,
		DateFormatter,
		getLocalTimeZone,
		today,
		type DateValue
	} from '@internationalized/date';
	import { CalendarIcon, Check, ChevronsUpDown, Loader2, Plus, Trash2 } from '@lucide/svelte';
	import { onMount, tick } from 'svelte';

	// Types
	type EmergencyContact = {
		id?: string;
		name: string;
		relationship: 'parent' | 'guardian' | 'sibling' | 'grandparent' | 'other' | 'adviser';
		phoneNumber: string;
		alternatePhone?: string | null;
		email?: string | null;
		address?: string | null;
		isPrimary?: boolean;
		priority?: number;
	};

	type Student = {
		id?: string;
		studentId: string;
		firstName: string;
		lastName: string;
		middleName?: string | null;
		email?: string | null;
		dateOfBirth: Date | string;
		gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
		grade: string;
		section?: string | null;
		address?: string | null;
		chronicHealthConditions: string[];
		currentMedications: string[];
		healthHistory?: string | null;
		doctorId?: string | null;
		emergencyContacts?: EmergencyContact[];
	};

	// Props
	let {
		open = $bindable(false),
		mode = 'add',
		student = null,
		emergencyContacts = [],
		availableDoctors = []
	}: {
		open?: boolean;
		mode?: 'add' | 'edit';
		student?: Student | null;
		emergencyContacts?: EmergencyContact[];
		availableDoctors?: NurseComboboxOption[];
	} = $props();

	// Form state
	let submitting = $state(false);
	let errors = $state<Record<string, string[]>>({});

	// Emergency contacts management
	let emergencyContactsState = $state<EmergencyContact[]>([]);

	// Doctor combobox state
	let doctorComboboxOpen = $state(false);
	let doctorTriggerRef = $state<HTMLButtonElement>(null!);

	const selectedDoctor = $derived(
		availableDoctors.find((doctor) => doctor.id === formData.doctorId)?.name
	);

	// Close combobox and refocus trigger
	function closeDoctorComboboxAndFocusTrigger() {
		doctorComboboxOpen = false;
		tick().then(() => {
			doctorTriggerRef.focus();
		});
	}

	// Grade options
	const gradeOptions = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

	// Relationship options
	const relationshipOptions = [
		{ value: 'parent', label: 'Parent' },
		{ value: 'guardian', label: 'Guardian' },
		{ value: 'sibling', label: 'Sibling' },
		{ value: 'grandparent', label: 'Grandparent' },
		{ value: 'adviser', label: 'Adviser' },
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
		doctorId: ''
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

	// Initialize form with student data when editing
	onMount(() => {
		if (mode === 'edit' && student) {
			populateFormData(student, emergencyContacts);
		} else if (mode === 'add') {
			resetForm();
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

	function populateFormData(studentData: Student, contactsData: EmergencyContact[]) {
		formData = {
			studentId: studentData.studentId,
			firstName: studentData.firstName,
			lastName: studentData.lastName,
			middleName: studentData.middleName || '',
			email: studentData.email || '',
			dateOfBirth: '',
			gender: studentData.gender,
			grade: studentData.grade,
			section: studentData.section || '',
			address: studentData.address || '',
			chronicHealthConditions: Array.isArray(studentData.chronicHealthConditions)
				? studentData.chronicHealthConditions.join(', ')
				: '',
			currentMedications: Array.isArray(studentData.currentMedications)
				? studentData.currentMedications.join(', ')
				: '',
			healthHistory: studentData.healthHistory || '',
			doctorId: studentData.doctorId || ''
		};

		// Set emergency contacts
		emergencyContactsState =
			contactsData && contactsData.length > 0 ? [...contactsData] : [createEmptyContact()];

		// Set date of birth
		if (studentData.dateOfBirth) {
			const dob = new Date(studentData.dateOfBirth);
			const year = dob.getFullYear();
			const month = dob.getMonth() + 1;
			const day = dob.getDate();

			// Create proper DateValue using CalendarDate
			try {
				dateOfBirth = new CalendarDate(year, month, day);
				formData.dateOfBirth = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
			} catch (error) {
				console.error('Error setting date of birth:', error);
			}
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
			doctorId: ''
		};
		emergencyContactsState = [createEmptyContact()];
		dateOfBirth = undefined;
		errors = {};
	}

	// Helper functions for emergency contacts
	function createEmptyContact(): EmergencyContact {
		return {
			name: '',
			relationship: 'parent',
			phoneNumber: '',
			alternatePhone: '',
			email: '',
			address: '',
			isPrimary: false,
			priority: 1
		};
	}

	function addEmergencyContact() {
		emergencyContactsState = [...emergencyContactsState, createEmptyContact()];
	}

	function removeEmergencyContact(index: number) {
		if (emergencyContactsState.length > 1) {
			emergencyContactsState = emergencyContactsState.filter((_, i) => i !== index);
		}
	}

	function updateEmergencyContact(index: number, field: keyof EmergencyContact, value: any) {
		emergencyContactsState[index] = { ...emergencyContactsState[index], [field]: value };
	}

	// Computed values
	const dialogTitle = $derived(mode === 'edit' ? 'Edit Student' : 'Add New Student');
	const dialogDescription = $derived(
		mode === 'edit'
			? "Update the student's information and emergency contact details."
			: "Enter the student's information and emergency contact details."
	);
	const submitButtonText = $derived(mode === 'edit' ? 'Update Student' : 'Add Student');
	const submittingText = $derived(mode === 'edit' ? 'Updating...' : 'Adding...');
	const formAction = $derived(mode === 'edit' ? '?/updateStudent' : '?/addStudent');
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="flex max-h-[90vh] flex-col overflow-hidden" style="max-width: 768px;">
		<Dialog.Header>
			<Dialog.Title>{dialogTitle}</Dialog.Title>
			<Dialog.Description>
				{dialogDescription}
			</Dialog.Description>
		</Dialog.Header>

		<div class="flex-1 overflow-y-auto pr-2">
			<form
				method="POST"
				action={formAction}
				use:enhance={() => {
					submitting = true;
					return async ({ result, formData }) => {
						submitting = false;

						if (result.type === 'failure') {
							errors = (result.data?.errors as any) || {};
						} else if (result.type === 'success') {
							await invalidateAll();
							open = false;
							// Optionally show success message
						}
					};
				}}
				class="w-full space-y-6"
			>
				<!-- Hidden field for student ID when editing -->
				{#if mode === 'edit' && student?.id}
					<input type="hidden" name="id" value={student.id} />
				{/if}

				<!-- Hidden fields for emergency contacts -->
				{#each emergencyContactsState as contact, index}
					<input type="hidden" name="emergencyContacts[{index}][name]" value={contact.name} />
					<input
						type="hidden"
						name="emergencyContacts[{index}][relationship]"
						value={contact.relationship}
					/>
					<input
						type="hidden"
						name="emergencyContacts[{index}][phoneNumber]"
						value={contact.phoneNumber}
					/>
					<input
						type="hidden"
						name="emergencyContacts[{index}][alternatePhone]"
						value={contact.alternatePhone || ''}
					/>
					<input
						type="hidden"
						name="emergencyContacts[{index}][email]"
						value={contact.email || ''}
					/>
					<input
						type="hidden"
						name="emergencyContacts[{index}][address]"
						value={contact.address || ''}
					/>
					<input
						type="hidden"
						name="emergencyContacts[{index}][isPrimary]"
						value={index === 0 ? 'true' : 'false'}
					/>
					<input type="hidden" name="emergencyContacts[{index}][priority]" value={index + 1} />
				{/each}

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
								readonly={mode === 'edit'}
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
							List any ongoing medical conditions, allergies, or health concerns. Separate multiple
							conditions with commas.
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
							Include medication names, dosages, and frequency. Separate multiple medications with
							commas.
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

					<!-- Assigned Doctor -->
					<div class="space-y-2">
						<Label for="doctorId">Assigned Doctor</Label>
						<Popover.Root bind:open={doctorComboboxOpen}>
							<Popover.Trigger bind:ref={doctorTriggerRef} id="doctorId" class="w-full">
								{#snippet child({ props })}
									<Button
										variant="outline"
										class="w-full"
										{...props}
										role="combobox"
										aria-expanded={doctorComboboxOpen}
									>
										{selectedDoctor || 'Select a doctor...'}
										<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
									</Button>
								{/snippet}
							</Popover.Trigger>
							<Popover.Content class="w-full p-0">
								<Command.Root>
									<Command.Input placeholder="Search doctor..." />
									<Command.List>
										<Command.Empty>No doctor found.</Command.Empty>
										<Command.Group>
											{#each availableDoctors as doctor}
												<Command.Item
													class="cursor-pointer"
													value={doctor.id}
													onSelect={() => {
														formData.doctorId = doctor.id;
														closeDoctorComboboxAndFocusTrigger();
													}}
												>
													<Check
														class={cn(
															'mr-2 size-4',
															formData.doctorId !== doctor.id && 'text-transparent'
														)}
													/>
													{doctor.name}
												</Command.Item>
											{/each}
										</Command.Group>
									</Command.List>
								</Command.Root>
							</Popover.Content>
						</Popover.Root>
						<input type="hidden" name="doctorId" bind:value={formData.doctorId} />
						<p class="text-sm text-muted-foreground">
							Select the doctor who will be responsible for this student's medical care.
						</p>
						{#if errors.doctorId}
							<p class="text-sm text-destructive">{errors.doctorId[0]}</p>
						{/if}
					</div>
				</div>

				<!-- Emergency Contacts Section -->
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold">Emergency Contacts</h3>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={addEmergencyContact}
							class="h-8"
						>
							<Plus class="mr-2 size-4" />
							Add Contact
						</Button>
					</div>

					{#each emergencyContactsState as contact, index}
						<div class="space-y-4 rounded-lg border border-border p-4">
							<div class="flex items-center justify-between">
								<h4 class="font-medium">
									Contact {index + 1}
									{#if index === 0}
										<span class="ml-2 text-sm font-normal text-muted-foreground">(Primary)</span>
									{/if}
								</h4>
								{#if emergencyContactsState.length > 1}
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onclick={() => removeEmergencyContact(index)}
										class="h-8 w-8 p-0 text-destructive hover:text-destructive"
									>
										<Trash2 class="size-4" />
									</Button>
								{/if}
							</div>

							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<!-- Contact Name -->
								<div class="space-y-2">
									<Label for="emergencyContactName{index}">Contact Name *</Label>
									<Input
										id="emergencyContactName{index}"
										bind:value={contact.name}
										placeholder="Enter emergency contact name"
										class="w-full"
										required
									/>
									{#if errors[`emergencyContacts.${index}.name`]}
										<p class="text-sm text-destructive">
											{errors[`emergencyContacts.${index}.name`][0]}
										</p>
									{/if}
								</div>

								<!-- Contact Relationship -->
								<div class="space-y-2">
									<Label>Relationship *</Label>
									<Select.Root bind:value={contact.relationship} type="single">
										<Select.Trigger class="w-full">
											{contact.relationship
												? toTitleCase(contact.relationship)
												: 'Select relationship'}
										</Select.Trigger>
										<Select.Content>
											{#each relationshipOptions as relationship}
												<Select.Item value={relationship.value}>{relationship.label}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
									{#if errors[`emergencyContacts.${index}.relationship`]}
										<p class="text-sm text-destructive">
											{errors[`emergencyContacts.${index}.relationship`][0]}
										</p>
									{/if}
								</div>

								<!-- Contact Phone -->
								<div class="space-y-2">
									<Label for="emergencyContactPhone{index}">Phone Number *</Label>
									<Input
										id="emergencyContactPhone{index}"
										type="tel"
										bind:value={contact.phoneNumber}
										placeholder="Enter phone number"
										class="w-full"
										required
									/>
									{#if errors[`emergencyContacts.${index}.phoneNumber`]}
										<p class="text-sm text-destructive">
											{errors[`emergencyContacts.${index}.phoneNumber`][0]}
										</p>
									{/if}
								</div>

								<!-- Contact Alternate Phone -->
								<div class="space-y-2">
									<Label for="emergencyContactAlternatePhone{index}">Alternate Phone</Label>
									<Input
										id="emergencyContactAlternatePhone{index}"
										type="tel"
										bind:value={contact.alternatePhone}
										placeholder="Enter alternate phone (optional)"
										class="w-full"
									/>
									{#if errors[`emergencyContacts.${index}.alternatePhone`]}
										<p class="text-sm text-destructive">
											{errors[`emergencyContacts.${index}.alternatePhone`][0]}
										</p>
									{/if}
								</div>

								<!-- Contact Email -->
								<div class="space-y-2 md:col-span-2">
									<Label for="emergencyContactEmail{index}">Email</Label>
									<Input
										id="emergencyContactEmail{index}"
										type="email"
										bind:value={contact.email}
										placeholder="Enter email (optional)"
										class="w-full"
									/>
									{#if errors[`emergencyContacts.${index}.email`]}
										<p class="text-sm text-destructive">
											{errors[`emergencyContacts.${index}.email`][0]}
										</p>
									{/if}
								</div>
							</div>

							<!-- Contact Address -->
							<div class="space-y-2">
								<Label for="emergencyContactAddress{index}">Contact Address</Label>
								<Textarea
									id="emergencyContactAddress{index}"
									bind:value={contact.address}
									placeholder="Enter emergency contact address (optional)"
									class="w-full"
									rows={2}
								/>
								{#if errors[`emergencyContacts.${index}.address`]}
									<p class="text-sm text-destructive">
										{errors[`emergencyContacts.${index}.address`][0]}
									</p>
								{/if}
							</div>
						</div>
					{/each}
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
							{submittingText}
						{:else}
							{submitButtonText}
						{/if}
					</Button>
				</Dialog.Footer>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>
