<script lang="ts">
	import { X } from '@lucide/svelte';
	import { fly } from 'svelte/transition';
	import AppLogo from './app-logo.svelte';
	import NavigationMenuItems from './navigation-menu-items.svelte';

	interface Props {
		isOpen?: boolean;
		onClose?: () => void;
	}

	let { isOpen = false, onClose }: Props = $props();

	function handleNavClick() {
		onClose?.();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose?.();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose?.();
		}
	}
</script>

{#if isOpen}
	<!-- Backdrop overlay -->
	<div
		class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		transition:fly={{ duration: 200, opacity: 0 }}
		role="dialog"
		aria-modal="true"
		aria-label="Mobile navigation menu"
		tabindex="-1"
	>
		<!-- Mobile navigation panel -->
		<nav
			id="mobile-navigation"
			class="fixed top-0 left-0 h-full w-80 max-w-[85vw] border-r border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-950"
			transition:fly={{ x: -320, duration: 300, opacity: 1 }}
			aria-label="Mobile navigation"
		>
			<div class="flex h-full flex-col">
				<!-- Header with close button -->
				<div
					class="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-800"
				>
					<AppLogo />

					<button
						onclick={onClose}
						class="group relative inline-flex h-8 w-8 items-center justify-center rounded-lg
						       text-gray-700 transition-all duration-200 ease-out
						       hover:bg-gray-100 hover:text-gray-900
						       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500
						       active:scale-95 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
						aria-label="Close navigation menu"
					>
						<X class="h-4 w-4" />
					</button>
				</div>

				<!-- Navigation content -->
				<div class="flex flex-1 flex-col p-6">
					<!-- Main navigation items -->
					<NavigationMenuItems onNavClick={handleNavClick} />
				</div>
			</div>
		</nav>
	</div>
{/if}
