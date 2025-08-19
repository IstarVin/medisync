<script lang="ts">
	import { page } from '$app/stores';
	import { Calendar, HelpCircle, House, Users } from '@lucide/svelte';

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

	const helpItem = {
		title: 'Help and feedback',
		href: '/help',
		icon: HelpCircle
	};

	function isActiveRoute(href: string, currentPath: string): boolean {
		if (href === '/') {
			return currentPath === '/';
		}
		return currentPath.startsWith(href);
	}
</script>

<!-- Modern sidebar with container queries and enhanced styling -->
<div class="medical-container layout-content-container @container flex w-80 flex-col">
	<div
		class="flex h-full min-h-[700px] flex-col justify-between border-r border-sidebar-border bg-sidebar"
	>
		<div class="flex flex-col gap-6 p-6">
			<!-- Enhanced logo section with better spacing -->
			<div class="flex items-center gap-3">
				<div
					class="aspect-square size-10 rounded-full bg-cover bg-center bg-no-repeat ring-2 ring-sidebar-border"
					style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuA26QmIzrxJNMSPEzgHRWXm8UxdKZf7OguWukJoEQKaN1KrMHpbA7MMWeSdwC86Z1NS6_WHKeJVWIOVv20cSoXOXJxzN_p68dB3q3zuM9Ppskr9_ywf1-9v8vD3S45TBgm3OooSZPaeED8dfY13m0qwMiVmMolrFp2SQEuJ0ww0XtIB7XNkWObbaxWcYg_uxRRaCrHh2hvLpqogiDxM6FmB_Ei3laMKD2_z5ZHLO33hhnzTeH4Bahg7MyXSAV_C5Le-rZGYReofhgk');"
				></div>
				<h1 class="text-lg font-semibold tracking-tight text-sidebar-foreground">MediSYNC</h1>
			</div>

			<!-- Enhanced navigation menu with modern states -->
			<nav class="flex flex-col gap-1" aria-label="Main navigation">
				{#each mainMenuItems as item}
					{@const Icon = item.icon}
					{@const isActive = isActiveRoute(item.href, $page.url.pathname)}
					<a
						href={item.href}
						class="group flex items-center gap-3 rounded-lg px-3 py-2.5
						       transition-all duration-[--duration-fast] ease-out
						       {isActive
							? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
							: 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'}
						       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring
						       active:scale-[0.98]"
						aria-current={isActive ? 'page' : undefined}
					>
						<Icon
							class="transition-transform duration-[--duration-fast] group-hover:scale-110"
							size={20}
						/>
						<span class="text-sm font-medium">{item.title}</span>
					</a>
				{/each}
			</nav>
		</div>

		<!-- Enhanced help section with better positioning -->
		<div class="border-t border-sidebar-border p-6">
			<a
				href={helpItem.href}
				class="group flex items-center gap-3 rounded-lg px-3 py-2.5
				       text-sidebar-foreground transition-all duration-[--duration-fast] ease-out
				       hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground
				       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring
				       active:scale-[0.98]"
			>
				<helpItem.icon
					class="transition-transform duration-[--duration-fast] group-hover:scale-110"
					size={20}
				/>
				<span class="text-sm font-medium">{helpItem.title}</span>
			</a>
		</div>
	</div>
</div>
