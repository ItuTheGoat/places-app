<script lang="ts">
	import type { PlaceSortKey } from '$lib/types/place';

	type Props = {
		value: PlaceSortKey;
		active?: boolean;
		disabled?: boolean;
		onApply?: (sort: PlaceSortKey) => void;
		onReset?: () => void;
	};

	const DEFAULT_SORT: PlaceSortKey = 'date_desc';

	const sortOptions: { value: PlaceSortKey; label: string }[] = [
		{ value: 'date_desc', label: 'Date added (newest first)' },
		{ value: 'date_asc', label: 'Date added (oldest first)' },
		{ value: 'name_asc', label: 'Name (A-Z)' },
		{ value: 'name_desc', label: 'Name (Z-A)' },
		{ value: 'priority_desc', label: 'Priority (High-Low)' }
	];

	let { value, active = false, disabled = false, onApply = () => {}, onReset = () => {} }: Props = $props();

	let dialogEl = $state<HTMLDialogElement | null>(null);
	let draft = $state<PlaceSortKey>(DEFAULT_SORT);

	function openModal() {
		draft = value;
		dialogEl?.showModal();
	}

	function closeModal() {
		dialogEl?.close();
	}

	function applySort() {
		onApply(draft);
		closeModal();
	}

	function resetSort() {
		onApply(DEFAULT_SORT);
		onReset();
		closeModal();
	}
</script>

<button class="btn btn-outline btn-sm gap-2" type="button" onclick={openModal} {disabled}>
	Sort
	{#if active}
		<span class="h-2 w-2 rounded-full bg-primary" aria-hidden="true"></span>
	{/if}
</button>

<dialog class="modal" bind:this={dialogEl}>
	<div class="modal-box space-y-4 bg-base-200">
		<h3 class="text-lg font-semibold">Sort places</h3>

		<div class="space-y-2">
			{#each sortOptions as option (option.value)}
				<label class="label cursor-pointer justify-start gap-3 rounded-lg border border-base-300 px-3 py-2">
					<input class="radio radio-primary" type="radio" name="place-sort" value={option.value} bind:group={draft} />
					<span class="label-text">{option.label}</span>
				</label>
			{/each}
		</div>

		<div class="modal-action">
			<button class="btn btn-ghost" type="button" onclick={closeModal}>Cancel</button>
			<button class="btn btn-outline" type="button" onclick={resetSort}>Reset default</button>
			<button class="btn btn-primary" type="button" onclick={applySort}>Apply</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
