<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { superValidate } from 'sveltekit-superforms';
	import type { SuperValidated } from 'sveltekit-superforms';
	import {
		defaultListFormValues,
		listFormToFirestoreFields,
		listFormZodAdapter,
		type ListFormData
	} from '$lib/schemas/listForm';

	import ListForm from '$lib/components/lists/ListForm.svelte';
	import { createList } from '$lib/firebase/firestore';
	import { authStore } from '$lib/stores/auth.svelte';

	let validated = $state<SuperValidated<ListFormData> | null>(null);

	onMount(async () => {
		validated = (await superValidate(listFormZodAdapter, {
			defaults: defaultListFormValues(),
			id: 'list-form'
		})) as SuperValidated<ListFormData>;
	});

	async function onSave(ctx: { form: ListFormData }) {
		const uid = authStore.currentUser?.uid;
		if (!uid) throw new Error('You must be signed in.');

		const fields = listFormToFirestoreFields(ctx.form);
		await createList({
			name: fields.name,
			ownerId: uid,
			memberIds: [uid]
		});

		await goto('/');
	}
</script>

<section class="space-y-4 pb-24">
	<div>
		<h2 class="text-2xl font-bold tracking-tight">New list</h2>
		<p class="text-sm opacity-70">Create a shared list for places.</p>
	</div>

	{#if !validated}
		<div class="flex items-center gap-2 text-sm opacity-80" role="status">
			<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
			Preparing form…
		</div>
	{:else}
		<ListForm mode="create" {validated} {onSave} submitLabel="Create list" />
	{/if}
</section>
