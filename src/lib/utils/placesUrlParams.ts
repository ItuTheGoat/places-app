import type {
	PlaceCategory,
	PlaceFilterState,
	PlacePriority,
	PlaceSortKey,
	PlaceStatus
} from '$lib/types/place';

export const PLACES_URL_QUERY = {
	category: 'category',
	status: 'status',
	priority: 'priority',
	location: 'location',
	sort: 'sort',
	show: 'show'
} as const;

const SORT_KEYS: PlaceSortKey[] = [
	'date_desc',
	'date_asc',
	'name_asc',
	'name_desc',
	'priority_desc'
];

export type ParsePlacesUrlOptions = {
	categories: readonly PlaceCategory[];
	statuses: readonly PlaceStatus[];
	priorities: readonly PlacePriority[];
	locations: readonly string[];
	defaultSort: PlaceSortKey;
};

export function parsePlacesUrlParams(
	searchParams: URLSearchParams,
	opts: ParsePlacesUrlOptions
): { filters: PlaceFilterState; sort: PlaceSortKey; show: number | null } {
	const filters: PlaceFilterState = {
		category: 'all',
		status: 'all',
		priority: 'all',
		location: 'all'
	};

	const cat = searchParams.get(PLACES_URL_QUERY.category);
	if (cat && opts.categories.includes(cat as PlaceCategory)) {
		filters.category = cat as PlaceCategory;
	}

	const st = searchParams.get(PLACES_URL_QUERY.status);
	if (st && opts.statuses.includes(st as PlaceStatus)) {
		filters.status = st as PlaceStatus;
	}

	const pr = searchParams.get(PLACES_URL_QUERY.priority);
	if (pr && opts.priorities.includes(pr as PlacePriority)) {
		filters.priority = pr as PlacePriority;
	}

	const loc = searchParams.get(PLACES_URL_QUERY.location);
	if (loc && opts.locations.includes(loc)) {
		filters.location = loc;
	}

	const sortRaw = searchParams.get(PLACES_URL_QUERY.sort);
	const sort: PlaceSortKey =
		sortRaw && SORT_KEYS.includes(sortRaw as PlaceSortKey)
			? (sortRaw as PlaceSortKey)
			: opts.defaultSort;

	const showRaw = searchParams.get(PLACES_URL_QUERY.show);
	let show: number | null = null;
	if (showRaw !== null && showRaw !== '') {
		const n = Number.parseInt(showRaw, 10);
		if (Number.isFinite(n) && n > 0) {
			show = n;
		}
	}

	return { filters, sort, show };
}

export type BuildPlacesUrlDefaults = {
	filters: PlaceFilterState;
	sort: PlaceSortKey;
	pageSize: number;
};

export function buildPlacesUrlSearchParams(
	filters: PlaceFilterState,
	sort: PlaceSortKey,
	visibleCount: number,
	defaults: BuildPlacesUrlDefaults
): URLSearchParams {
	const p = new URLSearchParams();

	if (filters.category !== defaults.filters.category) {
		p.set(PLACES_URL_QUERY.category, filters.category);
	}
	if (filters.status !== defaults.filters.status) {
		p.set(PLACES_URL_QUERY.status, filters.status);
	}
	if (filters.priority !== defaults.filters.priority) {
		p.set(PLACES_URL_QUERY.priority, filters.priority);
	}
	if (filters.location !== defaults.filters.location) {
		p.set(PLACES_URL_QUERY.location, filters.location);
	}
	if (sort !== defaults.sort) {
		p.set(PLACES_URL_QUERY.sort, sort);
	}
	if (visibleCount !== defaults.pageSize) {
		p.set(PLACES_URL_QUERY.show, String(visibleCount));
	}

	return p;
}
