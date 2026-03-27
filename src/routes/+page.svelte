<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authStore } from '$lib/stores/auth.svelte';
	import PlaceFilterModal from '$lib/components/places/PlaceFilterModal.svelte';
	import PlaceSortModal from '$lib/components/places/PlaceSortModal.svelte';
	import {
		buildPlacesUrlSearchParams,
		parsePlacesUrlParams
	} from '$lib/utils/placesUrlParams';
	import type {
		PlaceCategory,
		PlaceFilterState,
		PlacePriority,
		PlaceSortKey,
		PlaceStatus
	} from '$lib/types/place';

	type MockPlace = {
		id: string;
		name: string;
		category: PlaceCategory;
		status: PlaceStatus;
		priority: PlacePriority;
		location: string;
		notes: string;
		imageUrl: string;
		createdAt: number;
	};

	const PAGE_SIZE = 8;
	const REFRESH_DELAY_MS = 450;
	const LOAD_MORE_DELAY_MS = 500;
	const LOAD_MORE_SKELETON_COUNT = 3;
	const MOCK_BASE_TIME = Date.parse('2026-03-01T12:00:00Z');

	const DEFAULT_FILTERS: PlaceFilterState = {
		category: 'all',
		status: 'all',
		priority: 'all',
		location: 'all'
	};
	const DEFAULT_SORT: PlaceSortKey = 'date_desc';

	const categories: PlaceCategory[] = ['restaurant', 'activity', 'experience'];
	const statuses: PlaceStatus[] = ['want', 'planned', 'visited'];
	const priorities: PlacePriority[] = ['low', 'medium', 'high'];
	const locations = [
		'Cape Town',
		'Johannesburg',
		'Pretoria',
		'Durban',
		'Port Elizabeth',
		'Polokwane',
		'Nelspruit',
		'Bloemfontein'
	];
	const nameStarts = [
		'Sunset',
		'River',
		'Urban',
		'Golden',
		'Hidden',
		'Coastal',
		'Forest',
		'Skyline',
		'Harbor',
		'Willow'
	];
	const nameEnds = ['Spot', 'Cafe', 'Trail', 'Market', 'Lounge', 'Corner', 'Kitchen', 'Point'];

	function generateMockPlaces(total: number): MockPlace[] {
		return Array.from({ length: total }, (_, index) => {
			const category = categories[index % categories.length];
			const status = statuses[index % statuses.length];
			const priority = priorities[index % priorities.length];
			const location = locations[index % locations.length];
			const start = nameStarts[index % nameStarts.length];
			const end = nameEnds[(index + 2) % nameEnds.length];

			return {
				id: `mock-place-${index + 1}`,
				name: `${start} ${end}`,
				category,
				status,
				priority,
				location,
				notes: `Placeholder notes for ${start} ${end}.`,
				imageUrl: `https://picsum.photos/seed/place-${index + 1}/640/360`,
				createdAt: MOCK_BASE_TIME - index * 1000 * 60 * 45
			};
		});
	}

	let allPlaces = $state<MockPlace[]>([]);
	let placesLoaded = $state(false);

	let visibleCount = $state(PAGE_SIZE);
	let isRefreshing = $state(false);
	let isLoadingMore = $state(false);
	let activeFilters = $state<PlaceFilterState>({ ...DEFAULT_FILTERS });
	let activeSort = $state<PlaceSortKey>(DEFAULT_SORT);

	function countMatchingFilters(places: MockPlace[], filters: PlaceFilterState): number {
		return places.filter((place) => {
			if (filters.category !== 'all' && place.category !== filters.category) return false;
			if (filters.status !== 'all' && place.status !== filters.status) return false;
			if (filters.priority !== 'all' && place.priority !== filters.priority) return false;
			if (filters.location !== 'all' && place.location !== filters.location) return false;
			return true;
		}).length;
	}

	async function syncPlacesUrl() {
		const params = buildPlacesUrlSearchParams(activeFilters, activeSort, visibleCount, {
			filters: DEFAULT_FILTERS,
			sort: DEFAULT_SORT,
			pageSize: PAGE_SIZE
		});
		const qs = params.toString();
		const nextSearch = qs ? `?${qs}` : '';
		if (nextSearch === page.url.search) return;
		await goto(`${page.url.pathname}${nextSearch}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	$effect(() => {
		const user = authStore.currentUser;
		if (!user) {
			allPlaces = [];
			placesLoaded = false;
			visibleCount = PAGE_SIZE;
			activeFilters = { ...DEFAULT_FILTERS };
			activeSort = DEFAULT_SORT;
			return;
		}
		if (placesLoaded) return;
		allPlaces = generateMockPlaces(36);
		placesLoaded = true;
	});

	$effect(() => {
		if (!placesLoaded || allPlaces.length === 0) return;
		void page.url.search;
		const parsed = parsePlacesUrlParams(page.url.searchParams, {
			categories,
			statuses,
			priorities,
			locations,
			defaultSort: DEFAULT_SORT
		});
		const matchCount = countMatchingFilters(allPlaces, parsed.filters);
		const cap = matchCount === 0 ? PAGE_SIZE : matchCount;
		const requested = Math.max(parsed.show ?? PAGE_SIZE, PAGE_SIZE);
		activeFilters = parsed.filters;
		activeSort = parsed.sort;
		visibleCount = Math.min(requested, cap);
	});

	const hasActiveFilters = $derived(
		activeFilters.category !== 'all' ||
			activeFilters.status !== 'all' ||
			activeFilters.priority !== 'all' ||
			activeFilters.location !== 'all'
	);
	const hasActiveSort = $derived(activeSort !== DEFAULT_SORT);

	const filteredPlaces = $derived.by(() =>
		allPlaces.filter((place) => {
			if (activeFilters.category !== 'all' && place.category !== activeFilters.category) return false;
			if (activeFilters.status !== 'all' && place.status !== activeFilters.status) return false;
			if (activeFilters.priority !== 'all' && place.priority !== activeFilters.priority) return false;
			if (activeFilters.location !== 'all' && place.location !== activeFilters.location) return false;
			return true;
		})
	);

	const sortedPlaces = $derived.by(() => {
		const items = [...filteredPlaces];
		if (activeSort === 'date_asc') {
			return items.sort((a, b) => a.createdAt - b.createdAt);
		}
		if (activeSort === 'name_asc') {
			return items.sort((a, b) => a.name.localeCompare(b.name));
		}
		if (activeSort === 'name_desc') {
			return items.sort((a, b) => b.name.localeCompare(a.name));
		}
		if (activeSort === 'priority_desc') {
			const rank: Record<PlacePriority, number> = { high: 3, medium: 2, low: 1 };
			return items.sort((a, b) => rank[b.priority] - rank[a.priority]);
		}
		return items.sort((a, b) => b.createdAt - a.createdAt);
	});

	const visiblePlaces = $derived(sortedPlaces.slice(0, visibleCount));
	const hasMore = $derived(placesLoaded && visibleCount < sortedPlaces.length);
	const displayedCount = $derived(
		isRefreshing ? Math.min(PAGE_SIZE, sortedPlaces.length) : visiblePlaces.length
	);
	const loadingMoreSkeletonCount = $derived(
		Math.min(LOAD_MORE_SKELETON_COUNT, Math.max(sortedPlaces.length - visibleCount, 0))
	);

	async function refreshPlaces() {
		if (!placesLoaded || isRefreshing || isLoadingMore) return;
		isRefreshing = true;
		await new Promise((resolve) => setTimeout(resolve, REFRESH_DELAY_MS));
		visibleCount = PAGE_SIZE;
		isRefreshing = false;
		await syncPlacesUrl();
	}

	async function getMorePlaces() {
		if (!placesLoaded || isRefreshing || isLoadingMore || !hasMore) return;
		isLoadingMore = true;
		await new Promise((resolve) => setTimeout(resolve, LOAD_MORE_DELAY_MS));
		visibleCount = Math.min(visibleCount + PAGE_SIZE, sortedPlaces.length);
		isLoadingMore = false;
		await syncPlacesUrl();
	}

	function applyFilters(nextFilters: PlaceFilterState) {
		activeFilters = { ...nextFilters };
		visibleCount = PAGE_SIZE;
		void syncPlacesUrl();
	}

	function resetFilters() {
		activeFilters = { ...DEFAULT_FILTERS };
		visibleCount = PAGE_SIZE;
		void syncPlacesUrl();
	}

	function applySort(nextSort: PlaceSortKey) {
		activeSort = nextSort;
		visibleCount = PAGE_SIZE;
		void syncPlacesUrl();
	}

	function resetSort() {
		activeSort = DEFAULT_SORT;
		visibleCount = PAGE_SIZE;
		void syncPlacesUrl();
	}

	function toTitleCase(value: string): string {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}
</script>

<section class="space-y-4">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h2 class="text-2xl font-bold">Places</h2>
		<div class="flex flex-wrap items-center gap-2">
			<PlaceFilterModal
				value={activeFilters}
				categories={categories}
				statuses={statuses}
				priorities={priorities}
				locations={locations}
				active={hasActiveFilters}
				disabled={!placesLoaded || isRefreshing || isLoadingMore}
				onApply={applyFilters}
				onReset={resetFilters}
			/>
			<PlaceSortModal
				value={activeSort}
				active={hasActiveSort}
				disabled={!placesLoaded || isRefreshing || isLoadingMore}
				onApply={applySort}
				onReset={resetSort}
			/>
			<button
				class="btn btn-outline btn-sm"
				type="button"
				onclick={() => void refreshPlaces()}
				disabled={!placesLoaded || isRefreshing || isLoadingMore}
			>
				{#if isRefreshing}
					<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
					Refreshing...
				{:else}
					Refresh
				{/if}
			</button>
		</div>
	</div>

	<p class="text-sm opacity-75">
		{#if !placesLoaded}
			Loading places…
		{:else}
			Showing {displayedCount} of {sortedPlaces.length} places.
		{/if}
	</p>

	{#if !placesLoaded}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each Array.from({ length: 3 }) as _, index (`places-init-skeleton-${index}`)}
				<div class="space-y-2">
					<div class="flex items-center justify-between gap-3 px-0.5">
						<div class="skeleton h-6 w-40"></div>
						<div class="skeleton h-5 w-12"></div>
					</div>
					<article class="overflow-hidden rounded-2xl bg-base-200 shadow-lg ring-1 ring-white/5">
						<div class="aspect-video w-full skeleton"></div>
						<div class="space-y-3 p-4">
							<div class="skeleton h-3 w-28"></div>
							<div class="skeleton h-4 w-48"></div>
							<div class="space-y-2 pt-1">
								<div class="skeleton h-3.5 w-full"></div>
								<div class="skeleton h-3.5 w-11/12"></div>
							</div>
						</div>
					</article>
				</div>
			{/each}
		</div>
	{:else if isRefreshing}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each Array.from({ length: PAGE_SIZE }) as _, index (`refresh-skeleton-${index}`)}
				<div class="space-y-2">
					<div class="flex items-center justify-between gap-3 px-0.5">
						<div class="skeleton h-6 w-40"></div>
						<div class="skeleton h-5 w-12"></div>
					</div>
					<article class="overflow-hidden rounded-2xl bg-base-200 shadow-lg ring-1 ring-white/5">
						<div class="aspect-video w-full skeleton"></div>
						<div class="space-y-3 p-4">
							<div class="skeleton h-3 w-28"></div>
							<div class="skeleton h-4 w-48"></div>
							<div class="space-y-2 pt-1">
								<div class="skeleton h-3.5 w-full"></div>
								<div class="skeleton h-3.5 w-11/12"></div>
							</div>
						</div>
					</article>
				</div>
			{/each}
		</div>
	{:else if visiblePlaces.length === 0}
		<div class="alert">
			<span>
				{#if hasActiveFilters}
					No places match your current filters.
				{:else}
					No places yet. Refresh to load mock data.
				{/if}
			</span>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each visiblePlaces as place (place.id)}
				<div class="space-y-2">
					<div class="flex items-baseline justify-between gap-3 px-0.5">
						<h3 class="text-lg font-semibold leading-tight tracking-tight text-base-content">
							{place.name}
						</h3>
						<span
							class="shrink-0 rounded-full bg-base-200 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-base-content/50"
						>
							{toTitleCase(place.priority)}
						</span>
					</div>
					<article
						class="overflow-hidden rounded-2xl bg-base-200 shadow-lg shadow-black/25 ring-1 ring-white/5"
					>
						<figure class="aspect-video w-full bg-base-300">
							<img src={place.imageUrl} alt="" class="h-full w-full object-cover" loading="lazy" />
						</figure>
						<div class="space-y-3 p-4">
							<p
								class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-secondary"
								aria-label="Location"
							>
								{place.location}
							</p>
							<p class="text-sm font-medium text-base-content/90">
								<span class="text-primary">{toTitleCase(place.category)}</span>
								<span class="mx-1.5 text-base-content/35" aria-hidden="true">·</span>
								<span class="text-base-content/75">{toTitleCase(place.status)}</span>
							</p>
							<p class="border-t border-base-300/80 pt-3 text-sm leading-relaxed text-base-content/55">
								{place.notes}
							</p>
						</div>
					</article>
				</div>
			{/each}
		</div>
		{#if isLoadingMore && loadingMoreSkeletonCount > 0}
			<div class="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3">
				{#each Array.from({ length: loadingMoreSkeletonCount }) as _, index (`more-skeleton-${index}`)}
					<div class="space-y-2">
						<div class="flex items-center justify-between gap-3 px-0.5">
							<div class="skeleton h-6 w-36"></div>
							<div class="skeleton h-5 w-12"></div>
						</div>
						<article class="overflow-hidden rounded-2xl bg-base-200 shadow-lg ring-1 ring-white/5">
							<div class="aspect-video w-full skeleton"></div>
							<div class="space-y-3 p-4">
								<div class="skeleton h-3 w-24"></div>
								<div class="skeleton h-4 w-44"></div>
								<div class="space-y-2 border-t border-base-300/80 pt-3">
									<div class="skeleton h-3.5 w-full"></div>
									<div class="skeleton h-3.5 w-4/5"></div>
								</div>
							</div>
						</article>
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	<div class="pt-2">
		{#if placesLoaded && hasMore}
			<button
				class="btn btn-primary w-full sm:w-auto"
				type="button"
				onclick={() => void getMorePlaces()}
				disabled={isRefreshing || isLoadingMore}
			>
				{#if isLoadingMore}
					<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
					Loading more...
				{:else}
					Get more
				{/if}
			</button>
		{:else if placesLoaded}
			<p class="text-sm opacity-70">You have reached the end of the mock list.</p>
		{/if}
	</div>
</section>
