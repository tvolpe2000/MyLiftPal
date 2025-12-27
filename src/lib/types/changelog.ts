// Types for changelog and roadmap features

export type RoadmapStatus = 'tracked' | 'planned' | 'in_progress';

export interface AppRelease {
	id: string;
	version: string;
	title: string | null;
	released_at: string;
	highlights: string[];
	changes: string[];
	is_published: boolean;
	created_at: string;
}

export interface RoadmapItem {
	id: string;
	title: string;
	description: string | null;
	status: RoadmapStatus;
	sort_order: number;
	is_visible: boolean;
	created_at: string;
	updated_at: string;
}

export interface ChangelogState {
	releases: AppRelease[];
	roadmap: RoadmapItem[];
	currentVersion: string | null;
	lastSeenVersion: string | null;
	hasNewUpdates: boolean;
	loading: boolean;
	initialized: boolean;
}
