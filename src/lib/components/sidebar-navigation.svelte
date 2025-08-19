<script lang="ts">
	import { page } from '$app/stores';
	import { Calendar, House, Users } from '@lucide/svelte';

	// Menu items
	const mainMenuItems = [
		{
			title: 'Dashboard',
			href: '/',
			icon: House
		},
		{
			title: 'Students',
			href: '/students',
			icon: Users
		},
		{
			title: 'Visits',
			href: '/visits',
			icon: Calendar
		}
	];

	function isActiveRoute(href: string, currentPath: string): boolean {
		if (href === '/') {
			return currentPath === '/';
		}
		return currentPath.startsWith(href);
	}
</script>

<!-- Modern sidebar with enhanced styling -->
<div class="flex w-64 flex-col lg:w-80">
	<div
		class="flex h-full min-h-screen flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950"
	>
		<div class="flex flex-col gap-6 p-6">
			<!-- Enhanced logo section -->
			<div class="flex items-center gap-3">
				<div
					class="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg"
				>
					<svg class="size-6" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"
						/>
					</svg>
				</div>
				<div>
					<h1 class="text-xl font-bold tracking-tight text-gray-900 dark:text-white">MediSYNC</h1>
					<p class="text-sm text-gray-500 dark:text-gray-400">Clinic Management</p>
				</div>
			</div>

			<!-- Enhanced navigation menu -->
			<nav class="flex flex-col gap-2" aria-label="Main navigation">
				{#each mainMenuItems as item}
					{@const Icon = item.icon}
					{@const isActive = isActiveRoute(item.href, $page.url.pathname)}
					<a
						href={item.href}
						class="group flex items-center gap-3 rounded-xl px-4 py-3
						       transition-all duration-200 ease-out
						       {isActive
							? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-800'
							: 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-white'}
						       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500
						       active:scale-[0.98]"
						aria-current={isActive ? 'page' : undefined}
					>
						<div
							class="flex size-8 items-center justify-center rounded-lg transition-colors
							{isActive
								? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
								: 'bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-gray-700'}"
						>
							<Icon size={18} />
						</div>
						<span class="font-medium">{item.title}</span>
						{#if isActive}
							<div class="ml-auto size-2 rounded-full bg-blue-500"></div>
						{/if}
					</a>
				{/each}
			</nav>
		</div>
	</div>
</div>
