<script lang="ts">
	type Props = {
		listName: string;
		deleting?: boolean;
		onConfirm: () => void | Promise<void>;
	};

	let { listName, deleting = false, onConfirm }: Props = $props();

	let dialogEl = $state<HTMLDialogElement | null>(null);

	export function open() {
		dialogEl?.showModal();
	}

	export function close() {
		dialogEl?.close();
	}

	async function handleConfirm() {
		if (deleting) return;
		await onConfirm();
	}
</script>

<dialog class="modal" bind:this={dialogEl} aria-labelledby="list-delete-title">
	<div class="modal-box bg-base-200">
		<h3 id="list-delete-title" class="text-lg font-semibold text-error">Delete this list?</h3>
		<p class="py-3 text-sm opacity-90">
			<span class="font-medium">{listName}</span> will be removed for everyone. This cannot be undone.
		</p>
		<p class="text-sm opacity-75">
			You can only delete a list after all places in it are moved or deleted.
		</p>
		<div class="modal-action">
			<button type="button" class="btn btn-ghost" onclick={() => dialogEl?.close()}>Cancel</button>
			<button
				type="button"
				class="btn btn-error"
				disabled={deleting}
				onclick={() => void handleConfirm()}
			>
				{#if deleting}
					<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
				{/if}
				Delete list
			</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
