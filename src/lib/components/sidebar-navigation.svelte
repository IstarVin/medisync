<script lang="ts">
	import AppLogo from './app-logo.svelte';
	import NavigationMenuItems from './navigation-menu-items.svelte';
	import ThemeSwitcher from './theme-switcher.svelte';

	let { data } = $props();
</script>

<!-- Modern sidebar with enhanced styling and fixed positioning -->
<div class="flex w-64 flex-col lg:w-80">
	<div class="flex h-screen flex-col border-r border-sidebar-border bg-sidebar">
		<div class="flex h-full flex-col gap-6 overflow-y-auto p-6">
			<!-- Enhanced logo section -->
			<div class="flex items-center justify-between">
				<AppLogo />
				<ThemeSwitcher initialTheme={data?.theme} />
			</div>

			<!-- Enhanced navigation menu -->
			<div class="flex flex-1 flex-col">
				<NavigationMenuItems />
			</div>
		</div>
	</div>
</div>
