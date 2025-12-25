<script lang="ts">
	import type { MuscleVolume, VolumeStatus } from '$lib/utils/volume';
	import { getVolumeBarColor, getVolumeProgress } from '$lib/utils/volume';

	let { volume, compact = false } = $props<{
		volume: MuscleVolume;
		compact?: boolean;
	}>();

	const progress = $derived(getVolumeProgress(volume.totalSets, volume.mav, volume.mrv));
	const barColor = $derived(getVolumeBarColor(volume.status));

	// Status badge colors
	function getStatusColorClass(status: VolumeStatus): string {
		switch (status) {
			case 'none':
				return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
			case 'low':
				return 'bg-red-500/20 text-red-400 border-red-500/30';
			case 'good':
				return 'bg-green-500/20 text-green-400 border-green-500/30';
			case 'high':
				return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
			case 'excessive':
				return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
		}
	}
	const statusColors = $derived(getStatusColorClass(volume.status));
</script>

{#if compact}
	<!-- Compact view for headers/summaries -->
	<div class="flex items-center gap-2">
		<span class="text-xs text-[var(--color-text-secondary)] min-w-[60px] truncate">
			{volume.muscleName}
		</span>
		<div class="flex-1 h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden min-w-[40px]">
			<div
				class="h-full rounded-full transition-all {barColor}"
				style="width: {Math.min(progress, 100)}%"
			></div>
		</div>
		<span class="text-xs font-medium {statusColors} px-1.5 py-0.5 rounded border min-w-[24px] text-center">
			{volume.totalSets}
		</span>
	</div>
{:else}
	<!-- Full view for detailed displays -->
	<div class="space-y-1">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="font-medium text-[var(--color-text-primary)]">
					{volume.muscleName}
				</span>
				<span class="text-xs {statusColors} px-2 py-0.5 rounded-full border">
					{volume.statusLabel}
				</span>
			</div>
			<div class="text-right">
				<span class="font-semibold text-[var(--color-text-primary)]">{volume.totalSets}</span>
				<span class="text-[var(--color-text-muted)] text-sm"> sets/week</span>
			</div>
		</div>

		<!-- Progress bar with markers -->
		<div class="relative">
			<div class="h-3 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
				<div
					class="h-full rounded-full transition-all duration-300 {barColor}"
					style="width: {Math.min(progress, 100)}%"
				></div>
			</div>

			<!-- Optimal zone indicator (MEV to MAV) -->
			<div
				class="absolute top-0 h-3 border-l-2 border-r-2 border-green-500/50 pointer-events-none"
				style="left: {(volume.mev / volume.mrv) * 100}%; width: {((volume.mav - volume.mev) / volume.mrv) * 100}%"
			></div>
		</div>

		<!-- Legend -->
		<div class="flex justify-between text-xs text-[var(--color-text-muted)]">
			<span>{volume.mev} min</span>
			<span class="text-green-500">{volume.mev}-{volume.mav} optimal</span>
			<span>{volume.mrv} max</span>
		</div>
	</div>
{/if}
