<script lang="ts">
	import AppLogo from './app-logo.svelte';
	import NavigationMenuItems from './navigation-menu-items.svelte';
</script>

<!-- Modern sidebar with enhanced styling -->
<div class="flex w-64 flex-col lg:w-80">
	<div
		class="flex h-full min-h-screen flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950"
	>
		<div class="flex flex-col gap-6 p-6">
			<!-- Enhanced logo section -->
			<AppLogo />

			<!-- Enhanced navigation menu -->
			<NavigationMenuItems />
		</div>
	</div>
</div>
