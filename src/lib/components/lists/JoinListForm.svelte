<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { setMessage, superForm } from 'sveltekit-superforms';
	import type { SuperValidated } from 'sveltekit-superforms';
	import {
		inviteCodeFormZodClient,
		type InviteCodeFormData
	} from '$lib/schemas/listInviteForm';
	import { redeemListInvite } from '$lib/firebase/firestore';
	import { authStore } from '$lib/stores/auth.svelte';
	import {
		canAttemptInviteRedeem,
		recordInviteRedeemFailure,
		recordInviteRedeemSuccess,
		remainingLockoutMs
	} from '$lib/utils/inviteRedeemRateLimit';

	type Props = {
		validated: SuperValidated<InviteCodeFormData>;
	};

	let { validated }: Props = $props();

	function formatLockout(ms: number): string {
		const m = Math.ceil(ms / 60000);
		if (m >= 60 * 24) return `${Math.ceil(m / (60 * 24))} day(s)`;
		if (m >= 60) return `${Math.ceil(m / 60)} hour(s)`;
		return `${m} minute(s)`;
	}

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, message, submitting } = superForm(validated, {
		SPA: true,
		validators: inviteCodeFormZodClient,
		id: 'invite-join-form',
		validationMethod: 'oninput',
		async onUpdate({ form: f }) {
			if (!f.valid) return;
			const uid = authStore.currentUser?.uid;
			const email = authStore.currentUser?.email ?? null;
			if (!uid) {
				setMessage(f, 'You must be signed in to join a list.');
				return;
			}
			if (!canAttemptInviteRedeem()) {
				const ms = remainingLockoutMs();
				setMessage(
					f,
					`Too many invalid attempts. Try again in ${formatLockout(ms)}.`
				);
				return;
			}
			setMessage(f, undefined);
			try {
				await redeemListInvite(f.data.code, { uid, email });
				recordInviteRedeemSuccess();
				await goto(resolve('/'));
			} catch (e) {
				const msg = e instanceof Error ? e.message : 'Could not join list.';
				if (!msg.includes('already a member')) {
					recordInviteRedeemFailure();
				}
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

	<div class="form-control w-full">
		<label class="label" for="invite-code"><span class="label-text">Invite code</span></label>
		<input
			id="invite-code"
			name="code"
			type="text"
			class="input input-bordered w-full font-mono tracking-widest uppercase"
			autocomplete="off"
			maxlength="32"
			placeholder="B3CD7F2K"
			bind:value={$form.code}
			aria-invalid={$errors.code ? 'true' : undefined}
		/>
		{#if $errors.code}<span class="label-text-alt text-error">{$errors.code}</span>{/if}
	</div>

	<div class="flex flex-wrap gap-3">
		<button type="submit" class="btn btn-primary" disabled={$submitting}>
			{#if $submitting}
				<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
			{/if}
			Join list
		</button>
		<a href={resolve('/')} class="btn btn-ghost">Cancel</a>
	</div>
</form>
