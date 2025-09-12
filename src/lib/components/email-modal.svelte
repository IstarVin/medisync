<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { toTitleCase } from '$lib/utils';
	import { GraduationCap, Loader2, Mail, Send, Stethoscope, User } from '@lucide/svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';

	// Types
	interface Student {
		id: string;
		firstName: string;
		lastName: string;
		studentId: string;
		grade: string;
		section?: string | null;
		email?: string | null;
		doctorFirstName?: string | null;
		doctorLastName?: string | null;
		doctorEmail?: string | null;
	}

	interface EmergencyContact {
		id: string;
		name: string;
		relationship: string;
		phoneNumber: string;
		alternatePhone?: string | null;
		email?: string | null;
		isPrimary: boolean;
	}

	type RecipientType = 'emergency_contact' | 'student' | 'doctor';

	interface Recipient {
		type: RecipientType;
		id?: string;
		name: string;
		email: string | null;
		label: string;
		description?: string;
	}

	// Props
	let {
		open = $bindable(false),
		student,
		emergencyContacts = [],
		predeterminedContact = null
	}: {
		open: boolean;
		student: Student;
		emergencyContacts: EmergencyContact[];
		predeterminedContact?: {
			type: 'student' | 'emergency-contact' | 'doctor';
			id?: string;
			email: string;
		} | null;
	} = $props();

	// Form state
	let submitting = $state(false);
	let form: HTMLFormElement | undefined = $state();

	// Form data
	let formData = $state({
		recipientType: '' as RecipientType | '',
		recipientId: '',
		recipientEmail: '',
		recipientValue: '', // Combined value for Select component
		subject: '',
		message: ''
	});

	// Available recipients - computed from props
	let availableRecipients = $derived.by(() => {
		const recipients: Recipient[] = [];

		// Add emergency contacts
		emergencyContacts.forEach((contact) => {
			if (contact.email) {
				recipients.push({
					type: 'emergency_contact',
					id: contact.id,
					name: contact.name,
					email: contact.email,
					label: `${contact.name} (${toTitleCase(contact.relationship)})`,
					description: `${contact.phoneNumber}`
				});
			}
		});

		// Add student if they have email
		if (student.email) {
			recipients.push({
				type: 'student',
				id: student.id,
				name: `${student.firstName} ${student.lastName}`,
				email: student.email,
				label: `${student.firstName} ${student.lastName} (Student)`,
				description: `Student - ${student.studentId}`
			});
		}

		// Add doctor if assigned and has email
		if (student.doctorEmail && student.doctorFirstName && student.doctorLastName) {
			recipients.push({
				type: 'doctor',
				id: student.id, // Using student ID as reference
				name: `Dr. ${student.doctorFirstName} ${student.doctorLastName}`,
				email: student.doctorEmail,
				label: `Dr. ${student.doctorFirstName} ${student.doctorLastName} (Assigned Doctor)`,
				description: `Medical Professional`
			});
		}

		return recipients;
	});

	let selectedRecipient = $derived.by(() => {
		if (!formData.recipientValue) {
			return null;
		}
		return (
			availableRecipients.find(
				(r: Recipient) => `${r.type}:${r.id || 'main'}` === formData.recipientValue
			) || null
		);
	});

	// Update form data when recipient value changes
	$effect(() => {
		if (formData.recipientValue) {
			const recipient = availableRecipients.find(
				(r: Recipient) => `${r.type}:${r.id || 'main'}` === formData.recipientValue
			);
			if (recipient) {
				formData.recipientType = recipient.type;
				formData.recipientId = recipient.id || '';
				formData.recipientEmail = recipient.email || '';

				// Auto-populate subject if empty
				if (!formData.subject.trim() && student) {
					formData.subject = `Important notification regarding ${student.firstName} ${student.lastName}`;
				}
			}
		}
	});

	// Handle predetermined contact selection
	$effect(() => {
		if (predeterminedContact && open) {
			// Find the matching recipient based on predetermined contact
			const matchingRecipient = availableRecipients.find((recipient) => {
				if (predeterminedContact.type === 'emergency-contact' && predeterminedContact.id) {
					return recipient.type === 'emergency_contact' && recipient.id === predeterminedContact.id;
				} else if (predeterminedContact.type === 'student') {
					return recipient.type === 'student';
				} else if (predeterminedContact.type === 'doctor') {
					return recipient.type === 'doctor';
				}
				return false;
			});

			if (matchingRecipient) {
				formData.recipientValue = `${matchingRecipient.type}:${matchingRecipient.id || 'main'}`;
			}
		}
	});

	// Form submission
	const submitForm: SubmitFunction = () => {
		submitting = true;
		return async ({ result, update }) => {
			try {
				if (result.type === 'success') {
					toast.success('Email sent successfully!', {
						description: 'Your message has been delivered to the recipient.'
					});
					// Close modal and refresh data
					open = false;
					resetForm();
					await invalidateAll();
				} else if (result.type === 'failure') {
					const errorMessage = result.data?.error || 'Failed to send email. Please try again.';
					toast.error('Failed to send email', {
						description: errorMessage
					});
				} else if (result.type === 'error') {
					toast.error('Email sending failed', {
						description: 'An unexpected error occurred. Please try again.'
					});
				}
			} finally {
				submitting = false;
			}
			await update();
		};
	};

	// Reset form
	function resetForm() {
		formData = {
			recipientType: '',
			recipientId: '',
			recipientEmail: '',
			recipientValue: '',
			subject: '',
			message: ''
		};
	}

	// Close dialog when clicking outside or escape
	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			resetForm();
		}
		open = isOpen;
	}

	// Computed values
	let studentDisplayName = $derived(`${student.firstName} ${student.lastName}`);
	let studentInfo = $derived(
		`${student.studentId} - ${student.grade}${student.section ? ` (${student.section})` : ''}`
	);

	function getRecipientIcon(type: RecipientType) {
		switch (type) {
			case 'emergency_contact':
				return User;
			case 'student':
				return GraduationCap;
			case 'doctor':
				return Stethoscope;
			default:
				return Mail;
		}
	}

	function getRecipientColor(type: RecipientType) {
		switch (type) {
			case 'emergency_contact':
				return 'bg-orange-100 dark:bg-orange-900/20 text-orange-600';
			case 'student':
				return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600';
			case 'doctor':
				return 'bg-green-100 dark:bg-green-900/20 text-green-600';
			default:
				return 'bg-gray-100 dark:bg-gray-900/20 text-gray-600';
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Mail class="size-5" />
				Send Email Message
			</Dialog.Title>
			<Dialog.Description>
				Send an important message about {studentDisplayName}.
			</Dialog.Description>
		</Dialog.Header>

		<!-- Student Info Card -->
		<div class="rounded-lg bg-muted/30 p-4">
			<div class="flex items-center gap-3">
				<div class="flex size-10 items-center justify-center rounded-full bg-primary/10">
					<span class="text-sm font-semibold text-primary">
						{student.firstName[0]}{student.lastName[0]}
					</span>
				</div>
				<div>
					<h3 class="font-medium text-foreground">{studentDisplayName}</h3>
					<p class="text-sm text-muted-foreground">{studentInfo}</p>
				</div>
			</div>

			<!-- Selected Recipient Info -->
			{#if selectedRecipient}
				{@const RecipientIcon = getRecipientIcon(selectedRecipient.type)}
				<div class="mt-3 border-t pt-3">
					<div class="flex items-center gap-3">
						<div
							class="flex size-8 items-center justify-center rounded-full {getRecipientColor(
								selectedRecipient.type
							)}"
						>
							<RecipientIcon class="size-4" />
						</div>
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<h4 class="font-medium text-foreground">{selectedRecipient.name}</h4>
								<span
									class="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 capitalize dark:bg-gray-900/50 dark:text-gray-300"
								>
									{selectedRecipient.type.replace('_', ' ')}
								</span>
							</div>
							<div class="flex items-center gap-4 text-sm text-muted-foreground">
								<div class="flex items-center gap-1">
									<Mail class="size-3" />
									<span>{selectedRecipient.email}</span>
								</div>
								{#if selectedRecipient.description}
									<span>{selectedRecipient.description}</span>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Form -->
		<form
			bind:this={form}
			method="POST"
			action="?/sendEmail"
			use:enhance={submitForm}
			class="flex flex-1 flex-col gap-4 overflow-y-auto"
		>
			<!-- Hidden fields -->
			<input type="hidden" name="studentId" value={student.id} />
			<input type="hidden" name="recipientType" bind:value={formData.recipientType} />
			<input type="hidden" name="recipientId" bind:value={formData.recipientId} />
			<input type="hidden" name="recipientEmail" bind:value={formData.recipientEmail} />

			<!-- Recipient Selection -->
			<div class="space-y-2">
				<Label for="recipient">Send to *</Label>
				<Select.Root bind:value={formData.recipientValue} type="single" required>
					<Select.Trigger class="w-full" id="recipient" aria-describedby="recipient-description">
						{selectedRecipient ? selectedRecipient.label : 'Select recipient...'}
					</Select.Trigger>
					<Select.Content>
						{#each availableRecipients as recipient (recipient.type + recipient.id)}
							{@const RecipientIcon = getRecipientIcon(recipient.type)}
							<Select.Item
								value="{recipient.type}:{recipient.id || 'main'}"
								label={recipient.label}
							>
								<div class="flex items-center gap-2">
									<RecipientIcon class="size-4" />
									<div class="flex flex-col">
										<span>{recipient.label}</span>
										{#if recipient.description}
											<span class="text-xs text-muted-foreground">{recipient.description}</span>
										{/if}
									</div>
								</div>
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				{#if availableRecipients.length === 0}
					<div
						class="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950/50"
						role="alert"
						aria-live="polite"
					>
						<p class="text-sm text-orange-800 dark:text-orange-200">
							<strong>No email recipients available.</strong> Please ensure emergency contacts, student,
							or assigned doctor have email addresses on file.
						</p>
					</div>
				{/if}
			</div>

			<!-- Subject -->
			<div class="space-y-2">
				<Label for="subject">Subject *</Label>
				<Input
					id="subject"
					name="subject"
					placeholder="Enter email subject..."
					bind:value={formData.subject}
					required
					aria-describedby="subject-help"
					class="w-full"
				/>
			</div>

			<!-- Message -->
			<div class="space-y-2">
				<Label for="message">Message *</Label>
				<Textarea
					id="message"
					name="message"
					placeholder="Enter your message..."
					bind:value={formData.message}
					rows={8}
					class="min-h-32"
					required
					aria-describedby="message-help"
				/>
			</div>

			<!-- Preview section -->
			<!-- {#if formData.message.trim()}
				<div class="space-y-2">
					<Label>Message Preview</Label>
					<div class="rounded-lg border bg-muted/30 p-3 text-sm">
						<div class="break-words whitespace-pre-wrap">{formData.message}</div>
					</div>
				</div>
			{/if} -->

			<!-- Form Actions -->
			<div class="flex justify-end gap-3 border-t pt-4">
				<Button
					type="button"
					variant="outline"
					onclick={() => handleOpenChange(false)}
					disabled={submitting}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					disabled={submitting ||
						!formData.subject.trim() ||
						!formData.message.trim() ||
						!formData.recipientValue ||
						!formData.recipientEmail}
				>
					{#if submitting}
						<Loader2 class="mr-2 size-4 animate-spin" />
						Sending Message...
					{:else}
						<Send class="mr-2 size-4" />
						Send Message
					{/if}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
