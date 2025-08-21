<script lang="ts">
	import { enhance } from '$app/forms';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Textarea } from '$lib/components/ui/textarea';
	import { toast } from 'svelte-sonner';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let isUpdatingProfile = false;
	let isChangingPassword = false;
	let isCreatingApiKey = false;
	let showNewApiKey = false;
	let newApiKeyValue = '';

	// Form data
	let profileForm = {
		firstName: data.user.firstName,
		lastName: data.user.lastName,
		email: data.user.email,
		phoneNumber: data.user.phoneNumber || ''
	};

	let passwordForm = {
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	};

	let apiKeyForm = {
		description: ''
	};

	// Handle form responses
	$: if (form?.success) {
		if (form.message.includes('Profile')) {
			toast.success(form.message);
			isUpdatingProfile = false;
		} else if (form.message.includes('Password')) {
			toast.success(form.message);
			isChangingPassword = false;
			passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
		} else if (form.message.includes('API key')) {
			toast.success(form.message);
			if (form.apiKey) {
				newApiKeyValue = form.apiKey;
				showNewApiKey = true;
			}
			isCreatingApiKey = false;
			apiKeyForm.description = '';
		}
	} else if (form?.message) {
		toast.error(form.message);
		isUpdatingProfile = false;
		isChangingPassword = false;
		isCreatingApiKey = false;
	}

	function copyApiKey(apiKey: string) {
		navigator.clipboard.writeText(apiKey);
		toast.success('API key copied to clipboard');
	}

	function formatDate(date: Date | string) {
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Settings - MediSYNC</title>
</svelte:head>

<div class="container mx-auto space-y-8 px-4 py-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Settings</h1>
			<p class="text-muted-foreground">Manage your profile, security, and API access.</p>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-3">
		<!-- Profile Settings -->
		<Card class="lg:col-span-2">
			<CardHeader>
				<CardTitle>Profile Information</CardTitle>
				<CardDescription>Update your personal information and contact details.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<form
					method="POST"
					action="?/updateProfile"
					use:enhance={() => {
						isUpdatingProfile = true;
						return async ({ update }) => {
							await update();
							isUpdatingProfile = false;
						};
					}}
				>
					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="firstName">First Name</Label>
							<Input
								id="firstName"
								name="firstName"
								bind:value={profileForm.firstName}
								required
								disabled={isUpdatingProfile}
							/>
						</div>
						<div class="space-y-2">
							<Label for="lastName">Last Name</Label>
							<Input
								id="lastName"
								name="lastName"
								bind:value={profileForm.lastName}
								required
								disabled={isUpdatingProfile}
							/>
						</div>
					</div>
					<div class="my-3 flex flex-col gap-3">
						<div class="space-y-2">
							<Label for="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								bind:value={profileForm.email}
								required
								disabled={isUpdatingProfile}
							/>
						</div>
						<div class="space-y-2">
							<Label for="phoneNumber">Phone Number</Label>
							<Input
								id="phoneNumber"
								name="phoneNumber"
								type="tel"
								bind:value={profileForm.phoneNumber}
								disabled={isUpdatingProfile}
							/>
						</div>
					</div>
					<Button type="submit" disabled={isUpdatingProfile} class="w-full">
						{isUpdatingProfile ? 'Updating...' : 'Update Profile'}
					</Button>
				</form>
			</CardContent>
		</Card>

		<!-- Account Info -->
		<Card>
			<CardHeader>
				<CardTitle>Account Information</CardTitle>
				<CardDescription>Your account details and status.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label>Role</Label>
					<Badge variant={data.user.role === 'admin' ? 'default' : 'secondary'}>
						{data.user.role.charAt(0).toUpperCase() + data.user.role.slice(1)}
					</Badge>
				</div>
				<div class="space-y-2">
					<Label>Status</Label>
					<Badge variant={data.user.isActive ? 'default' : 'destructive'}>
						{data.user.isActive ? 'Active' : 'Inactive'}
					</Badge>
				</div>
				<div class="space-y-2">
					<Label>Member Since</Label>
					<p class="text-sm text-muted-foreground">{formatDate(data.user.createdAt)}</p>
				</div>
				{#if data.user.lastLogin}
					<div class="space-y-2">
						<Label>Last Login</Label>
						<p class="text-sm text-muted-foreground">{formatDate(data.user.lastLogin)}</p>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Password Change -->
		<Card class="lg:col-span-2">
			<CardHeader>
				<CardTitle>Change Password</CardTitle>
				<CardDescription>Update your password to keep your account secure.</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					method="POST"
					action="?/changePassword"
					use:enhance={() => {
						isChangingPassword = true;
						return async ({ update }) => {
							await update();
							isChangingPassword = false;
						};
					}}
				>
					<div class="space-y-4">
						<div class="space-y-2">
							<Label for="currentPassword">Current Password</Label>
							<Input
								id="currentPassword"
								name="currentPassword"
								type="password"
								bind:value={passwordForm.currentPassword}
								required
								disabled={isChangingPassword}
							/>
						</div>
						<div class="space-y-2">
							<Label for="newPassword">New Password</Label>
							<Input
								id="newPassword"
								name="newPassword"
								type="password"
								bind:value={passwordForm.newPassword}
								required
								disabled={isChangingPassword}
								minlength={8}
							/>
						</div>
						<div class="space-y-2">
							<Label for="confirmPassword">Confirm New Password</Label>
							<Input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								bind:value={passwordForm.confirmPassword}
								required
								disabled={isChangingPassword}
								minlength={8}
							/>
						</div>
						<Button type="submit" disabled={isChangingPassword} class="w-full">
							{isChangingPassword ? 'Changing Password...' : 'Change Password'}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>

		<!-- API Keys (Admin Only) -->
		{#if data.user.role === 'admin'}
			<Card class="lg:col-span-3">
				<CardHeader>
					<CardTitle>API Key Management</CardTitle>
					<CardDescription>Manage API keys for QR code scanner.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<!-- Create New API Key -->
					<Card>
						<CardHeader>
							<CardTitle class="text-lg">Create New API Key</CardTitle>
							<CardDescription>Generate a new API key for external access.</CardDescription>
						</CardHeader>
						<CardContent>
							<form
								method="POST"
								action="?/createApiKey"
								use:enhance={() => {
									isCreatingApiKey = true;
									return async ({ update }) => {
										await update();
										isCreatingApiKey = false;
									};
								}}
							>
								<div class="space-y-4">
									<div class="space-y-2">
										<Label for="description">Description</Label>
										<Textarea
											id="description"
											name="description"
											placeholder="e.g., Mobile app integration, Third-party service access..."
											bind:value={apiKeyForm.description}
											required
											disabled={isCreatingApiKey}
										/>
									</div>
									<Button type="submit" disabled={isCreatingApiKey}>
										{isCreatingApiKey ? 'Creating...' : 'Create API Key'}
									</Button>
								</div>
							</form>

							<!-- Show newly created API key -->
							{#if showNewApiKey && newApiKeyValue}
								<div
									class="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950"
								>
									<h4 class="mb-2 font-semibold text-green-800 dark:text-green-200">
										API Key Created Successfully!
									</h4>
									<p class="mb-3 text-sm text-green-700 dark:text-green-300">
										Please copy this API key now. You won't be able to see it again for security
										reasons.
									</p>
									<div class="flex items-center gap-2">
										<Input
											value={newApiKeyValue}
											readonly
											class="bg-white font-mono text-sm dark:bg-green-900"
										/>
										<Button size="sm" variant="outline" onclick={() => copyApiKey(newApiKeyValue)}>
											Copy
										</Button>
									</div>
									<Button
										size="sm"
										variant="ghost"
										class="mt-2"
										onclick={() => (showNewApiKey = false)}
									>
										Dismiss
									</Button>
								</div>
							{/if}
						</CardContent>
					</Card>

					<Separator />

					<!-- Existing API Keys -->
					<div class="space-y-4">
						<h3 class="text-lg font-semibold">Existing API Keys</h3>
						{#if data.apiKeys.length === 0}
							<Card>
								<CardContent class="pt-6">
									<div class="text-center text-muted-foreground">
										<p>No API keys found.</p>
										<p class="text-sm">Create your first API key above to get started.</p>
									</div>
								</CardContent>
							</Card>
						{:else}
							<div class="grid gap-4">
								{#each data.apiKeys as apiKey}
									<Card>
										<CardContent class="">
											<div class="flex items-center justify-between">
												<div class="space-y-1">
													<div class="flex items-center gap-2">
														<p class="font-medium">{apiKey.description}</p>
														<Badge variant={apiKey.isActive ? 'secondary' : 'destructive'}>
															{apiKey.isActive ? 'Active' : 'Inactive'}
														</Badge>
													</div>
													<p class="text-sm text-muted-foreground">
														Created: {formatDate(apiKey.createdAt)}
													</p>
												</div>
												<div class="flex items-center gap-2">
													<form method="POST" action="?/toggleApiKey" use:enhance>
														<input type="hidden" name="keyId" value={apiKey.id} />
														<Button size="sm" variant="outline" type="submit">
															{apiKey.isActive ? 'Disable' : 'Enable'}
														</Button>
													</form>
													<form method="POST" action="?/deleteApiKey" use:enhance>
														<input type="hidden" name="keyId" value={apiKey.id} />
														<Button size="sm" variant="destructive" type="submit">Delete</Button>
													</form>
												</div>
											</div>
										</CardContent>
									</Card>
								{/each}
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>
		{/if}
	</div>
</div>
