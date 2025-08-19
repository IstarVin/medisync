<script lang="ts">
	import AppLogo from './app-logo.svelte';
	import NavigationMenuItems from './navigation-menu-items.svelte';
</script>

<!-- Modern sidebar with enhanced styling and fixed positioning -->
<div class="flex w-64 flex-col lg:w-80">
	<div class="flex h-screen flex-col border-r border-sidebar-border bg-sidebar">
		<div class="flex flex-col gap-6 overflow-y-auto p-6">
			<!-- Enhanced logo section -->
			<AppLogo />

			<!-- Enhanced navigation menu -->
			<NavigationMenuItems />
		</div>
	</div>
</div>
