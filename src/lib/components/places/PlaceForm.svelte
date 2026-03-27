<script lang="ts">
	import { resolve } from '$app/paths';
	import { setMessage, superForm } from 'sveltekit-superforms';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { placeFormZodClient } from '$lib/schemas/placeForm';

	import {
		MAX_PLACE_IMAGE_BYTES,
		MAX_PLACE_IMAGES,
		type PlaceFormData,
		type PlaceFormSubmitContext,
		type PlaceImageItem
	} from '$lib/schemas/placeForm';

	import PlaceFieldsForm from '$lib/components/places/PlaceFieldsForm.svelte';
	import PlaceImagesStep from '$lib/components/places/PlaceImagesStep.svelte';

	type Props = {
		mode: 'create' | 'edit';
		validated: SuperValidated<PlaceFormData>;
		lists: Array<{ id: string; name: string }>;
		initialImageUrls?: string[];
		initialMainImageUrl?: string;
		submitLabel?: string;
		/** When true, list field is read-only (wizard after creating a list). */
		listFieldLocked?: boolean;
		onSave: (ctx: PlaceFormSubmitContext) => Promise<void>;
	};

	let {
		mode,
		validated,
		lists,
		initialImageUrls = [],
		initialMainImageUrl,
		submitLabel = 'Save place',
		listFieldLocked = false,
		onSave
	}: Props = $props();

	let imageItems = $state<PlaceImageItem[]>([]);
	let mainImageId = $state<string | null>(null);

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, message, submitting } = superForm(validated, {
		SPA: true,
		validators: placeFormZodClient,
		id: 'place-form',
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
				await onSave({
					form: f.data as PlaceFormData,
					items: imgs,
					mainImageId
				});
			} catch (e) {
				const msg = e instanceof Error ? e.message : 'Could not save. Try again.';
				setMessage(f, msg);
			}
		}
	});
</script>

<form method="POST" class="space-y-6" use:enhance>
	{#if $message}
		<div class="alert alert-warning text-sm" role="status">
			{$message}
		</div>
	{/if}

	<PlaceFieldsForm {form} {errors} {lists} {mode} {listFieldLocked} />

	<PlaceImagesStep
		bind:imageItems
		bind:mainImageId
		{mode}
		{initialImageUrls}
		{initialMainImageUrl}
	/>

	<div class="flex flex-wrap gap-3 pt-2">
		<button type="submit" class="btn btn-primary" disabled={$submitting || lists.length === 0}>
			{#if $submitting}
				<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
			{/if}
			{submitLabel}
		</button>
		<a href={resolve('/')} class="btn btn-ghost">Cancel</a>
	</div>
</form>
