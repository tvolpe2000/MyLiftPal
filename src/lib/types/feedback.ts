export type FeedbackType = 'bug' | 'feature' | 'general';
export type FeedbackStatus = 'new' | 'reviewed' | 'resolved' | 'wont_fix';

export interface UserFeedback {
	id: string;
	user_id: string | null;
	type: FeedbackType;
	title: string;
	description: string;
	screenshot_urls: string[];
	app_version: string | null;
	user_agent: string | null;
	status: FeedbackStatus;
	created_at: string;
	updated_at: string;
}
