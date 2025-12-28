<script lang="ts">
	import { wizard } from '$lib/stores/wizardStore.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { supabase } from '$lib/db/supabase';
	import type { Exercise, LifterLevel } from '$lib/types';
	import { createDefaultExerciseSlot } from '$lib/types/wizard';
	import { Plus, Trash2, ChevronDown, ChevronUp, BarChart3, Wand2, Sparkles, Clock, Zap } from 'lucide-svelte';
	import { calculateWeeklyVolume, getVolumeBarColor } from '$lib/utils/volume';
	import type { MuscleVolume, MuscleGroupData, ExerciseForVolume } from '$lib/utils/volume';
	import { calculateDayTime, getTimeBarColor, getTimeRange } from '$lib/utils/time';
	import type { ExerciseSlotForTime, DayTimeEstimate } from '$lib/utils/time';
	import { calculateBlockFillSuggestions, type FillSuggestion } from '$lib/utils/fillToOptimal';
	import ExercisePicker from '$lib/components/shared/ExercisePicker.svelte';
	import FillToOptimalModal from './FillToOptimalModal.svelte';

	let exercises = $state<Exercise[]>([]);
	let muscleGroupsData = $state<MuscleGroupData[]>([]);
	let loading = $state(true);
	let expandedDay = $state<string | null>(wizard.workoutDays[0]?.id || null);
	let showPicker = $state(false);
	let pickerDayId = $state<string | null>(null);
	let pickerMuscle = $state<string | null>(null);
	let showVolume = $state(true);
	let showTime = $state(true);
	let showSuggestions = $state<string | null>(null); // dayId or null
	let showFillModal = $state(false);
	let fillSuggestions = $state<FillSuggestion[]>([]);

	// Get user's lifter level (default to intermediate if not set)
	const userLevel = $derived<LifterLevel>(
		(auth.profile?.lifter_level as LifterLevel) || 'intermediate'
	);

	// Create a muscle groups map for fill calculations
	const muscleGroupsMap = $derived.by(() => {
		const map = new Map<string, string>();
		for (const mg of muscleGroupsData) {
			map.set(mg.id, mg.display_name);
		}
		return map;
	});

	// Build slots map for block-level calculations
	const allSlotsMap = $derived.by(() => {
		const map = new Map<string, import('$lib/types/wizard').ExerciseSlotDraft[]>();
		for (const day of wizard.workoutDays) {
			map.set(day.id, wizard.exerciseSlots[day.id] || []);
		}
		return map;
	});

	// Calculate fill suggestions for the entire block
	function openFillModal() {
		if (exercises.length === 0 || wizard.workoutDays.length === 0) return;

		const result = calculateBlockFillSuggestions(
			wizard.workoutDays,
			allSlotsMap,
			userLevel,
			muscleGroupsMap,
			exercises
		);

		fillSuggestions = result.suggestions;
		showFillModal = true;
	}

	function handleFillConfirm(slotsByDay: Map<string, import('$lib/types/wizard').ExerciseSlotDraft[]>) {
		// Add slots to each day
		for (const [dayId, slots] of slotsByDay) {
			const existingSlots = wizard.getExercisesForDay(dayId);
			let slotOrder = existingSlots.length;

			for (const slot of slots) {
				slot.slotOrder = slotOrder++;
				wizard.addExerciseSlot(dayId, slot);
			}
		}

		showFillModal = false;
	}

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

		// Pre-select first target muscle from the day if available
		const day = wizard.workoutDays.find((d) => d.id === dayId);
		const muscles = day?.targetMuscles;
		pickerMuscle = muscles && muscles.length > 0 ? muscles[0] : null;
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
			<div class="flex items-center justify-between p-4">
				<button
					type="button"
					onclick={() => (showVolume = !showVolume)}
					class="flex-1 flex items-center gap-3 hover:opacity-80 transition-opacity"
				>
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
				</button>

				<div class="flex items-center gap-2">
					{#if volumeStats.lowCount > 0}
						<button
							type="button"
							onclick={() => openFillModal()}
							class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-colors text-sm font-medium"
							title="Fill to optimal weekly volume (MEV)"
						>
							<Zap size={16} />
							<span class="hidden sm:inline">Fill to Optimal</span>
						</button>
					{/if}
					<button
						type="button"
						onclick={() => (showVolume = !showVolume)}
						class="p-1"
					>
						{#if showVolume}
							<ChevronUp size={20} class="text-[var(--color-text-muted)]" />
						{:else}
							<ChevronDown size={20} class="text-[var(--color-text-muted)]" />
						{/if}
					</button>
				</div>
			</div>

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

<!-- Exercise Picker -->
<ExercisePicker
	open={showPicker}
	onselect={selectExercise}
	onclose={closePicker}
	preselectedMuscle={pickerMuscle}
/>

<!-- Fill to Optimal Modal -->
{#if showFillModal}
	<FillToOptimalModal
		suggestions={fillSuggestions}
		totalSetsToAdd={fillSuggestions.reduce((sum, s) => sum + s.setsToAdd, 0)}
		onConfirm={handleFillConfirm}
		onClose={() => (showFillModal = false)}
	/>
{/if}
