<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import StaffFormModal from '$lib/components/staff-form-modal.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { cn } from '$lib/utils.js';
	import {
		Edit,
		Mail,
		MoreHorizontal,
		Phone,
		Plus,
		Search,
		ShieldCheck,
		Stethoscope,
		UserCheck,
		UserMinus,
		UserPlus,
		Users
	} from '@lucide/svelte';
	import { onMount } from 'svelte';

	// Define the staff type based on the server load data
	type StaffMember = {
		id: string;
		email: string;
		firstName: string;
		lastName: string;
		role: 'nurse' | 'doctor' | 'admin' | 'staff';
		phoneNumber: string | null;
		isActive: boolean;
		lastLogin: Date | null;
		createdAt: Date;
		updatedAt: Date;
	};

	let { data } = $props();

	// Modal state
	let staffModalOpen = $state(false);
	let staffModalMode: 'add' | 'edit' = $state('add');
	let selectedStaff = $state<StaffMember | null>(null);

	// Filters and search
	let searchQuery = $state('');
	let roleFilter = $state('all');
	let statusFilter = $state('all');

	// Form submission state
	let submitting = $state(false);

	// Filter staff based on search and filters
	const filteredStaff = $derived.by(() => {
		let filtered = data.staff as StaffMember[];

		// Search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(staff) =>
					staff.firstName.toLowerCase().includes(query) ||
					staff.lastName.toLowerCase().includes(query) ||
					staff.email.toLowerCase().includes(query) ||
					staff.role.toLowerCase().includes(query)
			);
		}

		// Role filter
		if (roleFilter !== 'all') {
			filtered = filtered.filter((staff) => staff.role === roleFilter);
		}

		// Status filter
		if (statusFilter !== 'all') {
			const isActive = statusFilter === 'active';
			filtered = filtered.filter((staff) => staff.isActive === isActive);
		}

		return filtered;
	});

	// Handle opening add modal
	function openAddModal() {
		selectedStaff = null;
		staffModalMode = 'add';
		staffModalOpen = true;
	}

	// Handle opening edit modal
	function openEditModal(staff: any) {
		selectedStaff = staff;
		staffModalMode = 'edit';
		staffModalOpen = true;
	}

	// Handle staff action (delete/activate)
	async function handleStaffAction(action: string, staffId: string) {
		submitting = true;

		const formData = new FormData();
		formData.append('id', staffId);

		try {
			const response = await fetch('?/' + action, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Error performing action:', error);
		} finally {
			submitting = false;
		}
	}

	// Format role for display
	function formatRole(role: string) {
		switch (role) {
			case 'nurse':
				return 'Nurse';
			case 'doctor':
				return 'Doctor';
			case 'admin':
				return 'Admin';
			case 'staff':
				return 'Staff';
			default:
				return role;
		}
	}

	// Get role icon
	function getRoleIcon(role: string) {
		switch (role) {
			case 'nurse':
				return UserCheck;
			case 'doctor':
				return Stethoscope;
			case 'admin':
				return ShieldCheck;
			case 'staff':
				return Users;
			default:
				return UserCheck;
		}
	}

	// Get role color
	function getRoleColor(role: string) {
		switch (role) {
			case 'nurse':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
			case 'doctor':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
			case 'admin':
				return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
			case 'staff':
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		}
	}

	// Format date
	function formatDate(date: Date | string) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Format last login
	function formatLastLogin(lastLogin: Date | string | null) {
		if (!lastLogin) return 'Never';

		const date = typeof lastLogin === 'string' ? new Date(lastLogin) : lastLogin;
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;

		return formatDate(date);
	}
	onMount(() => {
		// Any initialization logic
	});
</script>

<div class="mx-5 w-full space-y-6 p-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Staffs</h1>
			<p class="text-muted-foreground">Manage nurses, doctors, and other staff members</p>
		</div>
		<Button onclick={openAddModal} class="gap-2">
			<UserPlus class="size-4" />
			Add Staff Member
		</Button>
	</div>

	<!-- Statistics Cards -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Total Staff</Card.Title>
				<Users class="size-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.stats.total}</div>
				<p class="text-xs text-muted-foreground">
					{data.stats.active} active, {data.stats.inactive} inactive
				</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Nurses</Card.Title>
				<UserCheck class="size-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.stats.nurses}</div>
				<p class="text-xs text-muted-foreground">Active nursing staff</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Doctors</Card.Title>
				<Stethoscope class="size-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.stats.doctors}</div>
				<p class="text-xs text-muted-foreground">Medical practitioners</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Admins</Card.Title>
				<ShieldCheck class="size-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.stats.admins}</div>
				<p class="text-xs text-muted-foreground">System administrators</p>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Filters and Search -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Staff Management</Card.Title>
			<Card.Description>View and manage all staff members in the system</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
				<!-- Search -->
				<div class="flex-1">
					<Label for="search" class="sr-only">Search staff</Label>
					<div class="relative">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							id="search"
							placeholder="Search by name, email, or role..."
							bind:value={searchQuery}
							class="pl-10"
						/>
					</div>
				</div>

				<!-- Role Filter -->
				<div class="w-full md:w-auto">
					<Label for="roleFilter" class="sr-only">Filter by role</Label>
					<Select.Root bind:value={roleFilter} type="single">
						<Select.Trigger class="w-full md:w-[140px]">
							{roleFilter === 'all' ? 'All Roles' : formatRole(roleFilter)}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="all">All Roles</Select.Item>
							<Select.Item value="nurse">Nurses</Select.Item>
							<Select.Item value="doctor">Doctors</Select.Item>
							<Select.Item value="admin">Admins</Select.Item>
							<Select.Item value="staff">Staff</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				<!-- Status Filter -->
				<div class="w-full md:w-auto">
					<Label for="statusFilter" class="sr-only">Filter by status</Label>
					<Select.Root bind:value={statusFilter} type="single">
						<Select.Trigger class="w-full md:w-[140px]">
							{statusFilter === 'all'
								? 'All Status'
								: statusFilter === 'active'
									? 'Active'
									: 'Inactive'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="all">All Status</Select.Item>
							<Select.Item value="active">Active</Select.Item>
							<Select.Item value="inactive">Inactive</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Staff Table -->
	<Card.Root class="p-0">
		<Card.Content class="p-0">
			<div class="overflow-x-auto">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Staff Member</Table.Head>
							<Table.Head>Role</Table.Head>
							<Table.Head>Contact</Table.Head>
							<Table.Head>Joined</Table.Head>
							<Table.Head class="w-[50px]"></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredStaff as staff (staff.id)}
							{@const RoleIcon = getRoleIcon(staff.role)}
							<Table.Row>
								<Table.Cell>
									<div class="flex items-center gap-3">
										<div class="flex size-10 items-center justify-center rounded-full bg-muted">
											<RoleIcon class="size-5" />
										</div>
										<div>
											<div class="font-medium">
												{staff.firstName}
												{staff.lastName}
											</div>
											<div class="text-sm text-muted-foreground">
												{staff.email}
											</div>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge class={cn('text-xs', getRoleColor(staff.role))}>
										{formatRole(staff.role)}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									<div class="space-y-1">
										<div class="flex items-center gap-1 text-sm">
											<Mail class="size-3" />
											<a href="mailto:{staff.email}" class="hover:underline">
												{staff.email}
											</a>
										</div>
										{#if staff.phoneNumber}
											<div class="flex items-center gap-1 text-sm text-muted-foreground">
												<Phone class="size-3" />
												<a href="tel:{staff.phoneNumber}" class="hover:underline">
													{staff.phoneNumber}
												</a>
											</div>
										{/if}
									</div>
								</Table.Cell>
								<Table.Cell>
									<span class="text-sm text-muted-foreground">
										{formatDate(staff.createdAt)}
									</span>
								</Table.Cell>
								<Table.Cell>
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											<Button variant="ghost" size="sm" class="size-8 p-0">
												<MoreHorizontal class="size-4" />
												<span class="sr-only">Actions</span>
											</Button>
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Item
												class="cursor-pointer"
												onclick={() => openEditModal(staff)}
											>
												<Edit class="mr-2 size-4" />
												Edit
											</DropdownMenu.Item>
											{#if staff.isActive}
												<DropdownMenu.Item
													onclick={() => handleStaffAction('deleteStaff', staff.id)}
													disabled={submitting}
													class="cursor-pointer text-red-600"
												>
													<UserMinus class="mr-2 size-4" />
													Deactivate
												</DropdownMenu.Item>
											{:else}
												<DropdownMenu.Item
													onclick={() => handleStaffAction('activateStaff', staff.id)}
													disabled={submitting}
													class="cursor-pointer text-green-600"
												>
													<UserPlus class="mr-2 size-4" />
													Activate
												</DropdownMenu.Item>
											{/if}
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</Table.Cell>
							</Table.Row>
						{:else}
							<Table.Row>
								<Table.Cell colspan={7} class="text-center py-8">
									<div class="flex flex-col items-center gap-2">
										<Users class="size-8 text-muted-foreground" />
										<p class="text-muted-foreground">
											{searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
												? 'No staff members match your filters'
												: 'No staff members found'}
										</p>
										{#if !searchQuery && roleFilter === 'all' && statusFilter === 'all'}
											<Button onclick={openAddModal} size="sm" class="gap-2">
												<Plus class="size-4" />
												Add First Staff Member
											</Button>
										{/if}
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</Card.Content>
	</Card.Root>
</div>

<!-- Staff Form Modal -->
{#if staffModalOpen}
	<StaffFormModal bind:open={staffModalOpen} mode={staffModalMode} staff={selectedStaff} />
{/if}
