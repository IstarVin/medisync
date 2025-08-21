<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Loader2, Mail, Phone, Send, User } from '@lucide/svelte';
	import type { SubmitFunction } from '@sveltejs/kit';

	// Types
	interface Student {
		id: string;
		firstName: string;
		lastName: string;
		studentId: string;
		grade: string;
		section?: string | null;
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

	// Props
	let {
		open = $bindable(false),
		student,
		contact
	}: {
		open: boolean;
		student: Student;
		contact: EmergencyContact | null;
	} = $props();

	// Form state
	let submitting = $state(false);
	let form: HTMLFormElement | undefined = $state();

	// Form data
	let formData = $state({
		subject: '',
		message: ''
	});

	// Form submission
	const submitForm: SubmitFunction = () => {
		submitting = true;
		return async ({ result, update }) => {
			submitting = false;
			if (result.type === 'success') {
				// Close modal and refresh data
				open = false;
				resetForm();
				await invalidateAll();
			}
			await update();
		};
	};

	// Reset form
	function resetForm() {
		formData = {
			subject: '',
			message: ''
		};
	}

	// Close dialog when clicking outside or escape
	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
		if (!isOpen) {
			resetForm();
		}
	}

	// Computed values
	let studentDisplayName = $derived(`${student.firstName} ${student.lastName}`);
	let studentInfo = $derived(
		`${student.studentId} - ${student.grade}${student.section ? ` (${student.section})` : ''}`
	);

	// Set default subject when contact changes
	$effect(() => {
		if (contact && student) {
			formData.subject = `Important notification regarding ${student.firstName} ${student.lastName}`;
		}
	});
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="flex max-h-[90vh] max-w-2xl! flex-col overflow-hidden">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Mail class="size-5" />
				Send Emergency Contact Message
			</Dialog.Title>
			<Dialog.Description>
				Send an important message to the emergency contact about {studentDisplayName}.
			</Dialog.Description>
		</Dialog.Header>

		{#if contact}
			<!-- Contact Info Card -->
			<div class="rounded-lg bg-muted/30 p-4">
				<div class="space-y-3">
					<!-- Student Info -->
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

					<!-- Contact Info -->
					<div class="border-t pt-3">
						<div class="flex items-center gap-3">
							<div
								class="flex size-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20"
							>
								<User class="size-4 text-orange-600" />
							</div>
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<h4 class="font-medium text-foreground">{contact.name}</h4>
									<span
										class="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 capitalize dark:bg-orange-900/50 dark:text-orange-300"
									>
										{contact.relationship}
									</span>
								</div>
								<div class="flex items-center gap-4 text-sm text-muted-foreground">
									{#if contact.email}
										<div class="flex items-center gap-1">
											<Mail class="size-3" />
											<span>{contact.email}</span>
										</div>
									{/if}
									<div class="flex items-center gap-1">
										<Phone class="size-3" />
										<span>{contact.phoneNumber}</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Form -->
			<form
				bind:this={form}
				method="POST"
				action="?/sendEmergencyContactMail"
				use:enhance={submitForm}
				class="flex flex-1 flex-col gap-4 overflow-y-auto"
			>
				<!-- Hidden fields -->
				<input type="hidden" name="studentId" value={student.id} />
				<input type="hidden" name="contactId" value={contact.id} />
				<input type="hidden" name="contactEmail" value={contact.email || ''} />

				<!-- Subject -->
				<div class="space-y-2">
					<Label for="subject">Subject *</Label>
					<Input
						id="subject"
						name="subject"
						placeholder="Enter email subject..."
						bind:value={formData.subject}
						required
						class="w-full"
					/>
				</div>

				<!-- Message -->
				<div class="space-y-2">
					<Label for="message">Message *</Label>
					<Textarea
						id="message"
						name="message"
						placeholder="Enter your message to the emergency contact..."
						bind:value={formData.message}
						rows={8}
						class="min-h-32"
						required
					/>
				</div>

				<!-- Preview section -->
				{#if formData.message.trim()}
					<div class="space-y-2">
						<Label>Message Preview</Label>
						<div class="rounded-lg border bg-muted/30 p-3 text-sm">
							<div class="whitespace-pre-wrap">{formData.message}</div>
						</div>
					</div>
				{/if}

				<!-- Form Actions -->
				<div class="flex justify-end gap-3 border-t pt-4">
					<Button
						type="button"
						variant="outline"
						onclick={() => (open = false)}
						disabled={submitting}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={submitting ||
							!formData.subject.trim() ||
							!formData.message.trim() ||
							!contact.email}
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

				{#if !contact.email}
					<div
						class="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950/50"
					>
						<p class="text-sm text-orange-800 dark:text-orange-200">
							<strong>Note:</strong> This contact doesn't have an email address on file. Please
							contact them directly at {contact.phoneNumber}.
						</p>
					</div>
				{/if}
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
