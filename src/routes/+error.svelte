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
					icon: AlertTriangle
				};
			case 403:
				return {
					title: 'Access Forbidden',
					description: 'You do not have permission to access this resource.',
					icon: AlertTriangle
				};
			case 500:
				return {
					title: 'Internal Server Error',
					description: 'Something went wrong on our end. Please try again later.',
					icon: AlertTriangle
				};
			default:
				return {
					title: 'An Error Occurred',
					description: error?.message || 'An unexpected error has occurred. Please try again.',
					icon: AlertTriangle
				};
		}
	})();
</script>

<svelte:head>
	<title>{status} - {errorInfo.title} | MediSYNC</title>
	<meta name="description" content={errorInfo.description} />
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
	<div class="w-full max-w-md">
		<!-- Error card -->
		<div
			class="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl dark:border-gray-700 dark:bg-gray-800"
		>
			<!-- Error icon -->
			<div
				class="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20"
			>
				<errorInfo.icon class="size-8 text-red-600 dark:text-red-400" />
			</div>

			<!-- Status code -->
			<div class="mb-4">
				<span class="text-6xl font-bold text-gray-900 dark:text-white">{status}</span>
			</div>

			<!-- Error title -->
			<h1 class="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
				{errorInfo.title}
			</h1>

			<!-- Error description -->
			<p class="mb-8 text-gray-600 dark:text-gray-300">
				{errorInfo.description}
			</p>

			<!-- Action buttons -->
			<div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
				<!-- Go back button -->
				<button
					onclick={handleGoBack}
					class="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
				>
					<ArrowLeft size={16} />
					Go Back
				</button>

				<!-- Home button -->
				<a
					href="/"
					class="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
				>
					<Home size={16} />
					Go Home
				</a>

				<!-- Retry button -->
				<button
					onclick={handleRetry}
					class="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
				>
					<RefreshCw size={16} />
					Retry
				</button>
			</div>
		</div>

		<!-- Additional help text -->
		<div class="mt-6 text-center">
			<p class="text-sm text-gray-500 dark:text-gray-400">
				If this problem persists, please contact the system administrator.
			</p>
		</div>
	</div>
</div>

<!-- Add some development-only error details in dev mode -->
{#if import.meta.env.DEV && error}
	<div
		class="fixed right-4 bottom-4 max-w-sm rounded-lg border border-red-200 bg-red-50 p-4 shadow-lg dark:border-red-800 dark:bg-red-900/20"
	>
		<h3 class="mb-2 text-sm font-medium text-red-800 dark:text-red-200">
			Development Error Details
		</h3>
		<details class="text-xs text-red-700 dark:text-red-300">
			<summary class="cursor-pointer hover:text-red-900 dark:hover:text-red-100">
				Show error details
			</summary>
			<pre class="mt-2 break-words whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
		</details>
	</div>
{/if}
