<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { toTitleCase } from '$lib/utils.js';
	import { Loader2 } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	// Types
	type Staff = {
		id?: string;
		email: string;
		firstName: string;
		lastName: string;
		role: 'nurse' | 'doctor' | 'admin' | 'staff';
		phoneNumber?: string | null;
		profileUrl?: string | null;
		isActive?: boolean;
	};

	// Props
	let {
		open = $bindable(false),
		mode = 'add',
		staff = null
	}: {
		open?: boolean;
		mode?: 'add' | 'edit';
		staff?: Staff | null;
	} = $props();

	// Form state
	let submitting = $state(false);
	let errors = $state<Record<string, string[]>>({});

	// Role options
	const roleOptions = [
		{ value: 'nurse', label: 'Nurse' },
		{ value: 'doctor', label: 'Doctor' },
		{ value: 'admin', label: 'Admin' },
		{ value: 'staff', label: 'Staff' }
	];

	// Form values
	let formData = $state({
		email: '',
		firstName: '',
		lastName: '',
		role: '',
		phoneNumber: '',
		profileUrl: ''
	});

	// Initialize form with staff data when editing
	onMount(() => {
		if (mode === 'edit' && staff) {
			populateFormData(staff);
		} else if (mode === 'add') {
			resetForm();
		}
	});

	// React to changes in staff prop and mode for editing
	onMount(() => {
		if (mode === 'edit' && staff && open) {
			populateFormData(staff);
		} else if (mode === 'add' && open) {
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

	function populateFormData(staffData: Staff) {
		formData = {
			email: staffData.email || '',
			firstName: staffData.firstName || '',
			lastName: staffData.lastName || '',
			role: staffData.role || '',
			phoneNumber: staffData.phoneNumber || '',
			profileUrl: staffData.profileUrl || ''
		};
	}

	function resetForm() {
		formData = {
			email: '',
			firstName: '',
			lastName: '',
			role: '',
			phoneNumber: '',
			profileUrl: ''
		};
		errors = {};
	}

	// Computed values
	const dialogTitle = $derived(mode === 'edit' ? 'Edit Staff Member' : 'Add New Staff Member');
	const dialogDescription = $derived(
		mode === 'edit'
			? "Update the staff member's information."
			: "Enter the staff member's information."
	);
	const submitButtonText = $derived(mode === 'edit' ? 'Update Staff' : 'Add Staff');
	const submittingText = $derived(mode === 'edit' ? 'Updating...' : 'Adding...');
	const formAction = $derived(mode === 'edit' ? '?/updateStaff' : '?/addStaff');
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>{dialogTitle}</Dialog.Title>
			<Dialog.Description>
				{dialogDescription}
			</Dialog.Description>
		</Dialog.Header>

		<form
			method="POST"
			action={formAction}
			use:enhance={() => {
				submitting = true;
				return async ({ result, formData }) => {
					submitting = false;

					if (result.type === 'failure') {
						errors = (result.data?.errors as any) || {};
						toast.error(`Failed to ${mode} staff member`, {
							description: 'Please check the form for errors and try again.'
						});
					} else if (result.type === 'success') {
						const action = mode === 'edit' ? 'updated' : 'added';
						toast.success(`Staff member ${action} successfully!`, {
							description: `${formData.get('firstName')} ${formData.get('lastName')} has been ${action}.`
						});
						await invalidateAll();
						open = false;
					} else if (result.type === 'error') {
						toast.error(`Failed to ${mode} staff member`, {
							description: 'An unexpected error occurred. Please try again.'
						});
					}
				};
			}}
			class="space-y-4"
		>
			<!-- Hidden field for staff ID when editing -->
			{#if mode === 'edit' && staff?.id}
				<input type="hidden" name="id" value={staff.id} />
			{/if}

			<!-- Email -->
			<div class="space-y-2">
				<Label for="email">Email *</Label>
				<Input
					id="email"
					name="email"
					type="email"
					bind:value={formData.email}
					placeholder="Enter email address"
					class="w-full"
					required
					readonly={mode === 'edit'}
				/>
				{#if errors.email}
					<p class="text-sm text-destructive">{errors.email[0]}</p>
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

			<!-- Role -->
			<div class="space-y-2">
				<Label>Role *</Label>
				<Select.Root bind:value={formData.role} type="single">
					<Select.Trigger class="w-full">
						{formData.role ? toTitleCase(formData.role) : 'Select role'}
					</Select.Trigger>
					<Select.Content>
						{#each roleOptions as role}
							<Select.Item value={role.value}>{role.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
				<input type="hidden" name="role" bind:value={formData.role} />
				{#if errors.role}
					<p class="text-sm text-destructive">{errors.role[0]}</p>
				{/if}
			</div>

			<!-- Phone Number -->
			<div class="space-y-2">
				<Label for="phoneNumber">Phone Number</Label>
				<Input
					id="phoneNumber"
					name="phoneNumber"
					type="tel"
					bind:value={formData.phoneNumber}
					placeholder="Enter phone number (optional)"
					class="w-full"
				/>
				{#if errors.phoneNumber}
					<p class="text-sm text-destructive">{errors.phoneNumber[0]}</p>
				{/if}
			</div>

			<!-- Profile URL -->
			<div class="space-y-2">
				<Label for="profileUrl">Profile Picture URL</Label>
				<Input
					id="profileUrl"
					name="profileUrl"
					type="url"
					bind:value={formData.profileUrl}
					placeholder="Enter profile picture URL (optional)"
					class="w-full"
				/>
				{#if errors.profileUrl}
					<p class="text-sm text-destructive">{errors.profileUrl[0]}</p>
				{/if}
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
	</Dialog.Content>
</Dialog.Root>
