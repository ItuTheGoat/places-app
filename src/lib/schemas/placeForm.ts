import { z } from 'zod';
import { zod, zodClient } from 'sveltekit-superforms/adapters';

import {
	PLACE_CATEGORIES,
	PLACE_PRIORITIES,
	PLACE_STATUSES,
	PLACE_VIBES,
	type PlaceCategory,
	type PlacePriority,
	type PlaceStatus,
	type PlaceVibe
} from '$lib/types/place';

/** Max images per place (client + documented rules). */
export const MAX_PLACE_IMAGES = 5;

/** Max file size per image (bytes). */
export const MAX_PLACE_IMAGE_BYTES = 5 * 1024 * 1024;

const emptyToUndefined = (v: string | undefined): string | undefined => {
	if (v === undefined) return undefined;
	const t = v.trim();
	return t.length === 0 ? undefined : t;
};

/**
 * Superforms + Firestore field shape for create/edit (SPA validation).
 * Uses **Zod 3** stable (`zod` package) with `sveltekit-superforms` `zod` / `zodClient` adapters.
 */
export const placeFormSchema = z.object({
	listId: z.string().min(1, 'Choose a list.'),
	name: z.string().min(1, 'Enter a place name.').max(200, 'Shorten the place name.'),
	category: z.enum(PLACE_CATEGORIES),
	status: z.enum(PLACE_STATUSES),
	priority: z.enum(PLACE_PRIORITIES),
	location: z.string().max(500, 'Shorten the location.'),
	mapsUrl: z
		.union([z.literal(''), z.string().url('Enter a valid link, or leave this blank.')])
		.default(''),
	vibe: z.union([z.literal(''), z.enum(PLACE_VIBES)]).default(''),
	notes: z.string().max(5000, 'Shorten the notes.')
});

/**
 * Superforms adapters for `superValidate` / `superForm` validators.
 * Zod 3.25 `ZodObject` is runtime-compatible; the adapter’s `ZodObjectType` typedef lags Zod 3.25’s generics.
 */
// @ts-expect-error Zod 3.25 schema is assignable at runtime; superforms types expect a looser `ZodObjectType`
export const placeFormZodAdapter = zod(placeFormSchema);
// @ts-expect-error same as placeFormZodAdapter
export const placeFormZodClient = zodClient(placeFormSchema);

export type PlaceFormData = z.infer<typeof placeFormSchema>;

export function defaultPlaceFormValues(): PlaceFormData {
	return {
		listId: '',
		name: '',
		category: PLACE_CATEGORIES[0] as PlaceCategory,
		status: PLACE_STATUSES[0] as PlaceStatus,
		priority: PLACE_PRIORITIES[1] as PlacePriority,
		location: '',
		mapsUrl: '',
		vibe: '',
		notes: ''
	};
}

/** Image row for create/edit flows (handled outside Zod; validated in `PlaceForm`). */
export type PlaceImageItem =
	| { id: string; kind: 'new'; file: File }
	| { id: string; kind: 'existing'; url: string };

export type PlaceFormSubmitContext = {
	form: PlaceFormData;
	items: PlaceImageItem[];
	mainImageId: string;
};

export function placeFormToFirestoreFields(data: PlaceFormData): {
	category: PlaceCategory;
	status: PlaceStatus;
	priority: PlacePriority;
	name: string;
	location?: string;
	mapsUrl?: string;
	vibe?: PlaceVibe;
	notes?: string;
} {
	const location = emptyToUndefined(data.location);
	const mapsUrl = data.mapsUrl === '' ? undefined : data.mapsUrl;
	const vibe = data.vibe === '' ? undefined : (data.vibe as PlaceVibe);
	const notes = emptyToUndefined(data.notes);

	return {
		name: data.name.trim(),
		category: data.category,
		status: data.status,
		priority: data.priority,
		...(location !== undefined ? { location } : {}),
		...(mapsUrl !== undefined ? { mapsUrl } : {}),
		...(vibe !== undefined ? { vibe } : {}),
		...(notes !== undefined ? { notes } : {})
	};
}
