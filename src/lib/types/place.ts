import type { Timestamp } from 'firebase/firestore';

export const PLACE_CATEGORIES = ['restaurant', 'activity', 'experience'] as const;
export const PLACE_STATUSES = ['want', 'planned', 'visited'] as const;
export const PLACE_PRIORITIES = ['low', 'medium', 'high'] as const;
export const PLACE_VIBES = ['chill', 'fun', 'romantic', 'adventurous'] as const;

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];
export type PlaceStatus = (typeof PLACE_STATUSES)[number];
export type PlacePriority = (typeof PLACE_PRIORITIES)[number];
export type PlaceVibe = (typeof PLACE_VIBES)[number];

export type PlaceDoc = {
	listId: string;
	name: string;
	category: PlaceCategory;
	location?: string;
	mapsUrl?: string;
	status: PlaceStatus;
	priority: PlacePriority;
	vibe?: PlaceVibe;
	notes?: string;
	imageUrls: string[];
	createdBy: string;
	createdAt: Timestamp;
	visitedAt?: Timestamp;
	rating?: number;
	wouldReturn?: boolean;
};
