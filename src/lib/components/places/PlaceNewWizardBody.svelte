<script lang="ts">
	import { goto } from '$app/navigation';
	import { setMessage, superForm } from 'sveltekit-superforms';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { placeFormZodClient } from '$lib/schemas/placeForm';

	import PlaceFieldsForm from '$lib/components/places/PlaceFieldsForm.svelte';
	import PlaceImagesStep from '$lib/components/places/PlaceImagesStep.svelte';
	import { createPlace, updatePlace } from '$lib/firebase/firestore';
	import { uploadPlaceImages } from '$lib/firebase/storage';
	import {
		placeFormToFirestoreFields,
		MAX_PLACE_IMAGE_BYTES,
		MAX_PLACE_IMAGES,
		type PlaceFormData,
		type PlaceImageItem
	} from '$lib/schemas/placeForm';
	import { authStore } from '$lib/stores/auth.svelte';

	type Props = {
		validated: SuperValidated<PlaceFormData>;
		lists: Array<{ id: string; name: string }>;
		listFieldLocked: boolean;
		step: 2 | 3;
		onStepChange: (next: 2 | 3) => void;
	};

	let { validated, lists, listFieldLocked, step, onStepChange }: Props = $props();

	let imageItems = $state<PlaceImageItem[]>([]);
	let mainImageId = $state<string | null>(null);

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, message, submitting, validateForm } = superForm(validated, {
		SPA: true,
		validators: placeFormZodClient,
		id: 'place-new-wizard',
		validationMethod: 'oninput',
		async onUpdate({ form: f }) {
			if (!f.valid) return;
			const imgs = imageItems;
			if (imgs.length === 0) {
				setMessage(f, 'Add at least one image and pick a main image.');
				return;
			}
			if (imgs.length > MAX_PLACE_IMAGES) {
				setMessage(f, `You can add at most ${MAX_PLACE_IMAGES} images.`);
				return;
			}
			for (const item of imgs) {
				if (item.kind === 'new' && item.file.size > MAX_PLACE_IMAGE_BYTES) {
					setMessage(f, 'Each image must be 5 MB or smaller.');
					return;
				}
			}
			if (!mainImageId || !imgs.some((i) => i.id === mainImageId)) {
				setMessage(f, 'Select a main image.');
				return;
			}
			setMessage(f, undefined);
			try {
				await savePlace(f.data as PlaceFormData, imgs, mainImageId);
			} catch (e) {
				const msg = e instanceof Error ? e.message : 'Could not save. Try again.';
				setMessage(f, msg);
			}
		}
	});

	async function savePlace(data: PlaceFormData, imgs: PlaceImageItem[], mainId: string) {
		const uid = authStore.currentUser?.uid;
		if (!uid) throw new Error('You must be signed in.');

		const fields = placeFormToFirestoreFields(data);
		const placeId = await createPlace({
			listId: data.listId,
			...fields,
			createdBy: uid,
			imageUrls: []
		});

		const files = imgs
			.filter((item): item is Extract<typeof item, { kind: 'new' }> => item.kind === 'new')
			.map((item) => item.file);
		const uploaded = await uploadPlaceImages(placeId, files);
		const imageUrls = uploaded.map((u) => u.url);
		const mainIndex = imgs.findIndex((i) => i.id === mainId);
		const mainImageUrl = imageUrls[mainIndex];
		if (!mainImageUrl) throw new Error('Could not resolve main image.');

		await updatePlace(placeId, { imageUrls, mainImageUrl });
		await goto('/');
	}

	async function goToImagesStep() {
		const result = await validateForm({ update: true });
		if (result.valid) onStepChange(3);
	}
</script>

<form method="POST" class="space-y-6" use:enhance>
	{#if $message}
		<div class="alert alert-warning text-sm" role="status">
			{$message}
		</div>
	{/if}

	<div class={step === 2 ? '' : 'hidden'}>
		<PlaceFieldsForm {form} {errors} {lists} mode="create" {listFieldLocked} />
	</div>

	<div class={step === 3 ? '' : 'hidden'}>
		<PlaceImagesStep bind:imageItems bind:mainImageId mode="create" initialImageUrls={[]} />
	</div>

	<div class="flex flex-wrap gap-3 pt-2">
		{#if step === 2}
			<button
				type="button"
				class="btn btn-primary"
				disabled={$submitting || lists.length === 0}
				onclick={() => void goToImagesStep()}
			>
				Continue
			</button>
			<a href="/" class="btn btn-ghost">Cancel</a>
		{:else}
			<button type="button" class="btn btn-ghost" onclick={() => onStepChange(2)}>Back</button>
			<button type="submit" class="btn btn-primary" disabled={$submitting || lists.length === 0}>
				{#if $submitting}
					<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
				{/if}
				Create place
			</button>
			<a href="/" class="btn btn-ghost">Cancel</a>
		{/if}
	</div>
</form>
