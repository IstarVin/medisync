<script lang="ts">
	import { page } from '$app/stores';
	let email = '';
	let password = '';
	let submitting = false;
	$: error = $page.form?.error;
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
	<form
		method="POST"
		class="w-full max-w-sm space-y-6 rounded-lg bg-white p-8 shadow-md dark:bg-gray-800"
		autocomplete="on"
	>
		<h1 class="text-center text-2xl font-bold text-gray-900 dark:text-white">MediSYNC Login</h1>
		{#if error}
			<div class="rounded bg-red-100 px-4 py-2 text-red-700">{error}</div>
		{/if}
		<div>
			<label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-200"
				>Email</label
			>
			<input
				id="email"
				name="email"
				type="email"
				class="mt-1 block w-full rounded border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
				required
				bind:value={email}
				autocomplete="email"
			/>
		</div>
		<div>
			<label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-200"
				>Password</label
			>
			<input
				id="password"
				name="password"
				type="password"
				class="mt-1 block w-full rounded border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
				required
				bind:value={password}
				autocomplete="current-password"
			/>
		</div>
		<button
			type="submit"
			class="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
			disabled={submitting}
		>
			{submitting ? 'Logging in...' : 'Login'}
		</button>
	</form>
</div>
