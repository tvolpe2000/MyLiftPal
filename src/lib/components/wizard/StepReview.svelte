<script lang="ts">
	import { wizard } from '$lib/stores/wizardStore.svelte';
	import { supabase } from '$lib/db/supabase';
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { Calendar, Clock, Dumbbell, CheckCircle } from 'lucide-svelte';
	import { calculateSetsForWeek } from '$lib/types/wizard';

	let saving = $state(false);
	let error = $state('');

	// Calculate total exercises
	const totalExercises = $derived(() => {
		let count = 0;
		for (const day of wizard.workoutDays) {
			count += wizard.getExercisesForDay(day.id).length;
		}
		return count;
	});

	// Estimate time for a day (rough calculation)
	function estimateDayTime(dayId: string, weekNumber: number): number {
		const slots = wizard.getExercisesForDay(dayId);
		let totalMinutes = 0;

		for (const slot of slots) {
			const sets = calculateSetsForWeek(slot.baseSets, slot.setProgression, weekNumber);
			// Rough estimate: 45 seconds per set + rest time
			const restSeconds = slot.restSeconds ?? 90;
			totalMinutes += (sets * 45 + (sets - 1) * restSeconds) / 60;
		}

		// Add transition time (~30 seconds per exercise)
		totalMinutes += (slots.length * 30) / 60;

		return Math.round(totalMinutes);
	}

	async function createBlock() {
		if (!auth.user) return;

		saving = true;
		error = '';

		try {
			// 1. Create training block
			const { data: blockData, error: blockError } = await supabase
				.from('training_blocks')
				.insert({
					user_id: auth.user.id,
					name: wizard.blockName,
					total_weeks: wizard.totalWeeks,
					current_week: 1,
					current_day: 1,
					status: 'active',
					time_budget_minutes: wizard.timeBudgetMinutes,
					started_at: new Date().toISOString()
				} as never)
				.select()
				.single();

			if (blockError) throw blockError;
			const block = blockData as { id: string };

			// 2. Create workout days
			for (const day of wizard.workoutDays) {
				const { data: dayData, error: dayError } = await supabase
					.from('workout_days')
					.insert({
						block_id: block.id,
						day_number: day.dayNumber,
						name: day.name,
						target_muscles: day.targetMuscles,
						time_budget_minutes: day.timeBudgetMinutes
					} as never)
					.select()
					.single();

				if (dayError) throw dayError;
				const workoutDay = dayData as { id: string };

				// 3. Create exercise slots for this day
				const slots = wizard.getExercisesForDay(day.id);
				for (const slot of slots) {
					const { error: slotError } = await supabase.from('exercise_slots').insert({
						day_id: workoutDay.id,
						exercise_id: slot.exerciseId,
						slot_order: slot.slotOrder,
						base_sets: slot.baseSets,
						set_progression: slot.setProgression,
						rep_range_min: slot.repRangeMin,
						rep_range_max: slot.repRangeMax,
						rest_seconds: slot.restSeconds,
						superset_group: slot.supersetGroup,
						notes: slot.notes
					} as never);

					if (slotError) throw slotError;
				}
			}

			// Success - reset wizard and navigate
			wizard.reset();
			goto('/blocks');
		} catch (e) {
			console.error('Error creating block:', e);
			error = 'Failed to create training block. Please try again.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="space-y-6">
	<div class="text-center mb-8">
		<h2 class="text-xl font-bold text-[var(--color-text-primary)]">Review & Start</h2>
		<p class="text-[var(--color-text-secondary)] mt-1">
			Review your training block before starting
		</p>
	</div>

	<!-- Block Summary -->
	<div class="bg-[var(--color-bg-secondary)] rounded-xl p-6">
		<h3 class="text-lg font-semibold text-[var(--color-text-primary)] mb-4">{wizard.blockName}</h3>

		<div class="grid grid-cols-3 gap-4">
			<div class="text-center">
				<div class="flex items-center justify-center gap-2 text-[var(--color-accent)] mb-1">
					<Calendar size={18} />
				</div>
				<div class="text-2xl font-bold text-[var(--color-text-primary)]">{wizard.totalWeeks}</div>
				<div class="text-xs text-[var(--color-text-muted)]">weeks</div>
			</div>

			<div class="text-center">
				<div class="flex items-center justify-center gap-2 text-[var(--color-accent)] mb-1">
					<Dumbbell size={18} />
				</div>
				<div class="text-2xl font-bold text-[var(--color-text-primary)]">{wizard.daysPerWeek}</div>
				<div class="text-xs text-[var(--color-text-muted)]">days/week</div>
			</div>

			<div class="text-center">
				<div class="flex items-center justify-center gap-2 text-[var(--color-accent)] mb-1">
					<CheckCircle size={18} />
				</div>
				<div class="text-2xl font-bold text-[var(--color-text-primary)]">{totalExercises()}</div>
				<div class="text-xs text-[var(--color-text-muted)]">exercises</div>
			</div>
		</div>
	</div>

	<!-- Day Breakdown -->
	<div class="bg-[var(--color-bg-secondary)] rounded-xl p-6">
		<h3 class="text-sm font-medium text-[var(--color-text-secondary)] mb-4">Workout Days</h3>

		<div class="space-y-3">
			{#each wizard.workoutDays as day (day.id)}
				{@const dayExercises = wizard.getExercisesForDay(day.id)}
				{@const week1Time = estimateDayTime(day.id, 1)}
				{@const finalWeekTime = estimateDayTime(day.id, wizard.totalWeeks)}

				<div class="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
					<div class="flex items-center gap-3">
						<span
							class="w-6 h-6 rounded-full bg-[var(--color-accent-muted)] text-[var(--color-accent)] flex items-center justify-center font-semibold text-xs"
						>
							{day.dayNumber}
						</span>
						<span class="text-[var(--color-text-primary)]">{day.name}</span>
					</div>
					<div class="text-right">
						<div class="text-sm text-[var(--color-text-secondary)]">
							{dayExercises.length} exercise{dayExercises.length !== 1 ? 's' : ''}
						</div>
						<div class="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
							<Clock size={12} />
							{week1Time}-{finalWeekTime} min
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Time Budget Warning -->
	{#if wizard.timeBudgetMinutes}
		{@const anyExceedsBudget = wizard.workoutDays.some(
			(day) => estimateDayTime(day.id, wizard.totalWeeks) > (wizard.timeBudgetMinutes ?? 0)
		)}
		{#if anyExceedsBudget}
			<div class="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-start gap-3">
				<Clock size={20} class="text-orange-400 flex-shrink-0 mt-0.5" />
				<div>
					<div class="font-medium text-orange-400">Time Budget Warning</div>
					<div class="text-sm text-[var(--color-text-secondary)]">
						Some days may exceed your {wizard.timeBudgetMinutes} minute budget by the final week.
						Consider reducing exercises or progression.
					</div>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Error Message -->
	{#if error}
		<div class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
			{error}
		</div>
	{/if}

	<!-- Start Button -->
	<button
		type="button"
		onclick={createBlock}
		disabled={saving}
		class="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-[var(--color-bg-primary)] font-semibold py-4 rounded-xl transition-colors text-lg"
	>
		{#if saving}
			Creating Block...
		{:else}
			Start Training Block
		{/if}
	</button>
</div>
