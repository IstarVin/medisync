<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { toTitleCase } from '$lib/utils.js';
	import { FileText, Printer } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	// Types
	interface Student {
		id: string;
		firstName: string;
		lastName: string;
		studentId: string;
		grade: string;
		section?: string | null;
		dateOfBirth: string;
		gender: string;
		address?: string | null;
	}

	interface Visit {
		id: string;
		visitNumber: number;
		checkInTime: string;
		visitType: string;
		chiefComplaint: string;
		symptoms?: string | null;
		diagnosis?: string | null;
		treatment?: string | null;
		notes?: string | null;
		severity: string;
		attendedByFirstName?: string | null;
		attendedByLastName?: string | null;
		attendedByRole?: string | null;
	}

	// Props
	let {
		open = $bindable(false),
		student,
		visits = []
	}: {
		open: boolean;
		student: Student;
		visits: Visit[];
	} = $props();

	// Form data
	let formData = $state({
		to: '',
		address: '',
		date: new Date().toISOString().split('T')[0],
		selectedVisitId: '',
		chiefComplaint: '',
		impression: '',
		remarks: '',
		referringPersonName: '',
		referringPersonDesignation: 'School Nurse'
	});

	// Computed values
	let selectedVisit = $derived(visits.find((visit) => visit.id === formData.selectedVisitId));

	let studentAge = $derived.by(() => {
		const today = new Date();
		const birthDate = new Date(student.dateOfBirth);
		let age = today.getFullYear() - birthDate.getFullYear();
		const monthDiff = today.getMonth() - birthDate.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
			age--;
		}
		return age;
	});

	// Watch for selected visit changes to auto-fill fields
	$effect(() => {
		if (selectedVisit) {
			formData.chiefComplaint = selectedVisit.chiefComplaint || '';
			if (selectedVisit.symptoms) {
				formData.chiefComplaint += (formData.chiefComplaint ? '\n' : '') + selectedVisit.symptoms;
			}
			formData.impression = selectedVisit.diagnosis || '';

			// Build remarks from visit information
			let remarksArray = [];
			if (selectedVisit.treatment) {
				remarksArray.push(`Treatment: ${selectedVisit.treatment}`);
			}
			if (selectedVisit.notes) {
				remarksArray.push(`Notes: ${selectedVisit.notes}`);
			}
			remarksArray.push(`Visit Type: ${toTitleCase(selectedVisit.visitType.replace('_', ' '))}`);
			remarksArray.push(`Severity: ${toTitleCase(selectedVisit.severity)}`);
			remarksArray.push(`Visit Date: ${new Date(selectedVisit.checkInTime).toLocaleDateString()}`);

			formData.remarks = remarksArray.join('\n');

			// Auto-fill referring person from visit data
			if (selectedVisit.attendedByFirstName && selectedVisit.attendedByLastName) {
				formData.referringPersonName = `${selectedVisit.attendedByFirstName} ${selectedVisit.attendedByLastName}`;
				formData.referringPersonDesignation = toTitleCase(
					selectedVisit.attendedByRole || 'School Nurse'
				);
			}
		}
	});

	// Visit options for select
	let visitOptions = $derived(
		visits.map((visit) => ({
			value: visit.id,
			label: `Visit #${visit.visitNumber} - ${new Date(visit.checkInTime).toLocaleDateString()} (${toTitleCase(visit.visitType.replace('_', ' '))})`
		}))
	);

	// Form submission
	function handleSubmit(event: Event) {
		event.preventDefault();
		// Validate required fields
		if (!formData.to.trim()) {
			toast.error('Validation Error', {
				description: 'Please specify who the referral is addressed to.'
			});
			return;
		}

		if (!formData.address.trim()) {
			toast.error('Validation Error', {
				description: 'Please provide the address/agency.'
			});
			return;
		}

		if (!formData.chiefComplaint.trim()) {
			toast.error('Validation Error', {
				description: 'Please provide the chief complaint.'
			});
			return;
		}

		if (!formData.referringPersonName.trim()) {
			toast.error('Validation Error', {
				description: "Please provide the referring person's name."
			});
			return;
		}

		// Generate and open the referral form
		generateReferralForm();
	}

	function generateReferralForm() {
		// Create a new window/tab with the referral form
		const referralWindow = window.open('', '_blank', 'width=800,height=1000,scrollbars=yes');

		if (!referralWindow) {
			toast.error('Popup Blocked', {
				description: 'Please allow popups for this site to generate the referral form.'
			});
			return;
		}

		const referralHtml = generateReferralHtml();
		referralWindow.document.write(referralHtml);
		referralWindow.document.close();

		toast.success('Referral Generated', {
			description: 'Medical referral form has been generated and opened in a new tab.'
		});

		// Close the modal
		open = false;
		resetForm();
	}

	function generateReferralHtml(): string {
		const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Medical Referral Form - SHD Form 3A</title>
	<script src="https://cdn.tailwindcss.com"><\/script>
	<style>
		@media print {
			.no-print { display: none !important; }
			body { font-size: 12px; }
		}
	</style>
</head>
<body class="bg-gray-100 p-5">
	<div class="mx-auto max-w-4xl bg-white p-8 font-sans text-sm shadow-lg">
		<div class="mb-4 text-right no-print">
			<button onclick="window.print()" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
				Print Form
			</button>
		</div>
		<div class="mb-8 text-left">
			<div class="mb-10 text-xs">SHD Form 3A</div>
		</div>
		<div class="mb-8 text-center leading-tight">
			<div class="mb-1 text-xs">Republic of the Philippines</div>
			<h1 class="mb-1 text-sm font-bold">DEPARTMENT OF EDUCATION</h1>
			<div class="mb-1 text-xs">TUPI NATIONAL HIGH SCHOOL</div>
			<div class="mb-1 text-xs">Division of South Cotabato</div>
			<div class="mb-1 text-xs">304575</div>
		</div>
		<div class="mb-8 text-center text-sm font-bold tracking-wide">MEDICAL REFERRAL FORM</div>
		<div class="mb-5 flex items-baseline text-xs">
			<span class="mr-3 min-w-16">To</span>
			<div class="flex-1 border-b border-black pb-1 px-2">${formData.to}</div>
			<span class="mx-12">Date</span>
			<div class="w-36 border-b border-black pb-1 px-2">${new Date(formData.date).toLocaleDateString()}</div>
		</div>
		<div class="mb-2 flex items-baseline text-xs">
			<span class="mr-3 min-w-16">Address</span>
			<div class="flex-1 border-b border-black pb-1 px-2">${formData.address}</div>
		</div>
		<div class="mb-8 text-center text-xs">(Agency)</div>
		<div class="mb-6 text-xs">
			<div class="mb-5">This is to refer to you:</div>
			<div class="mb-4 flex items-baseline">
				<span class="mr-3 min-w-16">Name:</span>
				<div class="flex-1 border-b border-black pb-1 px-2">${student.firstName} ${student.lastName}</div>
				<span class="mx-8">Age:</span>
				<div class="mr-5 w-20 border-b border-black pb-1 px-2">${studentAge}</div>
				<span class="mr-3">Sex:</span>
				<div class="w-32 border-b border-black pb-1 px-2">${toTitleCase(student.gender.replace('_', ' '))}</div>
			</div>
			<div class="mb-4 flex items-baseline">
				<span class="mr-3 min-w-24">Address/School:</span>
				<div class="flex-1 border-b border-black pb-1 px-2">${student.address || 'Tupi National High School'}</div>
				<span class="mx-8">Grade:</span>
				<div class="w-32 border-b border-black pb-1 px-2">${student.grade}${student.section ? ` (${student.section})` : ''}</div>
			</div>
		</div>
		<div class="mb-6 text-xs">
			<div class="mb-3">Chief Complaint:</div>
			<div class="space-y-1">
				${formData.chiefComplaint
					.split('\\n')
					.map(
						(line: string) => `<div class="border-b border-black pb-1 px-2 min-h-5">${line}</div>`
					)
					.join('')}
			</div>
		</div>
		<div class="mb-6 text-xs">
			<div class="mb-3">Impression:</div>
			<div class="border-b border-black pb-1 px-2 min-h-5">${formData.impression}</div>
		</div>
		<div class="mb-8 text-xs">
			<div class="mb-3">Remarks:</div>
			<div class="space-y-1">
				${formData.remarks
					.split('\\n')
					.map(
						(line: string) => `<div class="border-b border-black pb-1 px-2 min-h-5">${line}</div>`
					)
					.join('')}
			</div>
		</div>
		<div class="flex justify-between">
			<div></div>
			<div class="mb-8 text-center">
				<div class="mb-1 ml-auto h-6 w-60 border-b border-black px-2 pb-1">${formData.referringPersonName}</div>
				<div class="mb-3 text-xs">Name and Signature</div>
				<div class="mb-1 ml-auto h-6 w-60 border-b border-black px-2 pb-1">${formData.referringPersonDesignation}</div>
				<div class="text-xs">Designation</div>
			</div>
		</div>
		<div class="my-8 border-t border-b border-dashed border-black py-3 text-center text-xs font-bold">
			Note: To be detached from upper portion and sent back to the school.
		</div>
		<div class="mb-8 text-center">
			<div class="mx-auto mb-1 h-6 w-72 border-b border-black"></div>
			<div class="text-xs">Name of Institution</div>
		</div>
		<div class="border-black pt-5">
			<div class="mb-8 text-center text-sm font-bold">Medical Treatment Return Slip</div>
			<div class="space-y-4 text-xs">
				<div class="flex items-baseline">
					<span class="mr-3 min-w-32">Returned to</span>
					<div class="flex-1 border-b border-black pb-1 px-2">Tupi National High School</div>
				</div>
				<div class="flex items-baseline">
					<span class="mr-3 min-w-32">Name of Patient</span>
					<div class="flex-1 border-b border-black pb-1 px-2">${student.firstName} ${student.lastName}</div>
					<span class="mx-8">Date Referred</span>
					<div class="w-36 border-b border-black pb-1 px-2">${new Date(formData.date).toLocaleDateString()}</div>
				</div>
				<div class="flex items-baseline">
					<span class="mr-3 min-w-32">Chief Complaint</span>
					<div class="flex-1 border-b border-black pb-1"></div>
				</div>
				<div class="flex items-baseline">
					<span class="mr-3 min-w-32">Findings</span>
					<div class="flex-1 border-b border-black pb-1"></div>
				</div>
				<div class="flex items-baseline">
					<span class="mr-3 min-w-40">Action/Recommendations</span>
					<div class="flex-1 border-b border-black pb-1"></div>
				</div>
			</div>
			<div class="mt-10 flex justify-between">
				<div class="w-36 text-center">
					<div class="w-full border-t border-black pt-1.5 text-xs">Date</div>
				</div>
				<div class="flex w-56 flex-col gap-6 text-center">
					<div class="w-full border-t border-black pt-1.5 text-xs">Name & Signature</div>
					<div class="w-full border-t border-black pt-1.5 text-xs">Designation</div>
				</div>
			</div>
		</div>
	</div>
</body>
</html>`;
		return html;
	}

	// Reset form
	function resetForm() {
		formData = {
			to: '',
			address: '',
			date: new Date().toISOString().split('T')[0],
			selectedVisitId: '',
			chiefComplaint: '',
			impression: '',
			remarks: '',
			referringPersonName: '',
			referringPersonDesignation: 'School Nurse'
		};
	}

	// Close dialog
	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
		if (!isOpen) {
			resetForm();
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-h-[90vh] max-w-4xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<FileText class="size-5" />
				Generate Medical Referral Form
			</Dialog.Title>
			<Dialog.Description>
				Generate a medical referral form for {student.firstName}
				{student.lastName}. Select a visit to auto-fill the medical information and referring nurse
				details, or enter details manually.
			</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={handleSubmit} class="space-y-6">
			<!-- Referral Details -->
			<div class="space-y-4">
				<h3 class="text-lg font-medium">Referral Details</h3>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="to">Referring To *</Label>
						<Input
							id="to"
							bind:value={formData.to}
							placeholder="Dr. John Doe, Hospital Name"
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="date">Date</Label>
						<Input id="date" type="date" bind:value={formData.date} required />
					</div>
				</div>

				<div class="space-y-2">
					<Label for="address">Address/Agency *</Label>
					<Input
						id="address"
						bind:value={formData.address}
						placeholder="Hospital address or medical facility"
						required
					/>
				</div>
			</div>

			<!-- Visit Selection -->
			{#if visits.length > 0}
				<div class="space-y-4">
					<h3 class="text-lg font-medium">Visit Information</h3>

					<div class="space-y-2">
						<Label for="visitSelect">Select Visit (Optional)</Label>
						<Select.Root bind:value={formData.selectedVisitId} type="single">
							<Select.Trigger class="w-full" id="visitSelect">
								{formData.selectedVisitId
									? (visitOptions.find((opt) => opt.value === formData.selectedVisitId)?.label ??
										'Select a visit')
									: 'Choose a visit to auto-fill information'}
							</Select.Trigger>
							<Select.Content>
								{#each visitOptions as option}
									<Select.Item value={option.value} class="cursor-pointer">
										{option.label}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						<p class="text-sm text-muted-foreground">
							Selecting a visit will automatically fill the chief complaint, impression, remarks,
							and referring person information based on the visit data.
						</p>
					</div>
				</div>
			{/if}

			<!-- Medical Information -->
			<div class="space-y-4">
				<h3 class="text-lg font-medium">Medical Information</h3>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="chiefComplaint">Chief Complaint *</Label>
						<Textarea
							id="chiefComplaint"
							bind:value={formData.chiefComplaint}
							placeholder="Describe the main reason for referral"
							rows={4}
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="impression">Impression</Label>
						<Textarea
							id="impression"
							bind:value={formData.impression}
							placeholder="Clinical impression or diagnosis"
							rows={4}
						/>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="remarks">Remarks</Label>
					<Textarea
						id="remarks"
						bind:value={formData.remarks}
						placeholder="Additional remarks, treatment provided, or special instructions"
						rows={3}
					/>
				</div>
			</div>

			<!-- Referring Person -->
			<div class="space-y-4">
				<h3 class="text-lg font-medium">Referring Person</h3>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="referringPersonName">Name *</Label>
						<Input
							id="referringPersonName"
							bind:value={formData.referringPersonName}
							placeholder="Your full name"
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="referringPersonDesignation">Designation</Label>
						<Input
							id="referringPersonDesignation"
							bind:value={formData.referringPersonDesignation}
							placeholder="Your job title"
						/>
					</div>
				</div>
			</div>

			<!-- Student Information Preview -->
			<div class="rounded-lg border bg-muted/50 p-4">
				<h3 class="mb-2 text-sm font-medium">Student Information</h3>
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
						<span class="font-medium">Age:</span>
						{studentAge} years old
					</div>
					<div>
						<span class="font-medium">Grade:</span>
						{student.grade}{student.section ? ` (${student.section})` : ''}
					</div>
					<div>
						<span class="font-medium">Gender:</span>
						{toTitleCase(student.gender.replace('_', ' '))}
					</div>
					{#if student.address}
						<div>
							<span class="font-medium">Address:</span>
							{student.address}
						</div>
					{/if}
				</div>
			</div>

			<!-- Form Actions -->
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit">
					<Printer class="mr-2 size-4" />
					Generate Referral Form
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
