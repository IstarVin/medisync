<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import type { NurseComboboxOption } from '$lib/types/nurse.js';
	import { cn } from '$lib/utils.js';
	import { Check, ChevronsUpDown, Loader2, Plus, Stethoscope } from '@lucide/svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { tick } from 'svelte';
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
		availableNurses = []
	}: {
		open: boolean;
		student: Student;
		availableNurses: NurseComboboxOption[];
	} = $props();

	// Form state
	let submitting = $state(false);
	let form: HTMLFormElement | undefined = $state();

	// Form data
	let formData = $state({
		nurseId: '',
		reason: '',
		details: '',
		medicationsGiven: '',
		visitType: 'other',
		severity: 'low',
		isEmergency: false
	});

	// Nurse combobox state
	let nurseComboboxOpen = $state(false);
	let nurseTriggerRef = $state<HTMLButtonElement>(null!);

	const selectedNurse = $derived(
		availableNurses.find((nurse) => nurse.id === formData.nurseId)?.name
	);

	// Close combobox and refocus trigger
	function closeNurseComboboxAndFocusTrigger() {
		nurseComboboxOpen = false;
		tick().then(() => {
			nurseTriggerRef.focus();
		});
	} // Available options
	const visitTypeOptions = [
		{ value: 'emergency', label: 'Emergency' },
		{ value: 'illness', label: 'Illness' },
		{ value: 'injury', label: 'Injury' },
		{ value: 'medication', label: 'Medication' },
		{ value: 'checkup', label: 'Checkup' },
		{ value: 'mental_health', label: 'Mental Health' },
		{ value: 'other', label: 'Other' }
	];

	const severityOptions = [
		{ value: 'low', label: 'Low' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'high', label: 'High' },
		{ value: 'critical', label: 'Critical' }
	];

	// Form submission
	const submitForm: SubmitFunction = () => {
		submitting = true;
		return async ({ result, update }) => {
			submitting = false;
			if (result.type === 'success') {
				toast.success('Visit created successfully!', {
					description: `Clinic visit for ${student.firstName} ${student.lastName} has been recorded.`
				});
				// Close modal and refresh data
				open = false;
				resetForm();
				await invalidateAll();
			} else if (result.type === 'failure') {
				const errorMessage = result.data?.error || 'Failed to create visit. Please try again.';
				toast.error('Failed to create visit', {
					description: errorMessage
				});
			} else if (result.type === 'error') {
				toast.error('Visit creation failed', {
					description: 'An unexpected error occurred. Please try again.'
				});
			}
			await update();
		};
	};

	// Reset form
	function resetForm() {
		formData = {
			nurseId: '',
			reason: '',
			details: '',
			medicationsGiven: '',
			visitType: 'other',
			severity: 'low',
			isEmergency: false
		};
	}

	// Close dialog when clicking outside or escape
	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
		if (!isOpen) {
			resetForm();
		}
	}

	// Update formData when visit type changes to emergency
	$effect(() => {
		if (formData.visitType === 'emergency') {
			formData.isEmergency = true;
			formData.severity = 'high';
		} else {
			formData.isEmergency = false;
		}
	});

	// Update formData when severity changes
	$effect(() => {
		if (formData.severity === 'critical') {
			formData.isEmergency = true;
		}
	});

	// Computed student display name
	let studentDisplayName = $derived(`${student.firstName} ${student.lastName}`);
	let studentInfo = $derived(
		`${student.studentId} - ${student.grade}${student.section ? ` (${student.section})` : ''}`
	);
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="flex max-h-[90vh] max-w-2xl! flex-col overflow-hidden">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Stethoscope class="size-5" />
				New Clinic Visit
			</Dialog.Title>
			<Dialog.Description>
				Record a new clinic visit for {studentDisplayName}.
			</Dialog.Description>
		</Dialog.Header>

		<!-- Patient Info Card -->
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
		</div>

		<!-- Form -->
		<form
			bind:this={form}
			method="POST"
			action="?/createVisit"
			use:enhance={submitForm}
			class="flex flex-1 flex-col gap-4 overflow-y-auto"
		>
			<!-- Hidden field for student ID -->
			<input type="hidden" name="studentId" value={student.id} />

			<!-- Nurse Name -->
			<div class="space-y-2">
				<Label for="nurseId">Nurse *</Label>
				<Popover.Root bind:open={nurseComboboxOpen}>
					<Popover.Trigger bind:ref={nurseTriggerRef} id="nurseId" class="w-full">
						{#snippet child({ props })}
							<Button
								variant="outline"
								class="w-full"
								{...props}
								role="combobox"
								aria-expanded={nurseComboboxOpen}
							>
								{selectedNurse || 'Select a nurse...'}
								<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-full p-0">
						<Command.Root>
							<Command.Input placeholder="Search nurse..." />
							<Command.List>
								<Command.Empty>No nurse found.</Command.Empty>
								<Command.Group>
									{#each availableNurses as nurse}
										<Command.Item
											class="cursor-pointer"
											value={nurse.id}
											onSelect={() => {
												formData.nurseId = nurse.id;
												closeNurseComboboxAndFocusTrigger();
											}}
										>
											<Check
												class={cn(
													'mr-2 size-4',
													formData.nurseId !== nurse.id && 'text-transparent'
												)}
											/>
											{nurse.name}
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
				<input type="hidden" name="nurseId" bind:value={formData.nurseId} />
			</div>

			<!-- Visit Type and Severity -->
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="visitType">Visit Type</Label>
					<Select.Root bind:value={formData.visitType} type="single">
						<Select.Trigger class="w-full" id="visitType">
							{formData.visitType
								? (visitTypeOptions.find((opt) => opt.value === formData.visitType)?.label ??
									'Other')
								: 'Select type'}
						</Select.Trigger>
						<Select.Content>
							{#each visitTypeOptions as option}
								<Select.Item value={option.value} class="cursor-pointer">
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<input type="hidden" name="visitType" bind:value={formData.visitType} />
				</div>

				<div class="space-y-2">
					<Label for="severity">Severity</Label>
					<Select.Root bind:value={formData.severity} type="single">
						<Select.Trigger class="w-full" id="severity">
							{formData.severity
								? (severityOptions.find((opt) => opt.value === formData.severity)?.label ?? 'Low')
								: 'Select severity'}
						</Select.Trigger>
						<Select.Content>
							{#each severityOptions as option}
								<Select.Item
									value={option.value}
									class={cn(
										'cursor-pointer',
										option.value === 'critical' && 'text-destructive',
										option.value === 'high' && 'text-orange-600',
										option.value === 'medium' && 'text-yellow-600'
									)}
								>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<input type="hidden" name="severity" bind:value={formData.severity} />
				</div>
			</div>

			<!-- Emergency flag (hidden input) -->
			<input type="hidden" name="isEmergency" value={formData.isEmergency.toString()} />

			<!-- Reason -->
			<div class="space-y-2">
				<Label for="reason">Reason for Visit *</Label>
				<Input
					id="reason"
					name="reason"
					placeholder="e.g., Headache, Stomach pain, Injury..."
					bind:value={formData.reason}
					required
					class="w-full"
				/>
			</div>

			<!-- Details -->
			<div class="space-y-2">
				<Label for="details">Details</Label>
				<Textarea
					id="details"
					name="details"
					placeholder="Describe symptoms, when they started, severity, etc."
					bind:value={formData.details}
					rows={3}
					class="min-h-20"
				/>
			</div>

			<!-- Medications Given -->
			<div class="space-y-2">
				<Label for="medicationsGiven">Medications Given</Label>
				<Textarea
					id="medicationsGiven"
					name="medicationsGiven"
					placeholder="List any medications, dosages, and times administered..."
					bind:value={formData.medicationsGiven}
					rows={2}
				/>
			</div>

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
				<Button type="submit" disabled={submitting || !formData.reason.trim() || !formData.nurseId}>
					{#if submitting}
						<Loader2 class="mr-2 size-4 animate-spin" />
						Creating Visit...
					{:else}
						<Plus class="mr-2 size-4" />
						Create Visit
					{/if}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
