<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Loader2, Mail, Send } from '@lucide/svelte';
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
	}

	// Props
	let {
		open = $bindable(false),
		student,
		referralData
	}: {
		open: boolean;
		student: Student;
		referralData: {
			to: string;
			address: string;
			date: string;
			chiefComplaint: string;
			impression: string;
			remarks: string;
			referringPersonName: string;
			referringPersonDesignation: string;
		};
	} = $props();

	// Form state
	let submitting = $state(false);
	let form: HTMLFormElement | undefined = $state();

	// Form data
	let formData = $state({
		recipientEmail: '',
		subject: `Medical Referral for ${student.firstName} ${student.lastName}`,
		message: `Dear Medical Professional,

Please find attached the medical referral form for ${student.firstName} ${student.lastName} (Student ID: ${student.studentId}).

Patient Details:
- Name: ${student.firstName} ${student.lastName}
- Student ID: ${student.studentId}
- Grade: ${student.grade}${student.section ? ` (${student.section})` : ''}

This referral is being sent from our school health office. Please review the attached referral form for complete medical information.

If you have any questions or need additional information, please contact our health office.

Thank you for your attention to this matter.

Best regards,
${referralData.referringPersonName}
${referralData.referringPersonDesignation}
School Health Office`
	});

	// Reset form when modal opens
	$effect(() => {
		if (open) {
			formData.recipientEmail = '';
			formData.subject = `Medical Referral for ${student.firstName} ${student.lastName}`;
			formData.message = `Dear Medical Professional,

Please find attached the medical referral form for ${student.firstName} ${student.lastName} (Student ID: ${student.studentId}).

Patient Details:
- Name: ${student.firstName} ${student.lastName}
- Student ID: ${student.studentId}
- Grade: ${student.grade}${student.section ? ` (${student.section})` : ''}

This referral is being sent from our school health office. Please review the attached referral form for complete medical information.

If you have any questions or need additional information, please contact our health office.

Thank you for your attention to this matter.

Best regards,
${referralData.referringPersonName}
${referralData.referringPersonDesignation}
School Health Office`;
		}
	});

	function resetForm() {
		formData.recipientEmail = '';
		formData.subject = `Medical Referral for ${student.firstName} ${student.lastName}`;
		formData.message = '';
	}

	// Form submission
	const submitForm: SubmitFunction = () => {
		submitting = true;
		return async ({ result, update }) => {
			try {
				if (result.type === 'success') {
					toast.success('Referral email sent successfully!', {
						description: 'The medical referral PDF has been sent to the recipient.'
					});
					// Close modal and refresh data
					open = false;
					resetForm();
					await invalidateAll();
				} else if (result.type === 'failure') {
					const errorMessage =
						result.data?.error || 'Failed to send referral email. Please try again.';
					toast.error('Failed to send referral email', {
						description: errorMessage
					});
				} else if (result.type === 'error') {
					toast.error('Email sending failed', {
						description: 'An unexpected error occurred. Please try again.'
					});
				}
			} finally {
				submitting = false;
				await update();
			}
		};
	};

	function handleCancel() {
		open = false;
		resetForm();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Mail class="size-5" />
				Email Medical Referral PDF
			</Dialog.Title>
			<Dialog.Description>
				Send the medical referral form as a PDF attachment to the healthcare provider or hospital.
			</Dialog.Description>
		</Dialog.Header>

		<form
			bind:this={form}
			method="POST"
			action="?/sendReferralEmail"
			use:enhance={submitForm}
			class="space-y-6"
		>
			<!-- Hidden fields for referral data -->
			<input type="hidden" name="studentId" value={student.id} />
			<input type="hidden" name="referralTo" value={referralData.to} />
			<input type="hidden" name="referralAddress" value={referralData.address} />
			<input type="hidden" name="referralDate" value={referralData.date} />
			<input type="hidden" name="chiefComplaint" value={referralData.chiefComplaint} />
			<input type="hidden" name="impression" value={referralData.impression} />
			<input type="hidden" name="remarks" value={referralData.remarks} />
			<input type="hidden" name="referringPersonName" value={referralData.referringPersonName} />
			<input
				type="hidden"
				name="referringPersonDesignation"
				value={referralData.referringPersonDesignation}
			/>

			<!-- Recipient Email -->
			<div class="space-y-2">
				<Label for="recipientEmail">Recipient Email Address *</Label>
				<Input
					id="recipientEmail"
					name="recipientEmail"
					type="email"
					bind:value={formData.recipientEmail}
					placeholder="doctor@hospital.com"
					required
					class="w-full"
				/>
				<p class="text-sm text-muted-foreground">
					Enter the email address of the healthcare provider or hospital receiving this referral.
				</p>
			</div>

			<!-- Subject -->
			<div class="space-y-2">
				<Label for="subject">Subject *</Label>
				<Input
					id="subject"
					name="subject"
					bind:value={formData.subject}
					placeholder="Email subject"
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
					bind:value={formData.message}
					placeholder="Email message"
					required
					rows={12}
					class="w-full resize-none"
				/>
				<p class="text-sm text-muted-foreground">
					This message will be sent along with the PDF referral form as an attachment.
				</p>
			</div>

			<!-- Student Information Preview -->
			<div class="rounded-lg border bg-muted/50 p-4">
				<h3 class="mb-2 text-sm font-medium">Patient Information (Will be included in PDF)</h3>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span class="font-medium">Name:</span>
						{student.firstName}
						{student.lastName}
					</div>
					<div>
						<span class="font-medium">Student ID:</span>
						{student.studentId}
					</div>
					<div>
						<span class="font-medium">Grade:</span>
						{student.grade}{student.section ? ` (${student.section})` : ''}
					</div>
					<div>
						<span class="font-medium">Referred to:</span>
						{referralData.to}
					</div>
				</div>
			</div>

			<!-- Form Actions -->
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={handleCancel} disabled={submitting}>
					Cancel
				</Button>
				<Button type="submit" disabled={submitting}>
					{#if submitting}
						<Loader2 class="mr-2 size-4 animate-spin" />
						Sending...
					{:else}
						<Send class="mr-2 size-4" />
						Send Referral Email
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
