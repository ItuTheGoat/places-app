<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authStore } from '$lib/stores/auth.svelte';
	import { getListsForUser, getPlacesForUser } from '$lib/firebase/firestore';
	import PlaceFilterModal from '$lib/components/places/PlaceFilterModal.svelte';
	import PlaceSortModal from '$lib/components/places/PlaceSortModal.svelte';
	import {
		buildPlacesUrlSearchParams,
		parsePlacesUrlParams
	} from '$lib/utils/placesUrlParams';
	import type { PlaceDoc } from '$lib/types/place';
	import type {
		PlaceCategory,
		PlaceFilterState,
		PlacePriority,
		PlaceSortKey,
		PlaceStatus
	} from '$lib/types/place';

	type PlaceFeedItem = {
		id: string;
		name: string;
		category: PlaceCategory;
		status: PlaceStatus;
		priority: PlacePriority;
		location: string;
		notes: string;
		imageUrl: string | null;
		createdAt: number;
	};

	const PAGE_SIZE = 8;
	const LOAD_MORE_DELAY_MS = 500;
	const LOAD_MORE_SKELETON_COUNT = 3;

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

	function mapPlaceToFeedItem(p: PlaceDoc & { id: string }): PlaceFeedItem {
		const main = p.mainImageUrl ?? (p.imageUrls?.length ? p.imageUrls[0] : null);
		return {
			id: p.id,
			name: p.name,
			category: p.category,
			status: p.status,
			priority: p.priority,
			location: p.location?.trim() ?? '',
			notes: p.notes ?? '',
			imageUrl: main ?? null,
			createdAt: p.createdAt.toMillis()
		};
	}

	let allPlaces = $state<PlaceFeedItem[]>([]);
	let placesLoaded = $state(false);
	let placesError = $state<string | null>(null);
	let userLists = $state<Array<{ id: string; name: string; ownerId: string }>>([]);
	let listsLoaded = $state(false);
	let listsError = $state<string | null>(null);

	let visibleCount = $state(PAGE_SIZE);
	let isRefreshing = $state(false);
	let isLoadingMore = $state(false);
	let activeFilters = $state<PlaceFilterState>({ ...DEFAULT_FILTERS });
	let activeSort = $state<PlaceSortKey>(DEFAULT_SORT);

	const locationOptions = $derived.by(() => {
		const set = new Set<string>();
		for (const place of allPlaces) {
			const loc = place.location.trim();
			if (loc) set.add(loc);
		}
		return Array.from(set).sort((a, b) => a.localeCompare(b));
	});

	function countMatchingFilters(places: PlaceFeedItem[], filters: PlaceFilterState): number {
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

	async function loadPlaces() {
		const uid = authStore.currentUser?.uid;
		if (!uid) {
			allPlaces = [];
			placesLoaded = false;
			placesError = null;
			return;
		}
		placesError = null;
		try {
			const raw = await getPlacesForUser(uid);
			allPlaces = raw.map(mapPlaceToFeedItem);
			placesLoaded = true;
		} catch (e) {
			placesError = e instanceof Error ? e.message : 'Could not load places.';
			allPlaces = [];
			placesLoaded = true;
		}
	}

	$effect(() => {
		const user = authStore.currentUser;
		if (!user) {
			allPlaces = [];
			placesLoaded = false;
			placesError = null;
			userLists = [];
			listsLoaded = false;
			listsError = null;
			visibleCount = PAGE_SIZE;
			activeFilters = { ...DEFAULT_FILTERS };
			activeSort = DEFAULT_SORT;
			return;
		}
		void loadPlaces();
	});

	$effect(() => {
		const uid = authStore.currentUser?.uid;
		if (!uid) return;
		let cancelled = false;
		listsLoaded = false;
		listsError = null;
		void (async () => {
			try {
				const loaded = await getListsForUser(uid);
				if (cancelled) return;
				userLists = loaded.map((list) => ({
					id: list.id,
					name: list.name,
					ownerId: list.ownerId
				}));
			} catch (e) {
				if (!cancelled) {
					listsError = e instanceof Error ? e.message : 'Could not load lists.';
				}
			} finally {
				if (!cancelled) listsLoaded = true;
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		if (!placesLoaded) return;
		void page.url.search;
		const parsed = parsePlacesUrlParams(page.url.searchParams, {
			categories,
			statuses,
			priorities,
			locations: locationOptions,
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
		await loadPlaces();
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

<section class="space-y-4 pb-4 md:pb-24">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h2 class="text-2xl font-bold">My Feed</h2>
		<div class="flex flex-wrap items-center gap-2">
			<a href="/lists/new" class="btn btn-ghost btn-sm">
				<i class="fa-solid fa-list-ul mr-2" aria-hidden="true"></i>
				New list
			</a>
			<a href="/lists/join" class="btn btn-ghost btn-sm">
				<i class="fa-solid fa-ticket mr-2" aria-hidden="true"></i>
				Join list
			</a>
			<PlaceFilterModal
				value={activeFilters}
				categories={categories}
				statuses={statuses}
				priorities={priorities}
				locations={locationOptions}
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

	{#if placesError}
		<div class="alert alert-error text-sm" role="alert">{placesError}</div>
	{/if}

	<p class="text-sm opacity-75">
		{#if !placesLoaded}
			Loading places…
		{:else}
			Showing {displayedCount} of {sortedPlaces.length} places.
		{/if}
	</p>

	<div class="rounded-2xl border border-base-300 bg-base-200/40 p-4">
		<div class="mb-3 flex items-center justify-between gap-3">
			<h3 class="text-sm font-semibold">Your shared lists</h3>
			<a href="/lists/new" class="link link-primary text-xs">Create list</a>
		</div>
		{#if listsError}
			<div class="alert alert-error text-sm" role="alert">{listsError}</div>
		{:else if !listsLoaded}
			<div class="flex items-center gap-2 text-sm opacity-80" role="status">
				<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
				Loading lists…
			</div>
		{:else if userLists.length === 0}
			<p class="text-sm opacity-70">No shared lists yet. Create one to organize places.</p>
		{:else}
			<ul class="space-y-2">
				{#each userLists as list (list.id)}
					<li class="flex items-center justify-between gap-3 rounded-xl bg-base-100 px-3 py-2">
						<span class="truncate text-sm font-medium">{list.name}</span>
						{#if list.ownerId === authStore.currentUser?.uid}
							<a class="btn btn-ghost btn-xs" href={`/lists/${list.id}/edit`}>Edit</a>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>

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
	{:else if sortedPlaces.length === 0}
		{#if hasActiveFilters}
			<div class="alert">
				<span>No places match your current filters.</span>
			</div>
		{:else}
			<div
				class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-base-300 bg-base-200/30 px-6 py-12 text-center"
			>
				<p class="text-base font-medium text-base-content/80">No places yet</p>
				<p class="max-w-sm text-sm opacity-70">
					Add your first place to a shared list and it will show up here.
				</p>
				<a href="/places/new" class="btn btn-primary">
					<i class="fa-solid fa-plus mr-2" aria-hidden="true"></i>
					Create place
				</a>
			</div>
		{/if}
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each visiblePlaces as place (place.id)}
				<div class="group space-y-2">
					<div class="flex items-baseline justify-between gap-3 px-0.5">
						<a
							href={`/places/${place.id}`}
							class="min-w-0 flex-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
						>
							<h3
								class="text-lg font-semibold leading-tight tracking-tight text-base-content underline-offset-2 group-hover:underline"
							>
								{place.name}
							</h3>
						</a>
						<div class="flex shrink-0 items-center gap-1">
							<span
								class="shrink-0 rounded-full bg-base-200 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-base-content/50"
							>
								{toTitleCase(place.priority)}
							</span>
							<a
								href={`/places/${place.id}/edit`}
								class="btn btn-ghost btn-xs opacity-80 hover:opacity-100"
								aria-label="Edit {place.name}"
							>
								Edit
							</a>
						</div>
					</div>
					<a
						href={`/places/${place.id}`}
						class="block overflow-hidden rounded-2xl bg-base-200 shadow-lg shadow-black/25 ring-1 ring-white/5 transition hover:ring-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
					>
					<article class="overflow-hidden">
						<figure class="aspect-video w-full bg-base-300">
							{#if place.imageUrl}
								<img
									src={place.imageUrl}
									alt=""
									class="h-full w-full object-cover"
									loading="lazy"
								/>
							{:else}
								<div
									class="flex h-full min-h-32 w-full items-center justify-center bg-base-300"
									aria-hidden="true"
								>
									<i class="fa-solid fa-image text-4xl opacity-25"></i>
								</div>
							{/if}
						</figure>
						<div class="space-y-3 p-4">
							<p
								class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-secondary"
								aria-label="Location"
							>
								{place.location || '—'}
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
					</a>
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
		{#if placesLoaded && sortedPlaces.length > 0 && hasMore}
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
		{:else if placesLoaded && sortedPlaces.length > 0}
			<p class="text-sm opacity-70">You have reached the end of the list.</p>
		{/if}
	</div>

	<a
		href="/places/new"
		class="btn btn-primary btn-circle fixed bottom-6 right-4 z-40 hidden shadow-lg md:bottom-8 md:right-8 md:inline-flex"
		aria-label="Create new place"
	>
		<i class="fa-solid fa-plus text-lg" aria-hidden="true"></i>
	</a>
</section>
