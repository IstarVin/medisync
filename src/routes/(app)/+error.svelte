<script lang="ts">
	import { page } from '$app/stores';
	import { AlertTriangle, ArrowLeft, Home, RefreshCw } from '@lucide/svelte';

	// Handle retry/refresh action
	function handleRetry() {
		window.location.reload();
	}

	// Handle navigation back
	function handleGoBack() {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			window.location.href = '/';
		}
	}

	// Get error details
	$: error = $page.error;
	$: status = $page.status;

	// Determine error message and description based on status
	$: errorInfo = (() => {
		switch (status) {
			case 404:
				return {
					title: 'Page Not Found',
					description: 'The page you are looking for does not exist or has been moved.',
					icon: AlertTriangle,
					color: 'destructive'
				};
			case 403:
				return {
					title: 'Access Forbidden',
					description: 'You do not have permission to access this resource.',
					icon: AlertTriangle,
					color: 'destructive'
				};
			case 500:
				return {
					title: 'Internal Server Error',
					description: 'Something went wrong on our end. Please try again later.',
					icon: AlertTriangle,
					color: 'destructive'
				};
			default:
				return {
					title: 'An Error Occurred',
					description: error?.message || 'An unexpected error has occurred. Please try again.',
					icon: AlertTriangle,
					color: 'destructive'
				};
		}
	})();
</script>

<svelte:head>
	<title>{status} - {errorInfo.title} | MediSYNC</title>
	<meta name="description" content={errorInfo.description} />
</svelte:head>

<!-- Use the same layout structure as other pages -->
<main
	class="flex w-full max-w-none flex-1 flex-col items-center justify-center px-4 py-8 md:max-w-4xl md:py-16"
>
	<!-- Error card with medical theme -->
	<div class="medical-card w-full max-w-lg text-center">
		<!-- Medical logo with error icon overlay -->
		<div class="relative mx-auto mb-6 flex size-20 items-center justify-center">
			<!-- Foreground error icon -->
			<div
				class="relative flex size-16 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10"
			>
				<errorInfo.icon class="size-8 text-destructive" />
			</div>
		</div>

		<!-- Status code with medical typography -->
		<div class="mb-4">
			<span class="medical-typography-heading text-6xl font-bold text-foreground">{status}</span>
		</div>

		<!-- Error title -->
		<h1 class="medical-typography-heading mb-3 text-2xl text-foreground">
			{errorInfo.title}
		</h1>

		<!-- Error description -->
		<p class="medical-typography-body mb-8 text-muted-foreground">
			{errorInfo.description}
		</p>

		<!-- Action buttons with medical theme -->
		<div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
			<!-- Go back button -->
			<button
				onclick={handleGoBack}
				class="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
			>
				<ArrowLeft size={16} />
				Go Back
			</button>

			<!-- Home button -->
			<a
				href="/"
				class="medical-button-primary inline-flex items-center justify-center gap-2 text-sm"
			>
				<Home size={16} />
				Return to Dashboard
			</a>

			<!-- Retry button -->
			<button
				onclick={handleRetry}
				class="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
			>
				<RefreshCw size={16} />
				Try Again
			</button>
		</div>
	</div>

	<!-- Additional help text -->
	<div class="mt-8 text-center">
		<p class="medical-typography-body text-sm text-muted-foreground">
			If this problem persists, please contact the system administrator or IT support.
		</p>
		<p class="medical-typography-body mt-2 text-xs text-muted-foreground">
			MediSYNC School Clinic Management System
		</p>
	</div>
</main>

<!-- Add some development-only error details in dev mode -->
{#if import.meta.env.DEV && error}
	<div
		class="fixed right-4 bottom-4 max-w-sm rounded-md border border-destructive/20 bg-destructive/5 p-4 shadow-lg"
	>
		<h3 class="mb-2 text-sm font-medium text-destructive">Development Error Details</h3>
		<details class="text-xs text-muted-foreground">
			<summary class="cursor-pointer hover:text-foreground"> Show error details </summary>
			<pre class="mt-2 text-xs break-words whitespace-pre-wrap">{JSON.stringify(
					error,
					null,
					2
				)}</pre>
		</details>
	</div>
{/if}
