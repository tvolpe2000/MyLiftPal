<script lang="ts">
	import { onMount } from 'svelte';

	let {
		value = $bindable(0),
		min = 0,
		max = 500,
		step = 5,
		label = '',
		unit = ''
	} = $props<{
		value: number;
		min?: number;
		max?: number;
		step?: number;
		label?: string;
		unit?: string;
	}>();

	let containerRef: HTMLDivElement;
	let isScrolling = false;
	let scrollTimeout: ReturnType<typeof setTimeout>;

	// Generate options based on min, max, step
	const options = $derived(() => {
		const opts: number[] = [];
		for (let v = min; v <= max; v += step) {
			// Round to avoid floating point issues
			opts.push(Math.round(v * 10) / 10);
		}
		return opts;
	});

	const ITEM_HEIGHT = 50;
	const VISIBLE_ITEMS = 5;

	// Scroll to value on mount and when value changes externally
	$effect(() => {
		if (containerRef && !isScrolling) {
			const opts = options();
			const index = opts.indexOf(value);
			if (index !== -1) {
				const scrollTop = index * ITEM_HEIGHT;
				containerRef.scrollTop = scrollTop;
			}
		}
	});

	function handleScroll() {
		if (!containerRef) return;

		isScrolling = true;
		clearTimeout(scrollTimeout);

		scrollTimeout = setTimeout(() => {
			isScrolling = false;
			// Snap to nearest value
			const scrollTop = containerRef.scrollTop;
			const index = Math.round(scrollTop / ITEM_HEIGHT);
			const opts = options();
			if (index >= 0 && index < opts.length) {
				value = opts[index];
				// Ensure we're snapped exactly
				containerRef.scrollTop = index * ITEM_HEIGHT;
			}
		}, 100);
	}

	onMount(() => {
		// Initial scroll to value
		const opts = options();
		const index = opts.indexOf(value);
		if (index !== -1 && containerRef) {
			containerRef.scrollTop = index * ITEM_HEIGHT;
		}
	});

	// Generate a unique ID for accessibility
	const pickerId = $derived(`picker-${label?.toLowerCase().replace(/\s+/g, '-') || 'value'}`);
</script>

<div class="flex flex-col items-center">
	{#if label}
		<!-- svelte-ignore a11y_label_has_associated_control -->
		<label
			id="{pickerId}-label"
			class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2"
		>
			{label}
		</label>
	{/if}

	<div class="relative w-32">
		<!-- Selection indicator -->
		<div
			class="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[50px] border-y-2 border-[var(--color-accent)] pointer-events-none z-10"
		></div>

		<!-- Fade overlays -->
		<div
			class="absolute top-0 left-0 right-0 h-[50px] bg-gradient-to-b from-[var(--color-bg-primary)] to-transparent pointer-events-none z-20"
		></div>
		<div
			class="absolute bottom-0 left-0 right-0 h-[50px] bg-gradient-to-t from-[var(--color-bg-primary)] to-transparent pointer-events-none z-20"
		></div>

		<!-- Scroll container -->
		<div
			bind:this={containerRef}
			onscroll={handleScroll}
			role="listbox"
			aria-labelledby={label ? `${pickerId}-label` : undefined}
			aria-label={!label ? 'Select a value' : undefined}
			tabindex="0"
			class="h-[250px] overflow-y-scroll scroll-smooth scrollbar-hide"
			style="scroll-snap-type: y mandatory;"
		>
			<!-- Spacer for centering first item -->
			<div style="height: 100px;"></div>

			{#each options() as opt}
				<div
					role="option"
					aria-selected={opt === value}
					class="h-[50px] flex items-center justify-center text-2xl font-bold transition-colors"
					style="scroll-snap-align: center;"
					class:text-[var(--color-text-primary)]={opt === value}
					class:text-[var(--color-text-muted)]={opt !== value}
				>
					{opt}{unit ? ` ${unit}` : ''}
				</div>
			{/each}

			<!-- Spacer for centering last item -->
			<div style="height: 100px;"></div>
		</div>
	</div>
</div>

<style>
	/* Hide scrollbar but keep functionality */
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
