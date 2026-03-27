<script lang="ts">
	import { page } from '$app/state';
	import { authStore } from '$lib/stores/auth.svelte';
	import { getListById, getPlaceById } from '$lib/firebase/firestore';
	import PlaceDetailHero from '$lib/components/places/PlaceDetailHero.svelte';
	import PlaceDetailReadOnly from '$lib/components/places/PlaceDetailReadOnly.svelte';
	import PlaceRatingReview from '$lib/components/places/PlaceRatingReview.svelte';
	import PlaceStatusControl from '$lib/components/places/PlaceStatusControl.svelte';
	import type { PlaceDoc } from '$lib/types/place';

	const placeId = $derived(page.params.placeId ?? '');

	let place = $state<(PlaceDoc & { id: string }) | null>(null);
	let listName = $state<string | null>(null);
	let loadError = $state<string | null>(null);
	let loading = $state(true);

	$effect(() => {
		const id = placeId;
		if (!id) return;
		let cancelled = false;
		loading = true;
		loadError = null;
		place = null;
		listName = null;
		void (async () => {
			try {
				const uid = authStore.currentUser?.uid;
				if (!uid) {
					loadError = 'You must be signed in.';
					return;
				}
				const p = await getPlaceById(id);
				if (cancelled) return;
				if (!p) {
					loadError = 'Place not found.';
					return;
				}
				const list = await getListById(p.listId);
				if (cancelled) return;
				place = p;
				listName = list?.name ?? null;
			} catch (e) {
				if (!cancelled) {
					loadError = e instanceof Error ? e.message : 'Could not load place.';
				}
			} finally {
				if (!cancelled) loading = false;
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	async function refreshPlace() {
		const id = placeId;
		if (!id) return;
		const p = await getPlaceById(id);
		if (p) place = p;
	}
</script>

<section class="space-y-6 pb-24">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<a href="/" class="btn btn-ghost btn-sm gap-2 rounded-xl">
			<i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
			Back
		</a>
		{#if place}
			<a
				href={`/places/${place.id}/edit`}
				class="btn btn-primary btn-sm rounded-xl gap-2"
			>
				<i class="fa-solid fa-pen" aria-hidden="true"></i>
				Edit details
			</a>
		{/if}
	</div>

	{#if loadError}
		<div class="alert alert-error text-sm" role="alert">{loadError}</div>
		<p class="text-sm"><a href="/" class="link link-primary">Back to home</a></p>
	{:else if loading || !place}
		<div class="flex items-center gap-2 text-sm opacity-80" role="status">
			<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
			Loading place…
		</div>
	{:else}
		{#key place.id}
			<div class="space-y-6">
				<PlaceDetailHero
					name={place.name}
					imageUrls={place.imageUrls}
					mainImageUrl={place.mainImageUrl}
				/>

				<PlaceDetailReadOnly
					name={place.name}
					category={place.category}
					status={place.status}
					priority={place.priority}
					vibe={place.vibe}
					location={place.location}
					mapsUrl={place.mapsUrl}
					notes={place.notes}
					listName={listName}
					createdAt={place.createdAt}
					visitedAt={place.visitedAt}
				/>

				<PlaceStatusControl
					placeId={place.id}
					status={place.status}
					onUpdated={refreshPlace}
				/>

				<PlaceRatingReview place={place} onUpdated={refreshPlace} />
			</div>
		{/key}
	{/if}
</section>
