<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { superValidate } from 'sveltekit-superforms';
	import type { SuperValidated } from 'sveltekit-superforms';
	import {
		defaultListFormValues,
		listFormToFirestoreFields,
		listFormZodAdapter,
		type ListFormData
	} from '$lib/schemas/listForm';
	import type { ListDoc } from '$lib/types/list';

	import ListForm from '$lib/components/lists/ListForm.svelte';
	import ListDeleteConfirmModal from '$lib/components/lists/ListDeleteConfirmModal.svelte';
	import {
		createListInvite,
		deleteList,
		getActiveInviteCodeForList,
		getListById,
		getPlacesByListId,
		revokeListInviteCode,
		updateListName
	} from '$lib/firebase/firestore';
	import { authStore } from '$lib/stores/auth.svelte';

	const listId = $derived(page.params.listId ?? '');

	let list = $state<(ListDoc & { id: string }) | null>(null);
	let validated = $state<SuperValidated<ListFormData> | null>(null);
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let deleteError = $state<string | null>(null);
	let deleting = $state(false);

	let activeInviteCode = $state<string | null>(null);
	let inviteLoading = $state(false);
	let inviteError = $state<string | null>(null);
	let copyDone = $state(false);

	let deleteModal = $state<{ open: () => void; close: () => void } | null>(null);

	$effect(() => {
		const id = listId;
		if (!id) return;
		let cancelled = false;
		loading = true;
		loadError = null;
		deleteError = null;
		list = null;
		validated = null;

		void (async () => {
			try {
				const uid = authStore.currentUser?.uid;
				if (!uid) {
					loadError = 'You must be signed in.';
					return;
				}

				const found = await getListById(id);
				if (cancelled) return;
				if (!found) {
					loadError = 'List not found.';
					return;
				}
				if (found.ownerId !== uid) {
					loadError = 'Only the list owner can edit this list.';
					return;
				}

				list = found;
				activeInviteCode = await getActiveInviteCodeForList(found.id);
				validated = (await superValidate(listFormZodAdapter, {
					defaults: {
						...defaultListFormValues(),
						name: found.name
					},
					id: 'list-form'
				})) as SuperValidated<ListFormData>;
			} catch (e) {
				if (!cancelled) {
					loadError = e instanceof Error ? e.message : 'Could not load list.';
				}
			} finally {
				if (!cancelled) loading = false;
			}
		})();

		return () => {
			cancelled = true;
		};
	});

	async function onSave(ctx: { form: ListFormData }) {
		if (!list) throw new Error('List not loaded.');
		const uid = authStore.currentUser?.uid;
		if (!uid) throw new Error('You must be signed in.');
		if (uid !== list.ownerId) throw new Error('Only the list owner can rename this list.');

		const fields = listFormToFirestoreFields(ctx.form);
		await updateListName(list.id, fields.name);
		await goto('/');
	}

	async function generateInvite() {
		if (!list) return;
		const uid = authStore.currentUser?.uid;
		if (!uid || uid !== list.ownerId) return;
		inviteLoading = true;
		inviteError = null;
		copyDone = false;
		try {
			const code = await createListInvite(list.id, uid);
			activeInviteCode = code;
		} catch (e) {
			inviteError = e instanceof Error ? e.message : 'Could not create invite code.';
		} finally {
			inviteLoading = false;
		}
	}

	async function regenerateInvite() {
		if (!list || inviteLoading) return;
		if (activeInviteCode) {
			inviteLoading = true;
			inviteError = null;
			try {
				await revokeListInviteCode(activeInviteCode);
				activeInviteCode = null;
			} catch (e) {
				inviteError = e instanceof Error ? e.message : 'Could not revoke invite.';
				inviteLoading = false;
				return;
			}
			inviteLoading = false;
		}
		await generateInvite();
	}

	async function copyInviteCode() {
		if (!activeInviteCode) return;
		try {
			await navigator.clipboard.writeText(activeInviteCode);
			copyDone = true;
			setTimeout(() => {
				copyDone = false;
			}, 2000);
		} catch {
			inviteError = 'Could not copy to clipboard.';
		}
	}

	async function performDeleteList() {
		if (!list || deleting) return;
		const uid = authStore.currentUser?.uid;
		if (!uid) {
			deleteError = 'You must be signed in.';
			deleteModal?.close();
			return;
		}
		if (uid !== list.ownerId) {
			deleteError = 'Only the list owner can delete this list.';
			deleteModal?.close();
			return;
		}

		deleting = true;
		deleteError = null;
		try {
			const places = await getPlacesByListId(list.id);
			if (places.length > 0) {
				throw new Error('Move or delete places in this list before deleting it.');
			}
			await deleteList(list.id);
			deleteModal?.close();
			await goto('/');
		} catch (e) {
			deleteError = e instanceof Error ? e.message : 'Could not delete list.';
			deleteModal?.close();
		} finally {
			deleting = false;
		}
	}
</script>

<section class="space-y-4 pb-24">
	<div>
		<h2 class="text-2xl font-bold tracking-tight">Edit list</h2>
		<p class="text-sm opacity-70">Rename or remove this shared list.</p>
	</div>

	{#if loadError}
		<div class="alert alert-error text-sm" role="alert">{loadError}</div>
		<p class="text-sm"><a href={resolve('/')} class="link link-primary">Back to home</a></p>
	{:else if loading || !list || !validated}
		<div class="flex items-center gap-2 text-sm opacity-80" role="status">
			<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
			Loading list…
		</div>
	{:else}
		{#key list.id}
			<ListForm mode="edit" validated={validated} {onSave} submitLabel="Update list" />
		{/key}

		<div class="rounded-2xl border border-base-300 bg-base-200/40 p-4">
			<h3 class="text-sm font-semibold">Invite others</h3>
			<p class="mt-1 text-sm opacity-80">
				Generate an 8-character code. Share it once; it stops working after someone uses it.
			</p>
			{#if inviteError}
				<div class="alert alert-error mt-3 text-sm" role="alert">{inviteError}</div>
			{/if}
			{#if activeInviteCode}
				<div class="mt-4 flex flex-wrap items-center gap-3">
					<code class="rounded-lg bg-base-100 px-3 py-2 font-mono text-lg tracking-widest">{activeInviteCode}</code>
					<button
						type="button"
						class="btn btn-outline btn-sm"
						onclick={() => void copyInviteCode()}
					>
						{#if copyDone}
							Copied
						{:else}
							Copy code
						{/if}
					</button>
					<button
						type="button"
						class="btn btn-ghost btn-sm"
						disabled={inviteLoading}
						onclick={() => void regenerateInvite()}
					>
						New code
					</button>
				</div>
			{:else}
				<div class="mt-4">
					<button
						type="button"
						class="btn btn-primary btn-sm"
						disabled={inviteLoading}
						onclick={() => void generateInvite()}
					>
						{#if inviteLoading}
							<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
						{/if}
						Generate invite code
					</button>
				</div>
			{/if}
		</div>

		<div class="rounded-2xl border border-error/30 bg-error/10 p-4">
			<h3 class="text-sm font-semibold text-error">Danger zone</h3>
			<p class="mt-1 text-sm opacity-80">
				Delete this list only after moving or deleting all places inside it.
			</p>
			{#if deleteError}
				<div class="alert alert-error mt-3 text-sm" role="alert">{deleteError}</div>
			{/if}
			<div class="mt-4">
				<button
					type="button"
					class="btn btn-error btn-outline"
					onclick={() => deleteModal?.open()}
					disabled={deleting}
				>
					{#if deleting}
						<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
					{/if}
					Delete list
				</button>
			</div>
		</div>

		<ListDeleteConfirmModal
			bind:this={deleteModal}
			listName={list.name}
			{deleting}
			onConfirm={performDeleteList}
		/>
	{/if}
</section>
