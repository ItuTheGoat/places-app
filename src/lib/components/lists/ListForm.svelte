<script lang="ts">
	import { setMessage, superForm } from 'sveltekit-superforms';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { listFormZodClient } from '$lib/schemas/listForm';
	import type { ListFormData } from '$lib/schemas/listForm';

	type ListFormSubmitContext = {
		form: ListFormData;
	};

	type Props = {
		mode: 'create' | 'edit';
		validated: SuperValidated<ListFormData>;
		submitLabel?: string;
		onSave: (ctx: ListFormSubmitContext) => Promise<void>;
	};

	let { mode, validated, submitLabel = 'Save list', onSave }: Props = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, message, submitting } = superForm(validated, {
		SPA: true,
		validators: listFormZodClient,
		id: 'list-form',
		validationMethod: 'oninput',
		async onUpdate({ form: f }) {
			if (!f.valid) return;
			setMessage(f, undefined);
			try {
				await onSave({ form: f.data as ListFormData });
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

	<div class="form-control w-full">
		<label class="label" for="list-name"><span class="label-text">List name</span></label>
		<input
			id="list-name"
			name="name"
			type="text"
			class="input input-bordered w-full"
			bind:value={$form.name}
			placeholder={mode === 'create' ? 'Weekend plans' : undefined}
			autocomplete="off"
			aria-invalid={$errors.name ? 'true' : undefined}
		/>
		{#if $errors.name}<span class="label-text-alt text-error">{$errors.name}</span>{/if}
	</div>

	<div class="flex flex-wrap gap-3 pt-2">
		<button type="submit" class="btn btn-primary" disabled={$submitting}>
			{#if $submitting}
				<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
			{/if}
			{submitLabel}
		</button>
		<a href="/" class="btn btn-ghost">Cancel</a>
	</div>
</form>
