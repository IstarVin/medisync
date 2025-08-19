<script lang="ts">
	import { page } from '$app/stores';
	import { Calendar, House, Users } from '@lucide/svelte';

	interface Props {
		onNavClick?: () => void;
	}

	let { onNavClick }: Props = $props();

	// Menu items configuration
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

	function handleNavClick() {
		onNavClick?.();
	}
</script>

<!-- Navigation menu items -->
<nav class="flex flex-col gap-2" aria-label="Main navigation">
	{#each mainMenuItems as item}
		{@const Icon = item.icon}
		{@const isActive = isActiveRoute(item.href, $page.url.pathname)}
		<a
			href={item.href}
			onclick={handleNavClick}
			class="group flex items-center gap-3 rounded-xl px-4 py-3
			       transition-all duration-200 ease-out
			       {isActive
				? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700'
				: 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'}
			       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500
			       active:scale-[0.98]"
			aria-current={isActive ? 'page' : undefined}
		>
			<div
				class="flex size-8 items-center justify-center rounded-lg transition-colors
				{isActive
					? 'bg-blue-100 text-blue-600 dark:bg-gray-700 dark:text-gray-200'
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
