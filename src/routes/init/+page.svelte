<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { CheckCircle, Loader2, Shield, UserPlus } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	// Form state
	let submitting = $state(false);
	let errors = $state<Record<string, string[]>>({});

	// Form values
	let formData = $state({
		email: '',
		firstName: '',
		lastName: '',
		password: '',
		confirmPassword: '',
		phoneNumber: ''
	});

	// Password visibility
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);

	// Password strength validation
	const passwordRequirements = $derived([
		{ text: 'At least 8 characters', met: formData.password.length >= 8 },
		{ text: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
		{ text: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
		{ text: 'Contains number', met: /\d/.test(formData.password) },
		{ text: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) }
	]);

	const passwordStrength = $derived(passwordRequirements.filter((req) => req.met).length);
	const passwordStrengthText = $derived(
		passwordStrength === 0
			? ''
			: passwordStrength <= 2
				? 'Weak'
				: passwordStrength <= 3
					? 'Fair'
					: passwordStrength <= 4
						? 'Good'
						: 'Strong'
	);
	const passwordStrengthColor = $derived(
		passwordStrength <= 2
			? 'text-red-500'
			: passwordStrength <= 3
				? 'text-yellow-500'
				: passwordStrength <= 4
					? 'text-blue-500'
					: 'text-green-500'
	);

	// Passwords match validation
	const passwordsMatch = $derived(
		formData.password && formData.confirmPassword && formData.password === formData.confirmPassword
	);

	function resetForm() {
		formData = {
			email: '',
			firstName: '',
			lastName: '',
			password: '',
			confirmPassword: '',
			phoneNumber: ''
		};
		errors = {};
	}
</script>

<svelte:head>
	<title>Setup Admin Account - CareLog</title>
	<meta
		name="description"
		content="Create your administrator account to get started with CareLog"
	/>
</svelte:head>

<!-- Full-screen centered layout -->
<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
>
	<div class="w-full max-w-md space-y-6">
		<!-- Header Section -->
		<div class="space-y-4 text-center">
			<div class="flex justify-center">
				<div class="flex items-center gap-3">
					<img src="/logo.png" alt="CareLog logo" class="size-16 rounded-xl text-white shadow-lg" />
				</div>
			</div>
			<div class="space-y-2">
				<h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
					Welcome to CareLog
				</h1>
				<p class="text-gray-600 dark:text-gray-300">
					Set up your administrator account to get started
				</p>
			</div>
		</div>

		<!-- Setup Card -->
		<Card.Root class="border-0 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-gray-800/80">
			<Card.Header class="space-y-2 pb-4">
				<div class="flex items-center gap-2 text-blue-600 dark:text-blue-400">
					<Shield class="h-5 w-5" />
					<Card.Title class="text-xl">Create Admin Account</Card.Title>
				</div>
				<Card.Description class="text-gray-600 dark:text-gray-300">
					This will be the main administrator account for your school clinic system.
				</Card.Description>
			</Card.Header>

			<Card.Content>
				<form
					method="POST"
					action="?/createAdmin"
					use:enhance={() => {
						submitting = true;
						return async ({ result }) => {
							submitting = false;

							if (result.type === 'failure') {
								errors = (result.data?.errors as any) || {};
								toast.error('Setup failed', {
									description: 'Please check the form for errors and try again.'
								});
							} else if (result.type === 'redirect') {
								toast.success('Setup completed successfully!', {
									description: 'Your admin account has been created. Redirecting to login...'
								});
								goto(result.location);
							} else if (result.type === 'error') {
								toast.error('Setup error', {
									description: 'An unexpected error occurred. Please try again.'
								});
							}
						};
					}}
					class="space-y-5"
				>
					<!-- Error display -->
					{#if errors.general}
						<div
							class="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20"
						>
							<p class="text-sm text-red-800 dark:text-red-200">{errors.general[0]}</p>
						</div>
					{/if}

					<!-- Personal Information -->
					<div class="space-y-4">
						<h3
							class="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100"
						>
							<UserPlus class="h-4 w-4" />
							Personal Information
						</h3>

						<div class="grid grid-cols-2 gap-3">
							<!-- First Name -->
							<div class="space-y-2">
								<Label for="firstName" class="text-sm font-medium">First Name *</Label>
								<Input
									id="firstName"
									name="firstName"
									bind:value={formData.firstName}
									placeholder="John"
									class="w-full {errors.firstName ? 'border-red-500' : ''}"
									required
									disabled={submitting}
								/>
								{#if errors.firstName}
									<p class="text-xs text-red-600 dark:text-red-400">{errors.firstName[0]}</p>
								{/if}
							</div>

							<!-- Last Name -->
							<div class="space-y-2">
								<Label for="lastName" class="text-sm font-medium">Last Name *</Label>
								<Input
									id="lastName"
									name="lastName"
									bind:value={formData.lastName}
									placeholder="Doe"
									class="w-full {errors.lastName ? 'border-red-500' : ''}"
									required
									disabled={submitting}
								/>
								{#if errors.lastName}
									<p class="text-xs text-red-600 dark:text-red-400">{errors.lastName[0]}</p>
								{/if}
							</div>
						</div>

						<!-- Email -->
						<div class="space-y-2">
							<Label for="email" class="text-sm font-medium">Email Address *</Label>
							<Input
								id="email"
								name="email"
								type="email"
								bind:value={formData.email}
								placeholder="admin@school.edu"
								class="w-full {errors.email ? 'border-red-500' : ''}"
								required
								disabled={submitting}
							/>
							{#if errors.email}
								<p class="text-xs text-red-600 dark:text-red-400">{errors.email[0]}</p>
							{/if}
						</div>

						<!-- Phone Number -->
						<div class="space-y-2">
							<Label for="phoneNumber" class="text-sm font-medium">Phone Number</Label>
							<Input
								id="phoneNumber"
								name="phoneNumber"
								type="tel"
								bind:value={formData.phoneNumber}
								placeholder="+1 (555) 123-4567"
								class="w-full {errors.phoneNumber ? 'border-red-500' : ''}"
								disabled={submitting}
							/>
							{#if errors.phoneNumber}
								<p class="text-xs text-red-600 dark:text-red-400">{errors.phoneNumber[0]}</p>
							{/if}
						</div>
					</div>

					<!-- Security Section -->
					<div class="space-y-4">
						<h3
							class="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100"
						>
							<Shield class="h-4 w-4" />
							Security
						</h3>

						<!-- Password -->
						<div class="space-y-2">
							<Label for="password" class="text-sm font-medium">Password *</Label>
							<div class="relative">
								<Input
									id="password"
									name="password"
									type={showPassword ? 'text' : 'password'}
									bind:value={formData.password}
									placeholder="Create a strong password"
									class="w-full pr-10 {errors.password ? 'border-red-500' : ''}"
									required
									disabled={submitting}
								/>
								<button
									type="button"
									onclick={() => (showPassword = !showPassword)}
									class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
									disabled={submitting}
								>
									{#if showPassword}
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 21.536"
											/>
										</svg>
									{:else}
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
											/>
										</svg>
									{/if}
								</button>
							</div>

							<!-- Password strength indicator -->
							{#if formData.password}
								<div class="space-y-2">
									<div class="flex items-center gap-2">
										<div class="h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
											<div
												class="h-1.5 rounded-full bg-gradient-to-r transition-all duration-300 {passwordStrength <=
												2
													? 'from-red-500 to-red-600'
													: passwordStrength <= 3
														? 'from-yellow-500 to-yellow-600'
														: passwordStrength <= 4
															? 'from-blue-500 to-blue-600'
															: 'from-green-500 to-green-600'}"
												style="width: {(passwordStrength / 5) * 100}%"
											></div>
										</div>
										{#if passwordStrengthText}
											<span class="text-xs font-medium {passwordStrengthColor}">
												{passwordStrengthText}
											</span>
										{/if}
									</div>

									<div class="grid grid-cols-1 gap-1">
										{#each passwordRequirements as req}
											<div class="flex items-center gap-2 text-xs">
												{#if req.met}
													<CheckCircle class="h-3 w-3 text-green-500" />
												{:else}
													<div
														class="h-3 w-3 rounded-full border border-gray-300 dark:border-gray-600"
													></div>
												{/if}
												<span
													class="text-gray-600 dark:text-gray-300 {req.met
														? 'line-through opacity-60'
														: ''}"
												>
													{req.text}
												</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							{#if errors.password}
								<p class="text-xs text-red-600 dark:text-red-400">{errors.password[0]}</p>
							{/if}
						</div>

						<!-- Confirm Password -->
						<div class="space-y-2">
							<Label for="confirmPassword" class="text-sm font-medium">Confirm Password *</Label>
							<div class="relative">
								<Input
									id="confirmPassword"
									name="confirmPassword"
									type={showConfirmPassword ? 'text' : 'password'}
									bind:value={formData.confirmPassword}
									placeholder="Confirm your password"
									class="w-full pr-10 
                    {errors.confirmPassword ? 'border-red-500' : ''} 
                    {passwordsMatch && formData.confirmPassword ? 'border-green-500' : ''}"
									required
									disabled={submitting}
								/>
								<button
									type="button"
									onclick={() => (showConfirmPassword = !showConfirmPassword)}
									class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
									disabled={submitting}
								>
									{#if showConfirmPassword}
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 21.536"
											/>
										</svg>
									{:else}
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
											/>
										</svg>
									{/if}
								</button>

								{#if passwordsMatch && formData.confirmPassword}
									<CheckCircle
										class="absolute top-1/2 right-10 h-4 w-4 -translate-y-1/2 text-green-500"
									/>
								{/if}
							</div>

							{#if errors.confirmPassword}
								<p class="text-xs text-red-600 dark:text-red-400">{errors.confirmPassword[0]}</p>
							{/if}
						</div>
					</div>

					<!-- Submit Button -->
					<Button
						type="submit"
						class="w-full bg-gradient-to-r from-blue-600 to-green-600 py-2.5 font-medium text-white hover:from-blue-700 hover:to-green-700"
						disabled={submitting}
						size="lg"
					>
						{#if submitting}
							<Loader2 class="mr-2 h-5 w-5 animate-spin" />
							Creating Account...
						{:else}
							<Shield class="mr-2 h-5 w-5" />
							Create Admin Account
						{/if}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>

		<!-- Footer Info -->
		<div class="space-y-2 text-center">
			<p class="text-sm text-gray-500 dark:text-gray-400">
				This account will have full administrative privileges
			</p>
			<p class="text-xs text-gray-400 dark:text-gray-500">
				CareLog v1.0 - School Clinic Management System
			</p>
		</div>
	</div>
</div>

<style>
	/* Custom focus styles for better accessibility */
	:global(.border-red-500:focus) {
		box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
	}

	:global(.border-green-500:focus) {
		box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
	}
</style>
