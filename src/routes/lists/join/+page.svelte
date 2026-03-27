<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { superValidate } from 'sveltekit-superforms';
	import type { SuperValidated } from 'sveltekit-superforms';
	import {
		defaultInviteCodeFormValues,
		inviteCodeFormZodAdapter,
		type InviteCodeFormData
	} from '$lib/schemas/listInviteForm';
	import { authStore } from '$lib/stores/auth.svelte';
	import JoinListForm from '$lib/components/lists/JoinListForm.svelte';
	import { normalizeInviteCode } from '$lib/utils/inviteCode';

	let validated = $state<SuperValidated<InviteCodeFormData> | null>(null);

	onMount(async () => {
		const pre = page.url.searchParams.get('code') ?? '';
		validated = (await superValidate(inviteCodeFormZodAdapter, {
			defaults: {
				...defaultInviteCodeFormValues(),
				code: normalizeInviteCode(pre)
			},
			id: 'invite-join-form'
		})) as SuperValidated<InviteCodeFormData>;
	});
</script>

<section class="space-y-4 pb-24">
	<div>
		<h2 class="text-2xl font-bold tracking-tight">Join a list</h2>
		<p class="text-sm opacity-70">Enter the 8-character invite code you received.</p>
	</div>

	{#if !authStore.currentUser}
		<div class="alert alert-warning text-sm" role="status">
			Sign in to join a shared list.
			<a href="/auth" class="link link-primary ml-1">Go to sign in</a>
		</div>
	{:else if !validated}
		<div class="flex items-center gap-2 text-sm opacity-80" role="status">
			<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
			Preparing form…
		</div>
	{:else}
		{#key validated}
			<JoinListForm validated={validated} />
		{/key}
	{/if}
</section>
