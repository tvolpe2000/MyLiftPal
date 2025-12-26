<script lang="ts">
	import { wizard } from '$lib/stores/wizardStore.svelte';
	import { supabase } from '$lib/db/supabase';
	import type { Exercise } from '$lib/types';
	import { createDefaultExerciseSlot } from '$lib/types/wizard';
	import { Plus, Trash2, ChevronDown, ChevronUp, Filter, BarChart3, Wand2, Sparkles, Clock } from 'lucide-svelte';
	import { calculateWeeklyVolume, getVolumeBarColor } from '$lib/utils/volume';
	import type { MuscleVolume, MuscleGroupData, ExerciseForVolume } from '$lib/utils/volume';
	import { calculateDayTime, getTimeBarColor, getTimeRange } from '$lib/utils/time';
	import type { ExerciseSlotForTime, DayTimeEstimate } from '$lib/utils/time';

	let exercises = $state<Exercise[]>([]);
	let muscleGroupsData = $state<MuscleGroupData[]>([]);
	let loading = $state(true);
	let expandedDay = $state<string | null>(wizard.workoutDays[0]?.id || null);
	let showPicker = $state(false);
	let pickerDayId = $state<string | null>(null);
	let searchQuery = $state('');
	let selectedEquipment = $state<string | null>(null);
	let selectedMuscle = $state<string | null>(null);
	let showVolume = $state(true);
	let showTime = $state(true);
	let showSuggestions = $state<string | null>(null); // dayId or null

	const equipmentTypes = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'];
	const muscleGroups = [
		'chest',
		'back_lats',
		'back_upper',
		'front_delts',
		'side_delts',
		'rear_delts',
		'biceps',
		'triceps',
		'quads',
		'hamstrings',
		'glutes',
		'calves',
		'abs'
	];

	$effect(() => {
		loadExercises();
		loadMuscleGroups();
	});

	async function loadMuscleGroups() {
		const { data } = await supabase
			.from('muscle_groups')
			.select('id, display_name, mv, mev, mav, mrv, color');

		if (data) {
			muscleGroupsData = data as MuscleGroupData[];
		}
	}

	// Calculate weekly volume from all exercises across all days
	const weeklyVolumes = $derived.by(() => {
		if (muscleGroupsData.length === 0) return [];

		const allExercises: ExerciseForVolume[] = [];

		// Collect exercises from all days
		for (const day of wizard.workoutDays) {
			const slots = wizard.exerciseSlots[day.id] || [];
			for (const slot of slots) {
				if (slot.exercise) {
					allExercises.push({
						primaryMuscle: slot.exercise.primary_muscle,
						secondaryMuscles: slot.exercise.secondary_muscles || [],
						setsPerWeek: slot.baseSets // Week 1 sets as baseline
					});
				}
			}
		}

		return calculateWeeklyVolume(allExercises, muscleGroupsData);
	});

	// Volume summary stats
	const volumeStats = $derived.by(() => {
		const lowCount = weeklyVolumes.filter((v: MuscleVolume) => v.status === 'low').length;
		const goodCount = weeklyVolumes.filter((v: MuscleVolume) => v.status === 'good').length;
		const highCount = weeklyVolumes.filter((v: MuscleVolume) => v.status === 'high' || v.status === 'excessive').length;
		return { lowCount, goodCount, highCount };
	});

	// Time estimates for all days (Week 1 and final week)
	const dayTimeEstimates = $derived.by(() => {
		const estimates: Map<string, { week1: DayTimeEstimate; final: DayTimeEstimate }> = new Map();

		for (const day of wizard.workoutDays) {
			const slots = wizard.exerciseSlots[day.id] || [];
			const slotsForTime: ExerciseSlotForTime[] = slots.map((slot) => ({
				baseSets: slot.baseSets,
				setProgression: slot.setProgression,
				restSeconds: slot.restSeconds,
				exercise: slot.exercise
					? {
							work_seconds: slot.exercise.work_seconds ?? 45,
							default_rest_seconds: slot.exercise.default_rest_seconds ?? 90
						}
					: undefined
			}));

			const budget = day.timeBudgetMinutes ?? wizard.timeBudgetMinutes;

			estimates.set(day.id, {
				week1: calculateDayTime(slotsForTime, 1, budget, day.id, day.name),
				final: calculateDayTime(slotsForTime, wizard.totalWeeks, budget, day.id, day.name)
			});
		}

		return estimates;
	});

	// Time summary stats
	const timeStats = $derived.by(() => {
		let totalWeek1 = 0;
		let totalFinal = 0;
		let overBudgetCount = 0;

		dayTimeEstimates.forEach((est) => {
			totalWeek1 += est.week1.totalMinutes;
			totalFinal += est.final.totalMinutes;
			if (est.final.status === 'over' || est.final.status === 'way_over') {
				overBudgetCount++;
			}
		});

		return { totalWeek1, totalFinal, overBudgetCount };
	});

	// Equipment priority for sorting (compounds first)
	function getEquipmentPriority(equipment: string): number {
		const priorities: Record<string, number> = {
			barbell: 1,
			dumbbell: 2,
			cable: 3,
			machine: 4,
			bodyweight: 5,
			smith_machine: 6,
			kettlebell: 7,
			bands: 8
		};
		return priorities[equipment] || 99;
	}

	// Get smart exercise suggestions for a day based on target muscles and volume gaps
	function getSmartSuggestions(dayId: string): Exercise[] {
		const day = wizard.workoutDays.find((d) => d.id === dayId);
		if (!day || exercises.length === 0) return [];

		const targetMuscles = day.targetMuscles || [];
		if (targetMuscles.length === 0) return [];

		// Get muscles that need more volume
		const undertrainedMuscles = weeklyVolumes
			.filter((v: MuscleVolume) => v.status === 'low' || v.status === 'none')
			.map((v: MuscleVolume) => v.muscleId);

		// Get exercises already added to this day
		const existingExerciseIds = new Set(
			(wizard.exerciseSlots[dayId] || []).map((slot) => slot.exerciseId)
		);

		// Filter and sort exercises
		const suggestions = exercises
			.filter((ex) => {
				// Must target one of the day's muscles
				if (!targetMuscles.includes(ex.primary_muscle)) return false;
				// Don't suggest already added exercises
				if (existingExerciseIds.has(ex.id)) return false;
				return true;
			})
			.sort((a, b) => {
				// Prioritize exercises hitting undertrained muscles
				const aHitsUndertrained = undertrainedMuscles.includes(a.primary_muscle);
				const bHitsUndertrained = undertrainedMuscles.includes(b.primary_muscle);
				if (aHitsUndertrained && !bHitsUndertrained) return -1;
				if (!aHitsUndertrained && bHitsUndertrained) return 1;
				// Then by equipment (compounds first)
				return getEquipmentPriority(a.equipment) - getEquipmentPriority(b.equipment);
			});

		return suggestions.slice(0, 5);
	}

	// Quick-fill a day with suggested exercises
	function quickFillDay(dayId: string) {
		const suggestions = getSmartSuggestions(dayId);
		const existingSlots = wizard.getExercisesForDay(dayId);

		// Add top 4-5 suggestions
		const toAdd = suggestions.slice(0, 5 - existingSlots.length);

		for (const exercise of toAdd) {
			const slot = createDefaultExerciseSlot(exercise, existingSlots.length + toAdd.indexOf(exercise));
			wizard.addExerciseSlot(dayId, slot);
		}

		showSuggestions = null;
	}

	// Add a single suggested exercise
	function addSuggestedExercise(dayId: string, exercise: Exercise) {
		const existingSlots = wizard.getExercisesForDay(dayId);
		const slot = createDefaultExerciseSlot(exercise, existingSlots.length);
		wizard.addExerciseSlot(dayId, slot);
	}

	async function loadExercises() {
		loading = true;
		const { data, error } = await supabase.from('exercises').select('*').order('name');

		if (error) {
			console.error('Error loading exercises:', error);
		} else {
			exercises = data || [];
		}
		loading = false;
	}

	function openPicker(dayId: string) {
		pickerDayId = dayId;
		showPicker = true;
		searchQuery = '';
		selectedEquipment = null;

		// Pre-select first target muscle from the day if available
		const day = wizard.workoutDays.find((d) => d.id === dayId);
		const muscles = day?.targetMuscles;
		if (muscles && muscles.length > 0) {
			selectedMuscle = muscles[0];
		} else {
			selectedMuscle = null;
		}
	}

	function closePicker() {
		showPicker = false;
		pickerDayId = null;
	}

	function selectExercise(exercise: Exercise) {
		if (pickerDayId) {
			const existingSlots = wizard.getExercisesForDay(pickerDayId);
			const slot = createDefaultExerciseSlot(exercise, existingSlots.length);
			wizard.addExerciseSlot(pickerDayId, slot);
		}
		closePicker();
	}

	function formatMuscle(muscle: string): string {
		return muscle.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	let filteredExercises = $derived(() => {
		return exercises.filter((ex) => {
			const matchesSearch =
				!searchQuery ||
				ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				ex.aliases?.some((a: string) => a.toLowerCase().includes(searchQuery.toLowerCase()));
			const matchesEquipment = !selectedEquipment || ex.equipment === selectedEquipment;
			const matchesMuscle = !selectedMuscle || ex.primary_muscle === selectedMuscle;
			return matchesSearch && matchesEquipment && matchesMuscle;
		});
	});

	// Get target muscles for the current picker day
	let pickerDayMuscles = $derived(() => {
		if (!pickerDayId) return [];
		const day = wizard.workoutDays.find((d) => d.id === pickerDayId);
		return day?.targetMuscles || [];
	});
</script>

<div class="space-y-6">
	<div class="text-center mb-8">
		<h2 class="text-xl font-bold text-[var(--color-text-primary)]">Add Exercises</h2>
		<p class="text-[var(--color-text-secondary)] mt-1">
			Add exercises to each workout day
		</p>
	</div>

	<!-- Day Accordions -->
	<div class="space-y-3">
		{#each wizard.workoutDays as day (day.id)}
			{@const dayExercises = wizard.getExercisesForDay(day.id)}
			{@const isExpanded = expandedDay === day.id}
			{@const timeEst = dayTimeEstimates.get(day.id)}

			<div class="bg-[var(--color-bg-secondary)] rounded-xl overflow-hidden">
				<!-- Day Header -->
				<button
					type="button"
					onclick={() => (expandedDay = isExpanded ? null : day.id)}
					class="w-full flex items-center justify-between p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors"
				>
					<div class="flex items-center gap-3">
						<span
							class="w-8 h-8 rounded-full bg-[var(--color-accent-muted)] text-[var(--color-accent)] flex items-center justify-center font-semibold text-sm"
						>
							{day.dayNumber}
						</span>
						<div class="text-left">
							<span class="font-medium text-[var(--color-text-primary)]">{day.name}</span>
							<div class="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
								<span>{dayExercises.length} exercise{dayExercises.length !== 1 ? 's' : ''}</span>
								{#if timeEst && dayExercises.length > 0}
									<span>·</span>
									<span class="flex items-center gap-1">
										<Clock size={12} />
										{getTimeRange(timeEst.week1.totalMinutes, timeEst.final.totalMinutes)}
									</span>
								{/if}
							</div>
						</div>
					</div>
					{#if isExpanded}
						<ChevronUp size={20} class="text-[var(--color-text-muted)]" />
					{:else}
						<ChevronDown size={20} class="text-[var(--color-text-muted)]" />
					{/if}
				</button>

				<!-- Day Content -->
				{#if isExpanded}
					{@const suggestions = getSmartSuggestions(day.id)}
					{@const hasSuggestions = suggestions.length > 0}
					<div class="p-4 pt-0 space-y-3">
						{#if dayExercises.length === 0}
							<div class="text-center py-6 text-[var(--color-text-muted)]">
								No exercises added yet
							</div>
						{:else}
							{#each dayExercises as slot (slot.id)}
								<div
									class="bg-[var(--color-bg-tertiary)] rounded-lg p-3 flex items-center justify-between"
								>
									<div class="flex-1">
										<div class="font-medium text-[var(--color-text-primary)]">
											{slot.exercise?.name || 'Unknown Exercise'}
										</div>
										<div class="text-sm text-[var(--color-text-muted)] flex flex-wrap gap-2 mt-1">
											<span>{slot.baseSets} sets</span>
											<span>·</span>
											<span>{slot.repRangeMin}-{slot.repRangeMax} reps</span>
											{#if slot.setProgression > 0}
												<span>·</span>
												<span>+{slot.setProgression}/week</span>
											{/if}
										</div>
									</div>
									<button
										type="button"
										onclick={() => wizard.removeExerciseSlot(day.id, slot.id)}
										class="p-2 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
									>
										<Trash2 size={18} />
									</button>
								</div>
							{/each}
						{/if}

						<!-- Action Buttons -->
						<div class="flex gap-2">
							<button
								type="button"
								onclick={() => openPicker(day.id)}
								class="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
							>
								<Plus size={20} />
								<span>Add Exercise</span>
							</button>

							{#if hasSuggestions && day.targetMuscles.length > 0}
								<button
									type="button"
									onclick={() => (showSuggestions = showSuggestions === day.id ? null : day.id)}
									class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-colors"
									title="Smart suggestions based on your volume needs"
								>
									<Wand2 size={18} />
								</button>
							{/if}
						</div>

						<!-- Smart Suggestions -->
						{#if showSuggestions === day.id && hasSuggestions}
							<div class="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-500/20">
								<div class="flex items-center justify-between mb-3">
									<div class="flex items-center gap-2">
										<Sparkles size={16} class="text-purple-400" />
										<span class="text-sm font-medium text-[var(--color-text-primary)]">
											Smart Suggestions
										</span>
									</div>
									<button
										type="button"
										onclick={() => quickFillDay(day.id)}
										class="text-xs px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
									>
										Add All
									</button>
								</div>
								<p class="text-xs text-[var(--color-text-muted)] mb-3">
									Based on target muscles & volume gaps
								</p>
								<div class="space-y-2">
									{#each suggestions as exercise (exercise.id)}
										<button
											type="button"
											onclick={() => addSuggestedExercise(day.id, exercise)}
											class="w-full text-left p-2.5 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors flex items-center gap-3"
										>
											<Plus size={16} class="text-purple-400 flex-shrink-0" />
											<div class="flex-1 min-w-0">
												<div class="font-medium text-sm text-[var(--color-text-primary)] truncate">
													{exercise.name}
												</div>
												<div class="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
													<span class="capitalize">{exercise.equipment}</span>
													<span>·</span>
													<span>{formatMuscle(exercise.primary_muscle)}</span>
												</div>
											</div>
										</button>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Weekly Volume Summary -->
	{#if weeklyVolumes.length > 0}
		<div class="bg-[var(--color-bg-secondary)] rounded-xl overflow-hidden">
			<button
				type="button"
				onclick={() => (showVolume = !showVolume)}
				class="w-full flex items-center justify-between p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors"
			>
				<div class="flex items-center gap-3">
					<BarChart3 size={20} class="text-[var(--color-accent)]" />
					<div class="text-left">
						<span class="font-medium text-[var(--color-text-primary)]">Weekly Volume</span>
						<div class="flex items-center gap-2 mt-0.5">
							{#if volumeStats.goodCount > 0}
								<span class="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
									{volumeStats.goodCount} good
								</span>
							{/if}
							{#if volumeStats.lowCount > 0}
								<span class="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
									{volumeStats.lowCount} low
								</span>
							{/if}
							{#if volumeStats.highCount > 0}
								<span class="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
									{volumeStats.highCount} high
								</span>
							{/if}
						</div>
					</div>
				</div>
				{#if showVolume}
					<ChevronUp size={20} class="text-[var(--color-text-muted)]" />
				{:else}
					<ChevronDown size={20} class="text-[var(--color-text-muted)]" />
				{/if}
			</button>

			{#if showVolume}
				<div class="p-4 pt-0 space-y-2">
					{#each weeklyVolumes as vol (vol.muscleId)}
						{@const barColor = getVolumeBarColor(vol.status)}
						<div class="flex items-center gap-3">
							<span class="text-sm text-[var(--color-text-secondary)] min-w-[90px] truncate">
								{vol.muscleName}
							</span>
							<div class="flex-1 h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
								<div
									class="h-full rounded-full {barColor}"
									style="width: {Math.min((vol.totalSets / vol.mrv) * 100, 100)}%"
								></div>
							</div>
							<span class="text-sm font-medium min-w-[50px] text-right {
								vol.status === 'low' ? 'text-red-400' :
								vol.status === 'good' ? 'text-green-400' :
								vol.status === 'high' ? 'text-yellow-400' :
								vol.status === 'excessive' ? 'text-orange-400' :
								'text-[var(--color-text-muted)]'
							}">
								{vol.totalSets} sets
							</span>
						</div>
					{/each}

					<!-- Legend -->
					<div class="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-center gap-4 text-[10px] text-[var(--color-text-muted)]">
						<span class="flex items-center gap-1">
							<span class="w-2 h-2 rounded-full bg-red-500"></span> Low
						</span>
						<span class="flex items-center gap-1">
							<span class="w-2 h-2 rounded-full bg-green-500"></span> Good
						</span>
						<span class="flex items-center gap-1">
							<span class="w-2 h-2 rounded-full bg-yellow-500"></span> High
						</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Estimated Time Summary -->
	{#if wizard.workoutDays.some((d) => (wizard.exerciseSlots[d.id] || []).length > 0)}
		<div class="bg-[var(--color-bg-secondary)] rounded-xl overflow-hidden">
			<button
				type="button"
				onclick={() => (showTime = !showTime)}
				class="w-full flex items-center justify-between p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors"
			>
				<div class="flex items-center gap-3">
					<Clock size={20} class="text-[var(--color-accent)]" />
					<div class="text-left">
						<span class="font-medium text-[var(--color-text-primary)]">Estimated Time</span>
						<div class="flex items-center gap-2 mt-0.5">
							<span class="text-[10px] bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] px-1.5 py-0.5 rounded">
								{timeStats.totalWeek1}-{timeStats.totalFinal} min/week
							</span>
							{#if timeStats.overBudgetCount > 0}
								<span class="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
									{timeStats.overBudgetCount} over budget
								</span>
							{/if}
						</div>
					</div>
				</div>
				{#if showTime}
					<ChevronUp size={20} class="text-[var(--color-text-muted)]" />
				{:else}
					<ChevronDown size={20} class="text-[var(--color-text-muted)]" />
				{/if}
			</button>

			{#if showTime}
				<div class="p-4 pt-0 space-y-2">
					{#each wizard.workoutDays as day (day.id)}
						{@const timeEst = dayTimeEstimates.get(day.id)}
						{@const daySlots = wizard.exerciseSlots[day.id] || []}
						{#if timeEst && daySlots.length > 0}
							{@const barColor = getTimeBarColor(timeEst.final.status)}
							{@const statusColor =
								timeEst.final.status === 'under'
									? 'text-blue-400'
									: timeEst.final.status === 'on_target'
										? 'text-green-400'
										: timeEst.final.status === 'over'
											? 'text-yellow-400'
											: 'text-red-400'}
							<div class="flex items-center gap-3">
								<span class="text-sm text-[var(--color-text-secondary)] min-w-[90px] truncate">
									{day.name}
								</span>
								<div class="flex-1 h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
									{#if timeEst.final.budgetMinutes}
										<div
											class="h-full rounded-full {barColor}"
											style="width: {Math.min((timeEst.final.totalMinutes / timeEst.final.budgetMinutes) * 100, 100)}%"
										></div>
									{:else}
										<div class="h-full rounded-full bg-[var(--color-accent)]" style="width: 75%"></div>
									{/if}
								</div>
								<span class="text-sm font-medium min-w-[70px] text-right {statusColor}">
									{getTimeRange(timeEst.week1.totalMinutes, timeEst.final.totalMinutes)}
								</span>
							</div>
						{/if}
					{/each}

					<!-- Legend -->
					<div class="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-center gap-4 text-[10px] text-[var(--color-text-muted)]">
						<span class="flex items-center gap-1">
							<span class="w-2 h-2 rounded-full bg-blue-500"></span> Under
						</span>
						<span class="flex items-center gap-1">
							<span class="w-2 h-2 rounded-full bg-green-500"></span> On Target
						</span>
						<span class="flex items-center gap-1">
							<span class="w-2 h-2 rounded-full bg-yellow-500"></span> Over
						</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Exercise Picker Modal - Full screen on mobile -->
{#if showPicker}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="exercise-picker-open fixed inset-0 z-[9999] flex flex-col"
		onclick={closePicker}
	>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/80"></div>

		<!-- Modal Container - Full screen on mobile, centered on desktop -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative flex-1 flex flex-col bg-[var(--color-bg-primary)] sm:m-auto sm:flex-initial sm:w-full sm:max-w-lg sm:max-h-[85vh] sm:rounded-xl sm:shadow-2xl overflow-hidden"
			onclick={(e) => e.stopPropagation()}
		>

			<!-- Header -->
			<div class="p-4 border-b border-[var(--color-border)] flex-shrink-0">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Select Exercise</h3>
					<button
						type="button"
						onclick={closePicker}
						class="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors text-xl"
					>
						&times;
					</button>
				</div>

				<!-- Search -->
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search exercises..."
					class="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
				/>

				<!-- Muscle Filter -->
				{#if pickerDayMuscles().length > 0}
					<div class="mt-3">
						<div class="flex items-center gap-2 mb-2">
							<Filter size={14} class="text-[var(--color-text-muted)]" />
							<span class="text-xs text-[var(--color-text-muted)]">Target muscles for this day:</span>
						</div>
						<div class="flex flex-wrap gap-2">
							<button
								type="button"
								onclick={() => (selectedMuscle = null)}
								class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors {selectedMuscle === null
									? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
									: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
							>
								All Muscles
							</button>
							{#each pickerDayMuscles() as muscle}
								<button
									type="button"
									onclick={() => (selectedMuscle = selectedMuscle === muscle ? null : muscle)}
									class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors {selectedMuscle ===
									muscle
										? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
										: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
								>
									{formatMuscle(muscle)}
								</button>
							{/each}
						</div>
					</div>
				{:else}
					<!-- All muscles filter when no target muscles set -->
					<div class="mt-3">
						<div class="flex items-center gap-2 mb-2">
							<Filter size={14} class="text-[var(--color-text-muted)]" />
							<span class="text-xs text-[var(--color-text-muted)]">Filter by muscle:</span>
						</div>
						<div class="flex flex-wrap gap-1.5">
							<button
								type="button"
								onclick={() => (selectedMuscle = null)}
								class="px-2 py-1 rounded-full text-xs transition-colors {selectedMuscle === null
									? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
									: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'}"
							>
								All
							</button>
							{#each muscleGroups as muscle}
								<button
									type="button"
									onclick={() => (selectedMuscle = selectedMuscle === muscle ? null : muscle)}
									class="px-2 py-1 rounded-full text-xs transition-colors {selectedMuscle === muscle
										? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
										: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'}"
								>
									{formatMuscle(muscle)}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Equipment Filter -->
				<div class="mt-3">
					<div class="flex items-center gap-2 mb-2">
						<span class="text-xs text-[var(--color-text-muted)]">Equipment:</span>
					</div>
					<div class="flex flex-wrap gap-2">
						<button
							type="button"
							onclick={() => (selectedEquipment = null)}
							class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors {selectedEquipment === null
								? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
								: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
						>
							All
						</button>
						{#each equipmentTypes as eq}
							<button
								type="button"
								onclick={() => (selectedEquipment = selectedEquipment === eq ? null : eq)}
								class="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors {selectedEquipment ===
								eq
									? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
									: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
							>
								{eq}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Exercise List - Scrollable -->
			<div class="flex-1 overflow-y-auto p-4 min-h-0">
				{#if loading}
					<div class="text-center py-8 text-[var(--color-text-muted)]">Loading exercises...</div>
				{:else if filteredExercises().length === 0}
					<div class="text-center py-8 text-[var(--color-text-muted)]">No exercises found</div>
				{:else}
					<div class="space-y-2 pb-4">
						{#each filteredExercises() as exercise}
							<button
								type="button"
								onclick={() => selectExercise(exercise)}
								class="w-full text-left p-4 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
							>
								<div class="font-medium text-[var(--color-text-primary)]">{exercise.name}</div>
								<div class="flex items-center gap-2 mt-2">
									<span
										class="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] capitalize"
									>
										{exercise.equipment}
									</span>
									<span
										class="px-2 py-0.5 rounded text-xs bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
									>
										{formatMuscle(exercise.primary_muscle)}
									</span>
								</div>
							</button>
						{/each}
					</div>
					<div class="text-center text-sm text-[var(--color-text-muted)] py-2">
						{filteredExercises().length} exercise{filteredExercises().length !== 1 ? 's' : ''}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* Prevent body scroll when modal is open */
	:global(body:has(.exercise-picker-open)) {
		overflow: hidden;
	}
</style>
