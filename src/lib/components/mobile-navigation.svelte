<script lang="ts">
	import { page } from '$app/stores';
	import { Calendar, HelpCircle, House, Users, X } from '@lucide/svelte';
	import { fly } from 'svelte/transition';

	interface Props {
		isOpen?: boolean;
		onClose?: () => void;
	}

	let { isOpen = false, onClose }: Props = $props();

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

	function handleNavClick() {
		onClose?.();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose?.();
		}
	}
</script>

{#if isOpen}
	<!-- Backdrop overlay -->
	<div
		class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
		onclick={handleBackdropClick}
		transition:fly={{ duration: 200, opacity: 0 }}
		role="dialog"
		aria-modal="true"
		aria-labelledby="mobile-nav-title"
	>
		<!-- Mobile navigation panel -->
		<nav
			id="mobile-navigation"
			class="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-sidebar border-r border-sidebar-border shadow-xl"
			transition:fly={{ x: -320, duration: 300, opacity: 1 }}
			aria-labelledby="mobile-nav-title"
		>
			<div class="flex h-full flex-col">
				<!-- Header with close button -->
				<div class="flex items-center justify-between border-b border-sidebar-border p-4">
					<div class="flex items-center gap-3">
						<div
							class="aspect-square size-8 rounded-full bg-cover bg-center bg-no-repeat ring-2 ring-sidebar-border"
							style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuA26QmIzrxJNMSPEzgHRWXm8UxdKZf7OguWukJoEQKaN1KrMHpbA7MMWeSdwC86Z1NS6_WHKeJVWIOVv20cSoXOXJxzN_p68dB3q3zuM9Ppskr9_ywf1-9v8vD3S45TBgm3OooSZPaeED8dfY13m0qwMiVmMolrFp2SQEuJ0ww0XtIB7XNkWObbaxWcYg_uxRRaCrHh2hvLpqogiDxM6FmB_Ei3laMKD2_z5ZHLO33hhnzTeH4Bahg7MyXSAV_C5Le-rZGYReofhgk');"
						></div>
						<h2 id="mobile-nav-title" class="text-lg font-semibold tracking-tight text-sidebar-foreground">
							MediSYNC
						</h2>
					</div>
					
					<button
						onclick={onClose}
						class="group relative inline-flex h-8 w-8 items-center justify-center rounded-lg
						       text-sidebar-foreground transition-all duration-200 ease-out
						       hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground
						       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring
						       active:scale-95"
						aria-label="Close navigation menu"
					>
						<X class="h-4 w-4" />
					</button>
				</div>

				<!-- Navigation content -->
				<div class="flex flex-1 flex-col justify-between p-4">
					<!-- Main navigation items -->
					<div class="flex flex-col gap-1">
						{#each mainMenuItems as item}
							{@const Icon = item.icon}
							{@const isActive = isActiveRoute(item.href, $page.url.pathname)}
							<a
								href={item.href}
								onclick={handleNavClick}
								class="group flex items-center gap-3 rounded-lg px-3 py-3
								       transition-all duration-200 ease-out
								       {isActive
									? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
									: 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'}
								       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring
								       active:scale-[0.98]"
								aria-current={isActive ? 'page' : undefined}
							>
								<Icon
									class="transition-transform duration-200 group-hover:scale-110"
									size={20}
								/>
								<span class="text-base font-medium">{item.title}</span>
							</a>
						{/each}
					</div>

					<!-- Help section -->
					<div class="border-t border-sidebar-border pt-4">
						<a
							href={helpItem.href}
							onclick={handleNavClick}
							class="group flex items-center gap-3 rounded-lg px-3 py-3
							       text-sidebar-foreground transition-all duration-200 ease-out
							       hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground
							       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring
							       active:scale-[0.98]"
						>
							<helpItem.icon
								class="transition-transform duration-200 group-hover:scale-110"
								size={20}
							/>
							<span class="text-base font-medium">{helpItem.title}</span>
						</a>
					</div>
				</div>
			</div>
		</nav>
	</div>
{/if}