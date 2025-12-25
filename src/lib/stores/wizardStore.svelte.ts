import type {
	WizardState,
	WizardStep,
	WorkoutDayDraft,
	ExerciseSlotDraft
} from '$lib/types/wizard';
import { createDefaultWorkoutDay } from '$lib/types/wizard';
import type { WorkoutTemplate, TemplateExercise } from '$lib/data/templates';
import type { Exercise } from '$lib/types';

function createWizardStore() {
	let state = $state<WizardState>({
		currentStep: 1,
		blockName: '',
		totalWeeks: 5,
		daysPerWeek: 4,
		timeBudgetMinutes: null,
		workoutDays: [],
		exerciseSlots: {},
		isValid: false,
		isDirty: false
	});

	// Derived validations
	const step1Valid = $derived(
		state.blockName.trim().length > 0 &&
			state.totalWeeks >= 4 &&
			state.totalWeeks <= 8 &&
			state.daysPerWeek >= 1 &&
			state.daysPerWeek <= 7
	);

	const step2Valid = $derived(
		state.workoutDays.length > 0 &&
			state.workoutDays.length === state.daysPerWeek &&
			state.workoutDays.every((d) => d.name.trim().length > 0)
	);

	const step3Valid = $derived(() => {
		// Each day must have at least one exercise
		for (const day of state.workoutDays) {
			const slots = state.exerciseSlots[day.id] || [];
			if (slots.length === 0) return false;
		}
		return true;
	});

	const canProceed = $derived(() => {
		switch (state.currentStep) {
			case 1:
				return step1Valid;
			case 2:
				return step2Valid;
			case 3:
				return step3Valid();
			case 4:
				return true;
			default:
				return false;
		}
	});

	function reset() {
		state = {
			currentStep: 1,
			blockName: '',
			totalWeeks: 5,
			daysPerWeek: 4,
			timeBudgetMinutes: null,
			workoutDays: [],
			exerciseSlots: {},
			isValid: false,
			isDirty: false
		};
	}

	function setStep(step: WizardStep) {
		state.currentStep = step;
	}

	function nextStep() {
		if (state.currentStep < 4) {
			state.currentStep = (state.currentStep + 1) as WizardStep;
		}
	}

	function prevStep() {
		if (state.currentStep > 1) {
			state.currentStep = (state.currentStep - 1) as WizardStep;
		}
	}

	// Step 1: Basic Info
	function setBlockName(name: string) {
		state.blockName = name;
		state.isDirty = true;
	}

	function setTotalWeeks(weeks: number) {
		state.totalWeeks = Math.min(8, Math.max(4, weeks));
		state.isDirty = true;
	}

	function setDaysPerWeek(days: number) {
		const newDays = Math.min(7, Math.max(1, days));
		state.daysPerWeek = newDays;
		state.isDirty = true;

		// Adjust workout days array if needed
		if (state.workoutDays.length > newDays) {
			// Remove extra days and their exercises
			const removedDays = state.workoutDays.slice(newDays);
			state.workoutDays = state.workoutDays.slice(0, newDays);
			for (const day of removedDays) {
				delete state.exerciseSlots[day.id];
			}
		}
	}

	function setTimeBudget(minutes: number | null) {
		state.timeBudgetMinutes = minutes;
		state.isDirty = true;
	}

	// Step 2: Workout Days
	function initializeWorkoutDays() {
		// Only initialize if empty or count changed
		if (state.workoutDays.length !== state.daysPerWeek) {
			const newDays: WorkoutDayDraft[] = [];
			for (let i = 1; i <= state.daysPerWeek; i++) {
				// Preserve existing day if available
				const existing = state.workoutDays.find((d) => d.dayNumber === i);
				if (existing) {
					newDays.push(existing);
				} else {
					newDays.push(createDefaultWorkoutDay(i));
				}
			}
			state.workoutDays = newDays;
		}
	}

	function updateWorkoutDay(dayId: string, updates: Partial<WorkoutDayDraft>) {
		const index = state.workoutDays.findIndex((d) => d.id === dayId);
		if (index !== -1) {
			state.workoutDays[index] = { ...state.workoutDays[index], ...updates };
			state.isDirty = true;
		}
	}

	// Step 3: Exercises
	function addExerciseSlot(dayId: string, slot: ExerciseSlotDraft) {
		if (!state.exerciseSlots[dayId]) {
			state.exerciseSlots[dayId] = [];
		}
		state.exerciseSlots[dayId].push(slot);
		state.isDirty = true;
	}

	function updateExerciseSlot(dayId: string, slotId: string, updates: Partial<ExerciseSlotDraft>) {
		const slots = state.exerciseSlots[dayId];
		if (slots) {
			const index = slots.findIndex((s) => s.id === slotId);
			if (index !== -1) {
				slots[index] = { ...slots[index], ...updates };
				state.isDirty = true;
			}
		}
	}

	function removeExerciseSlot(dayId: string, slotId: string) {
		const slots = state.exerciseSlots[dayId];
		if (slots) {
			state.exerciseSlots[dayId] = slots.filter((s) => s.id !== slotId);
			// Reorder remaining slots
			state.exerciseSlots[dayId].forEach((s, i) => {
				s.slotOrder = i;
			});
			state.isDirty = true;
		}
	}

	function reorderExerciseSlots(dayId: string, fromIndex: number, toIndex: number) {
		const slots = state.exerciseSlots[dayId];
		if (slots && fromIndex !== toIndex) {
			const [removed] = slots.splice(fromIndex, 1);
			slots.splice(toIndex, 0, removed);
			slots.forEach((s, i) => {
				s.slotOrder = i;
			});
			state.isDirty = true;
		}
	}

	function getExercisesForDay(dayId: string): ExerciseSlotDraft[] {
		return state.exerciseSlots[dayId] || [];
	}

	// Apply a template to the wizard
	function applyTemplate(
		template: WorkoutTemplate,
		includeExercises: boolean,
		exerciseDb: Exercise[]
	) {
		// Update basic info - set block name to template name as starting point
		state.blockName = template.name;
		state.daysPerWeek = template.daysPerWeek;

		// Create workout days from template
		const newDays: WorkoutDayDraft[] = [];
		const newSlots: Record<string, ExerciseSlotDraft[]> = {};

		for (let i = 0; i < template.days.length; i++) {
			const templateDay = template.days[i];
			const dayId = crypto.randomUUID();

			newDays.push({
				id: dayId,
				dayNumber: i + 1,
				name: templateDay.name,
				targetMuscles: templateDay.targetMuscles,
				timeBudgetMinutes: null
			});

			// Add exercises if requested
			if (includeExercises && templateDay.exercises) {
				newSlots[dayId] = [];
				let slotOrder = 0;

				for (const templateEx of templateDay.exercises) {
					// Find the exercise in the database by name
					const exercise = exerciseDb.find(
						(ex) => ex.name.toLowerCase() === templateEx.exerciseName.toLowerCase()
					);

					if (exercise) {
						newSlots[dayId].push({
							id: crypto.randomUUID(),
							exerciseId: exercise.id,
							exercise: exercise,
							slotOrder: slotOrder++,
							baseSets: templateEx.baseSets,
							setProgression: templateEx.setProgression,
							repRangeMin: templateEx.repRangeMin,
							repRangeMax: templateEx.repRangeMax,
							restSeconds: null,
							supersetGroup: null,
							notes: ''
						});
					}
				}
			}
		}

		state.workoutDays = newDays;
		state.exerciseSlots = newSlots;
		state.isDirty = true;
	}

	return {
		// State getters
		get currentStep() {
			return state.currentStep;
		},
		get blockName() {
			return state.blockName;
		},
		get totalWeeks() {
			return state.totalWeeks;
		},
		get daysPerWeek() {
			return state.daysPerWeek;
		},
		get timeBudgetMinutes() {
			return state.timeBudgetMinutes;
		},
		get workoutDays() {
			return state.workoutDays;
		},
		get exerciseSlots() {
			return state.exerciseSlots;
		},
		get isDirty() {
			return state.isDirty;
		},

		// Validation getters
		get step1Valid() {
			return step1Valid;
		},
		get step2Valid() {
			return step2Valid;
		},
		get step3Valid() {
			return step3Valid();
		},
		get canProceed() {
			return canProceed();
		},

		// Actions
		reset,
		setStep,
		nextStep,
		prevStep,
		setBlockName,
		setTotalWeeks,
		setDaysPerWeek,
		setTimeBudget,
		initializeWorkoutDays,
		updateWorkoutDay,
		addExerciseSlot,
		updateExerciseSlot,
		removeExerciseSlot,
		reorderExerciseSlots,
		getExercisesForDay,
		applyTemplate
	};
}

export const wizard = createWizardStore();
