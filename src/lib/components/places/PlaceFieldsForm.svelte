<script lang="ts">
	import type { SuperFormData, SuperFormErrors } from 'sveltekit-superforms/client';
	import {
		PLACE_CATEGORIES,
		PLACE_PRIORITIES,
		PLACE_STATUSES,
		PLACE_VIBES,
		type PlaceVibe
	} from '$lib/types/place';
	import type { PlaceFormData } from '$lib/schemas/placeForm';

	type Props = {
		form: SuperFormData<PlaceFormData>;
		errors: SuperFormErrors<PlaceFormData>;
		lists: Array<{ id: string; name: string }>;
		mode: 'create' | 'edit';
		/** When true, list is fixed (e.g. just created in wizard). */
		listFieldLocked?: boolean;
	};

	let { form, errors, lists, mode, listFieldLocked = false }: Props = $props();

	function toTitle(s: string): string {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}

	const vibeOptions: { value: '' | PlaceVibe; label: string }[] = [
		{ value: '', label: 'None' },
		...PLACE_VIBES.map((v) => ({ value: v, label: toTitle(v) }))
	];

	const lockedListName = $derived(
		listFieldLocked && $form.listId
			? (lists.find((l) => l.id === $form.listId)?.name ?? 'List')
			: ''
	);
</script>

<div class="form-control w-full">
	<label class="label" for="place-list"><span class="label-text">List</span></label>
	{#if listFieldLocked}
		<input type="hidden" name="listId" bind:value={$form.listId} />
		<p id="place-list" class="rounded-lg border border-base-300 bg-base-200/50 px-3 py-2 text-sm">
			{lockedListName}
		</p>
	{:else}
		<select
			id="place-list"
			name="listId"
			class="select select-bordered w-full"
			bind:value={$form.listId}
			disabled={lists.length === 0 || mode === 'edit'}
			aria-invalid={$errors.listId ? 'true' : undefined}
		>
			<option value="">Select a list</option>
			{#each lists as list (list.id)}
				<option value={list.id}>{list.name}</option>
			{/each}
		</select>
	{/if}
	{#if $errors.listId}<span class="label-text-alt text-error">{$errors.listId}</span>{/if}
	{#if !listFieldLocked}
		{#if lists.length === 0}
			<span class="label-text-alt text-warning">You need a shared list before adding places.</span>
		{:else if mode === 'edit'}
			<span class="label-text-alt opacity-70">List cannot be changed here.</span>
		{/if}
	{/if}
</div>

<div class="form-control w-full">
	<label class="label" for="place-name"><span class="label-text">Name</span></label>
	<input
		id="place-name"
		name="name"
		type="text"
		class="input input-bordered w-full"
		bind:value={$form.name}
		autocomplete="off"
		aria-invalid={$errors.name ? 'true' : undefined}
	/>
	{#if $errors.name}<span class="label-text-alt text-error">{$errors.name}</span>{/if}
</div>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
	<div class="form-control w-full">
		<label class="label" for="place-category"><span class="label-text">Category</span></label>
		<select
			id="place-category"
			name="category"
			class="select select-bordered w-full"
			bind:value={$form.category}
			aria-invalid={$errors.category ? 'true' : undefined}
		>
			{#each PLACE_CATEGORIES as c (c)}
				<option value={c}>{toTitle(c)}</option>
			{/each}
		</select>
		{#if $errors.category}<span class="label-text-alt text-error">{$errors.category}</span>{/if}
	</div>

	<div class="form-control w-full">
		<label class="label" for="place-status"><span class="label-text">Status</span></label>
		<select
			id="place-status"
			name="status"
			class="select select-bordered w-full"
			bind:value={$form.status}
			aria-invalid={$errors.status ? 'true' : undefined}
		>
			{#each PLACE_STATUSES as s (s)}
				<option value={s}>{toTitle(s)}</option>
			{/each}
		</select>
		{#if $errors.status}<span class="label-text-alt text-error">{$errors.status}</span>{/if}
	</div>

	<div class="form-control w-full">
		<label class="label" for="place-priority"><span class="label-text">Priority</span></label>
		<select
			id="place-priority"
			name="priority"
			class="select select-bordered w-full"
			bind:value={$form.priority}
			aria-invalid={$errors.priority ? 'true' : undefined}
		>
			{#each PLACE_PRIORITIES as p (p)}
				<option value={p}>{toTitle(p)}</option>
			{/each}
		</select>
		{#if $errors.priority}<span class="label-text-alt text-error">{$errors.priority}</span>{/if}
	</div>

	<div class="form-control w-full">
		<label class="label" for="place-vibe"><span class="label-text">Vibe</span></label>
		<select
			id="place-vibe"
			name="vibe"
			class="select select-bordered w-full"
			bind:value={$form.vibe}
			aria-invalid={$errors.vibe ? 'true' : undefined}
		>
			{#each vibeOptions as opt (opt.value === '' ? 'none' : opt.value)}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
		{#if $errors.vibe}<span class="label-text-alt text-error">{$errors.vibe}</span>{/if}
	</div>
</div>

<div class="form-control w-full">
	<label class="label" for="place-location"><span class="label-text">Location</span></label>
	<input
		id="place-location"
		name="location"
		type="text"
		class="input input-bordered w-full"
		bind:value={$form.location}
		placeholder="City or area (optional)"
		autocomplete="off"
		aria-invalid={$errors.location ? 'true' : undefined}
	/>
	{#if $errors.location}<span class="label-text-alt text-error">{$errors.location}</span>{/if}
</div>

<div class="form-control w-full">
	<label class="label" for="place-maps"><span class="label-text">Maps URL</span></label>
	<input
		id="place-maps"
		name="mapsUrl"
		type="url"
		class="input input-bordered w-full"
		bind:value={$form.mapsUrl}
		placeholder="https://…"
		aria-invalid={$errors.mapsUrl ? 'true' : undefined}
	/>
	{#if $errors.mapsUrl}<span class="label-text-alt text-error">{$errors.mapsUrl}</span>{/if}
</div>

<div class="form-control w-full">
	<label class="label" for="place-notes"><span class="label-text">Notes</span></label>
	<textarea
		id="place-notes"
		name="notes"
		class="textarea textarea-bordered min-h-24 w-full"
		bind:value={$form.notes}
		aria-invalid={$errors.notes ? 'true' : undefined}
	></textarea>
	{#if $errors.notes}<span class="label-text-alt text-error">{$errors.notes}</span>{/if}
</div>
