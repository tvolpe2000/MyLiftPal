/**
 * Image Constants
 *
 * Base URLs and image assets from external sources.
 * Source: Wger API (https://wger.de) - AGPL-3.0 license
 */

export const WGER_IMAGES = {
	// Base body diagrams (use as background layer)
	BODY_FRONT: 'https://wger.de/static/images/muscles/muscular_system_front.svg',
	BODY_BACK: 'https://wger.de/static/images/muscles/muscular_system_back.svg',

	// Base URL for muscle overlays (stored in muscle_groups.image_url_main)
	MUSCLE_BASE: 'https://wger.de/static/images/muscles',
} as const;

/**
 * Get the appropriate base body SVG URL based on muscle position
 */
export function getBodyBaseImage(isFront: boolean): string {
	return isFront ? WGER_IMAGES.BODY_FRONT : WGER_IMAGES.BODY_BACK;
}
