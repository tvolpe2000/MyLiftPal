/**
 * AI Provider Manager for IronAthena
 *
 * Manages multiple AI providers and allows switching between them.
 * Supports Claude, OpenAI, Gemini, and self-hosted models.
 */

import type { AIProvider, ProviderId, ToolCall, WorkoutContext } from './types';

class AIProviderManager {
	private providers: Map<ProviderId, AIProvider> = new Map();
	private activeProviderId: ProviderId = 'openai';

	/**
	 * Register an AI provider
	 */
	register(provider: AIProvider): void {
		this.providers.set(provider.name, provider);
	}

	/**
	 * Set the active provider
	 */
	setActive(providerId: ProviderId): void {
		if (!this.providers.has(providerId)) {
			console.warn(`Provider "${providerId}" not registered, keeping current: ${this.activeProviderId}`);
			return;
		}
		this.activeProviderId = providerId;
	}

	/**
	 * Get the currently active provider ID
	 */
	getActiveProviderId(): ProviderId {
		return this.activeProviderId;
	}

	/**
	 * Get a specific provider by ID
	 */
	getProvider(providerId: ProviderId): AIProvider | undefined {
		return this.providers.get(providerId);
	}

	/**
	 * Get the active provider
	 */
	getActiveProvider(): AIProvider | undefined {
		return this.providers.get(this.activeProviderId);
	}

	/**
	 * Get all registered provider IDs
	 */
	getRegisteredProviders(): ProviderId[] {
		return Array.from(this.providers.keys());
	}

	/**
	 * Check if a provider is available
	 */
	async isProviderAvailable(providerId: ProviderId): Promise<boolean> {
		const provider = this.providers.get(providerId);
		if (!provider) return false;
		return provider.isAvailable();
	}

	/**
	 * Parse a workout command using the active provider
	 */
	async parse(transcript: string, context: WorkoutContext): Promise<ToolCall> {
		const provider = this.getActiveProvider();

		if (!provider) {
			throw new Error(`No active AI provider. Active: ${this.activeProviderId}, Registered: ${this.getRegisteredProviders().join(', ')}`);
		}

		const isAvailable = await provider.isAvailable();
		if (!isAvailable) {
			throw new Error(`AI provider "${this.activeProviderId}" is not available`);
		}

		return provider.parseWorkoutCommand(transcript, context);
	}

	/**
	 * Parse with fallback to other providers if primary fails
	 */
	async parseWithFallback(
		transcript: string,
		context: WorkoutContext,
		fallbackOrder?: ProviderId[]
	): Promise<{ toolCall: ToolCall; providerId: ProviderId }> {
		const order = fallbackOrder || [this.activeProviderId, ...this.getRegisteredProviders().filter(p => p !== this.activeProviderId)];

		for (const providerId of order) {
			const provider = this.providers.get(providerId);
			if (!provider) continue;

			try {
				const isAvailable = await provider.isAvailable();
				if (!isAvailable) continue;

				const toolCall = await provider.parseWorkoutCommand(transcript, context);
				return { toolCall, providerId };
			} catch (error) {
				console.warn(`Provider "${providerId}" failed:`, error);
				continue;
			}
		}

		throw new Error('All AI providers failed to parse the command');
	}
}

// Singleton instance
export const aiManager = new AIProviderManager();

// Re-export for convenience
export { AIProviderManager };
