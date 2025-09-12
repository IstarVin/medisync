<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import AppLogo from '$lib/components/app-logo.svelte';
	import ThemeSwitcher from '$lib/components/theme-switcher.svelte';
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
	import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let email = $state('');
	let password = $state('');
	let submitting = $state(false);
	let showPassword = $state(false);
	let emailError = $state('');
	let passwordError = $state('');

	let formError = $derived(page.form?.error);

	// Validate email format
	function validateEmail() {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email) {
			emailError = 'Email is required';
		} else if (!emailRegex.test(email)) {
			emailError = 'Please enter a valid email address';
		} else {
			emailError = '';
		}
	}

	// Validate password
	function validatePassword() {
		if (!password) {
			passwordError = 'Password is required';
		} else if (password.length < 3) {
			passwordError = 'Password must be at least 3 characters';
		} else {
			passwordError = '';
		}
	}

	// Check if form is valid
	let isFormValid = $derived(email && password && !emailError && !passwordError);

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}
</script>

<svelte:head>
	<title>Login</title>
</svelte:head>

<div
	class="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
>
	<!-- Theme Switcher -->
	<div class="absolute top-4 right-4 z-10">
		<ThemeSwitcher />
	</div>

	<!-- Main Content -->
	<div class="relative flex min-h-screen items-center justify-center p-4">
		<div class="w-full max-w-md">
			<!-- Logo and Header -->
			<div class="mb-8 text-center">
				<div class="mb-6 flex justify-center">
					<div class="scale-125">
						<AppLogo showSubtitle={false} />
					</div>
				</div>
				<div class="space-y-2">
					<h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
						Welcome Back
					</h1>
					<p class="text-sm text-slate-600 dark:text-slate-400">
						Sign in to access your CareLog dashboard
					</p>
				</div>
			</div>

			<!-- Login Card -->
			<Card class="border-0 bg-white/70 shadow-xl backdrop-blur-sm dark:bg-slate-800/70">
				<CardHeader class="space-y-1 pb-4">
					<CardTitle class="flex items-center gap-2 text-xl">
						<ShieldCheck class="h-5 w-5 text-blue-600 dark:text-blue-400" />
						Secure Login
					</CardTitle>
					<CardDescription>
						Enter your credentials to access the clinic management system
					</CardDescription>
				</CardHeader>

				<CardContent>
					<form
						method="POST"
						class="space-y-4"
						use:enhance={() => {
							submitting = true;
							return async ({ result, update }) => {
								if (result.type === 'success') {
									toast.success('Login successful!', {
										description: 'Welcome back to CareLog.'
									});
								} else if (result.type === 'failure') {
									toast.error('Login failed', {
										description: 'Invalid email or password.'
									});
								} else if (result.type === 'error') {
									toast.error('Login error', {
										description: 'An unexpected error occurred. Please try again.'
									});
								}
								await update();
								submitting = false;
							};
						}}
					>
						<!-- Form Error Display -->
						{#if formError}
							<div
								class="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
							>
								<AlertCircle class="h-4 w-4 flex-shrink-0" />
								<span>{formError}</span>
							</div>
						{/if}

						<!-- Email Field -->
						<div class="space-y-2">
							<Label for="email" class="text-sm font-medium">Email Address</Label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="nurse@school.edu"
								required
								autocomplete="email"
								bind:value={email}
								onblur={validateEmail}
								oninput={() => {
									if (emailError) validateEmail();
								}}
								class="h-11 {emailError
									? 'border-red-500 focus:border-red-500 focus:ring-red-500'
									: ''}"
								aria-invalid={emailError ? 'true' : 'false'}
								aria-describedby={emailError ? 'email-error' : undefined}
							/>
							{#if emailError}
								<p id="email-error" class="text-sm text-red-600 dark:text-red-400">
									{emailError}
								</p>
							{/if}
						</div>

						<!-- Password Field -->
						<div class="space-y-2">
							<Label for="password" class="text-sm font-medium">Password</Label>
							<div class="relative">
								<Input
									id="password"
									name="password"
									type={showPassword ? 'text' : 'password'}
									placeholder="Enter your password"
									required
									autocomplete="current-password"
									bind:value={password}
									onblur={validatePassword}
									oninput={() => {
										if (passwordError) validatePassword();
									}}
									class="h-11 pr-10 {passwordError
										? 'border-red-500 focus:border-red-500 focus:ring-red-500'
										: ''}"
									aria-invalid={passwordError ? 'true' : 'false'}
									aria-describedby={passwordError ? 'password-error' : undefined}
								/>
								<button
									type="button"
									onclick={togglePasswordVisibility}
									class="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
									tabindex="-1"
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									{#if showPassword}
										<EyeOff class="h-4 w-4" />
									{:else}
										<Eye class="h-4 w-4" />
									{/if}
								</button>
							</div>
							{#if passwordError}
								<p id="password-error" class="text-sm text-red-600 dark:text-red-400">
									{passwordError}
								</p>
							{/if}
						</div>

						<!-- Login Button -->
						<Button
							type="submit"
							class="h-11 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700"
							disabled={submitting || !isFormValid}
						>
							{#if submitting}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								Signing In...
							{:else}
								Sign In to CareLog
							{/if}
						</Button>
					</form>

					<!-- Additional Info -->
					<div class="mt-6 text-center">
						<p class="text-xs text-slate-500 dark:text-slate-400">
							Secure access to student health records and clinic management tools
						</p>
					</div>
				</CardContent>
			</Card>

			<!-- Footer -->
			<div class="mt-8 text-center">
				<p class="text-xs text-slate-500 dark:text-slate-400">
					© 2025 CareLog. All rights reserved. | School Clinic Management System
				</p>
			</div>
		</div>
	</div>
</div>
