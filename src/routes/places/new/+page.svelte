<script lang="ts">
	import { onMount } from 'svelte';
	import { superValidate } from 'sveltekit-superforms';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { placeFormZodAdapter } from '$lib/schemas/placeForm';
	import {
		defaultListFormValues,
		listFormToFirestoreFields,
		listFormZodAdapter,
		type ListFormData
	} from '$lib/schemas/listForm';

	import { authStore } from '$lib/stores/auth.svelte';
	import ListForm from '$lib/components/lists/ListForm.svelte';
	import PlaceNewWizardBody from '$lib/components/places/PlaceNewWizardBody.svelte';
	import { createList, getListsForUser } from '$lib/firebase/firestore';
	import { defaultPlaceFormValues, type PlaceFormData } from '$lib/schemas/placeForm';

	let lists = $state<Array<{ id: string; name: string }>>([]);
	let listsError = $state<string | null>(null);
	let listsLoaded = $state(false);

	let listValidated = $state<SuperValidated<ListFormData> | null>(null);
	let placeValidated = $state<SuperValidated<PlaceFormData> | null>(null);

	let wizardInitialized = $state(false);
	let step = $state<1 | 2 | 3>(2);
	let listFieldLocked = $state(false);

	onMount(async () => {
		[listValidated, placeValidated] = await Promise.all([
			superValidate(listFormZodAdapter, {
				defaults: defaultListFormValues(),
				id: 'list-form'
			}) as Promise<SuperValidated<ListFormData>>,
			superValidate(placeFormZodAdapter, {
				defaults: defaultPlaceFormValues(),
				id: 'place-new-wizard'
			}) as Promise<SuperValidated<PlaceFormData>>
		]);
	});

	$effect(() => {
		const uid = authStore.currentUser?.uid;
		if (!uid) return;
		let cancelled = false;
		void (async () => {
			listsError = null;
			try {
				const raw = await getListsForUser(uid);
				if (cancelled) return;
				lists = raw.map((l) => ({ id: l.id, name: l.name }));
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
		if (!listsLoaded || wizardInitialized) return;
		wizardInitialized = true;
		step = lists.length === 0 ? 1 : 2;
	});

	async function onListCreated(ctx: { form: ListFormData }) {
		const uid = authStore.currentUser?.uid;
		if (!uid) throw new Error('You must be signed in.');

		const fields = listFormToFirestoreFields(ctx.form);
		const listId = await createList({
			name: fields.name,
			ownerId: uid,
			memberIds: [uid]
		});

		const reloaded = await getListsForUser(uid);
		lists = reloaded.map((l) => ({ id: l.id, name: l.name }));

		listFieldLocked = true;
		step = 2;
		placeValidated = (await superValidate(placeFormZodAdapter, {
			defaults: {
				...defaultPlaceFormValues(),
				listId
			},
			id: 'place-new-wizard'
		})) as SuperValidated<PlaceFormData>;
	}

	function onWizardStepChange(next: 2 | 3) {
		step = next;
	}
</script>

<section class="space-y-4 pb-24">
	<div>
		<h2 class="text-2xl font-bold tracking-tight">New place</h2>
		<p class="text-sm opacity-70">
			{#if step === 1}
				Step 1 of 3 — create a list to hold your places.
			{:else if listFieldLocked}
				{#if step === 2}
					Step 2 of 3 — place details.
				{:else}
					Step 3 of 3 — add images.
				{/if}
			{:else if step === 2}
				Step 1 of 2 — place details.
			{:else}
				Step 2 of 2 — add images.
			{/if}
		</p>
	</div>

	{#if listsError}
		<div class="alert alert-error text-sm" role="alert">{listsError}</div>
	{:else if !listsLoaded || !listValidated || !placeValidated}
		<div class="flex items-center gap-2 text-sm opacity-80" role="status">
			<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
			Loading…
		</div>
	{:else if lists.length === 0 && step === 1}
		<ListForm mode="create" validated={listValidated} onSave={onListCreated} submitLabel="Continue" />
	{:else if placeValidated && step >= 2}
		{#key placeValidated}
			<PlaceNewWizardBody
				validated={placeValidated}
				{lists}
				listFieldLocked={listFieldLocked && lists.length > 0}
				step={step as 2 | 3}
				onStepChange={onWizardStepChange}
			/>
		{/key}
	{/if}
</section>
