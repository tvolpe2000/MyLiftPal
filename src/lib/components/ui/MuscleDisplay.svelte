<script lang="ts">
	import { supabase } from '$lib/db/supabase';
	import { getBodyBaseImage } from '$lib/constants/images';

	interface Props {
		primaryMuscle: string;
		secondaryMuscles?: { muscle: string; weight: number }[];
		size?: 'sm' | 'md' | 'lg';
	}

	let { primaryMuscle, secondaryMuscles = [], size = 'md' }: Props = $props();

	// Size configurations
	const sizeConfig = {
		sm: { width: 80, height: 120 },
		md: { width: 120, height: 180 },
		lg: { width: 160, height: 240 }
	};

	interface MuscleData {
		id: string;
		display_name: string;
		image_url_main: string | null;
		image_url_secondary: string | null;
		is_front: boolean;
	}

	let muscleGroups = $state<MuscleData[]>([]);
	let loading = $state(true);

	// Fetch muscle group data when component mounts or muscles change
	$effect(() => {
		loadMuscleGroups();
	});

	async function loadMuscleGroups() {
		loading = true;
		const muscleIds = [primaryMuscle, ...secondaryMuscles.map((s) => s.muscle)];
		const uniqueIds = [...new Set(muscleIds)];

		const { data, error } = await supabase
			.from('muscle_groups')
			.select('id, display_name, image_url_main, image_url_secondary, is_front')
			.in('id', uniqueIds);

		if (error) {
			console.error('Failed to load muscle groups:', error);
			muscleGroups = [];
		} else {
			muscleGroups = data || [];
		}
		loading = false;
	}

	// Get primary muscle data
	const primaryMuscleData = $derived(muscleGroups.find((m) => m.id === primaryMuscle));

	// Determine if we show front or back based on primary muscle
	const showFront = $derived(primaryMuscleData?.is_front ?? true);

	// Get base body URL
	const baseBodyUrl = $derived(getBodyBaseImage(showFront));

	// Get primary overlay URL (only if it matches current view)
	const primaryOverlay = $derived(
		primaryMuscleData?.is_front === showFront ? primaryMuscleData?.image_url_main : null
	);

	// Get secondary overlay URLs (only those matching current view)
	const secondaryOverlays = $derived(
		secondaryMuscles
			.map((sec) => muscleGroups.find((m) => m.id === sec.muscle))
			.filter((m): m is MuscleData => m !== undefined && m.is_front === showFront)
			.map((m) => m.image_url_secondary)
			.filter((url): url is string => url !== null)
	);

	const dimensions = $derived(sizeConfig[size]);
</script>

<div
	class="relative flex-shrink-0"
	style="width: {dimensions.width}px; height: {dimensions.height}px"
	role="img"
	aria-label="Muscle diagram showing {primaryMuscleData?.display_name ?? primaryMuscle}"
>
	{#if loading}
		<!-- Loading skeleton -->
		<div class="w-full h-full bg-[var(--color-bg-tertiary)] rounded-lg animate-pulse"></div>
	{:else}
		<!-- Base body SVG -->
		<img
			src={baseBodyUrl}
			alt=""
			class="absolute inset-0 w-full h-full object-contain opacity-30"
			loading="lazy"
		/>

		<!-- Secondary muscle overlays (rendered first, below primary) -->
		{#each secondaryOverlays as overlayUrl}
			<img
				src={overlayUrl}
				alt=""
				class="absolute inset-0 w-full h-full object-contain opacity-40"
				loading="lazy"
			/>
		{/each}

		<!-- Primary muscle overlay (on top, full opacity) -->
		{#if primaryOverlay}
			<img
				src={primaryOverlay}
				alt=""
				class="absolute inset-0 w-full h-full object-contain"
				loading="lazy"
			/>
		{/if}
	{/if}
</div>
