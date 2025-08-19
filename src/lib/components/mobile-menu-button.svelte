<script lang="ts">
	import { Menu, X } from '@lucide/svelte';

	interface Props {
		isOpen?: boolean;
		onToggle?: () => void;
	}

	let { isOpen = false, onToggle }: Props = $props();
</script>

<button
	onclick={onToggle}
	class="group relative inline-flex h-10 w-10 items-center justify-center rounded-lg
	       border border-border bg-background/80 text-foreground transition-all
	       duration-200 ease-out
	       hover:border-border-hover hover:bg-accent hover:text-accent-foreground
	       focus-visible:outline-2
	       focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95
	       md:hidden"
	aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
	aria-expanded={isOpen}
	aria-controls="mobile-navigation"
>
	<!-- Menu icon -->
	<Menu
		class="absolute h-5 w-5 transition-all duration-300 ease-in-out
		       {isOpen ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}"
	/>

	<!-- Close icon -->
	<X
		class="absolute h-5 w-5 transition-all duration-300 ease-in-out
		       {isOpen ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'}"
	/>

	<!-- Subtle glow effect on hover -->
	<div
		class="absolute inset-0 rounded-lg bg-primary/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
	></div>
</button>
