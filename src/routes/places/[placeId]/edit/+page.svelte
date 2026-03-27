<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { superValidate } from 'sveltekit-superforms';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { placeFormZodAdapter } from '$lib/schemas/placeForm';

	import { authStore } from '$lib/stores/auth.svelte';
	import PlaceForm from '$lib/components/places/PlaceForm.svelte';
	import { getListsForUser, getPlaceById, updatePlace } from '$lib/firebase/firestore';
	import { deletePlaceImageByUrl, uploadPlaceImages } from '$lib/firebase/storage';
	import {
		defaultPlaceFormValues,
		placeFormToFirestoreFields,
		type PlaceFormData,
		type PlaceFormSubmitContext
	} from '$lib/schemas/placeForm';
	import type { PlaceDoc } from '$lib/types/place';

	const placeId = $derived(page.params.placeId ?? '');

	let place = $state<(PlaceDoc & { id: string }) | null>(null);
	let loadError = $state<string | null>(null);
	let loading = $state(true);

	let lists = $state<Array<{ id: string; name: string }>>([]);

	let validated = $state<SuperValidated<PlaceFormData> | null>(null);

	$effect(() => {
		const id = placeId;
		if (!id) return;
		let cancelled = false;
		loading = true;
		loadError = null;
		place = null;
		validated = null;
		void (async () => {
			try {
				const uid = authStore.currentUser?.uid;
				if (!uid) {
					loadError = 'You must be signed in.';
					return;
				}
				const [p, userLists] = await Promise.all([
					getPlaceById(id),
					getListsForUser(uid)
				]);
				if (cancelled) return;
				if (!p) {
					loadError = 'Place not found.';
					return;
				}
				lists = userLists.map((l) => ({ id: l.id, name: l.name }));
				place = p;
				validated = (await superValidate(placeFormZodAdapter, {
					defaults: {
						...defaultPlaceFormValues(),
						...buildInitialDefaults(p)
					},
					id: 'place-form'
				})) as SuperValidated<PlaceFormData>;
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

	function buildInitialDefaults(p: PlaceDoc & { id: string }) {
		return {
			listId: p.listId,
			name: p.name,
			category: p.category,
			status: p.status,
			priority: p.priority,
			location: p.location ?? '',
			mapsUrl: p.mapsUrl ?? '',
			vibe: (p.vibe ?? '') as PlaceFormData['vibe'],
			notes: p.notes ?? ''
		};
	}

	async function onSave(ctx: PlaceFormSubmitContext) {
		if (!place) throw new Error('Place not loaded.');
		const previousUrls = [...place.imageUrls];

		const fields = placeFormToFirestoreFields(ctx.form);

		const newItems = ctx.items.filter(
			(i): i is Extract<typeof i, { kind: 'new' }> => i.kind === 'new'
		);
		const uploadResults =
			newItems.length > 0 ? await uploadPlaceImages(place.id, newItems.map((i) => i.file)) : [];
		let uploadIdx = 0;
		const urlById = new Map<string, string>();
		for (const item of ctx.items) {
			if (item.kind === 'existing') {
				urlById.set(item.id, item.url);
			} else {
				urlById.set(item.id, uploadResults[uploadIdx++].url);
			}
		}
		const imageUrls = ctx.items.map((i) => urlById.get(i.id)!);
		const mainImageUrl = urlById.get(ctx.mainImageId);
		if (!mainImageUrl) throw new Error('Could not resolve main image.');

		const removed = previousUrls.filter((u) => !imageUrls.includes(u));
		await Promise.all(removed.map((u) => deletePlaceImageByUrl(u)));

		await updatePlace(place.id, {
			...fields,
			imageUrls,
			mainImageUrl
		});
		await goto(`/places/${place.id}`);
	}
</script>

<section class="space-y-4 pb-24">
	<div>
		<h2 class="text-2xl font-bold tracking-tight">Edit place</h2>
		<p class="text-sm opacity-70">Update details and images.</p>
	</div>

	{#if loadError}
		<div class="alert alert-error text-sm" role="alert">{loadError}</div>
		<p class="text-sm"><a href="/" class="link link-primary">Back to home</a></p>
	{:else if loading || !place || !validated}
		<div class="flex items-center gap-2 text-sm opacity-80" role="status">
			<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
			Loading place…
		</div>
	{:else}
		{#key place.id}
			<PlaceForm
				mode="edit"
				validated={validated}
				{lists}
				initialImageUrls={place.imageUrls}
				initialMainImageUrl={place.mainImageUrl}
				{onSave}
				submitLabel="Update place"
			/>
		{/key}
	{/if}
</section>
