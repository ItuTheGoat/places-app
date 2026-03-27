<script lang="ts">
	import type { PlaceCategory, PlaceFilterState, PlacePriority, PlaceStatus } from '$lib/types/place';

	type Props = {
		value: PlaceFilterState;
		active?: boolean;
		disabled?: boolean;
		categories: PlaceCategory[];
		statuses: PlaceStatus[];
		priorities: PlacePriority[];
		locations: string[];
		onApply?: (filters: PlaceFilterState) => void;
		onReset?: () => void;
	};

	let {
		value,
		active = false,
		disabled = false,
		categories,
		statuses,
		priorities,
		locations,
		onApply = () => {},
		onReset = () => {}
	}: Props = $props();

	let dialogEl = $state<HTMLDialogElement | null>(null);
	let draft = $state<PlaceFilterState>({
		category: 'all',
		status: 'all',
		priority: 'all',
		location: 'all'
	});

	function toTitleCase(value: string): string {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}

	function openModal() {
		draft = { ...value };
		dialogEl?.showModal();
	}

	function closeModal() {
		dialogEl?.close();
	}

	function applyFilters() {
		onApply({ ...draft });
		closeModal();
	}

	function resetFilters() {
		onReset();
		closeModal();
	}
</script>

<button class="btn btn-outline btn-sm gap-2" type="button" onclick={openModal} {disabled}>
	Filter
	{#if active}
		<span class="h-2 w-2 rounded-full bg-primary" aria-hidden="true"></span>
	{/if}
</button>

<dialog class="modal" bind:this={dialogEl}>
	<div class="modal-box space-y-4 bg-base-200">
		<h3 class="text-lg font-semibold">Filter places</h3>

		<label class="form-control w-full">
			<span class="label-text mb-1">Category</span>
			<select class="select select-bordered w-full" bind:value={draft.category}>
				<option value="all">All categories</option>
				{#each categories as category (category)}
					<option value={category}>{toTitleCase(category)}</option>
				{/each}
			</select>
		</label>

		<label class="form-control w-full">
			<span class="label-text mb-1">Status</span>
			<select class="select select-bordered w-full" bind:value={draft.status}>
				<option value="all">All statuses</option>
				{#each statuses as status (status)}
					<option value={status}>{toTitleCase(status)}</option>
				{/each}
			</select>
		</label>

		<label class="form-control w-full">
			<span class="label-text mb-1">Priority</span>
			<select class="select select-bordered w-full" bind:value={draft.priority}>
				<option value="all">All priorities</option>
				{#each priorities as priority (priority)}
					<option value={priority}>{toTitleCase(priority)}</option>
				{/each}
			</select>
		</label>

		<label class="form-control w-full">
			<span class="label-text mb-1">Location</span>
			<select class="select select-bordered w-full" bind:value={draft.location}>
				<option value="all">All locations</option>
				{#each locations as location (location)}
					<option value={location}>{location}</option>
				{/each}
			</select>
		</label>

		<div class="modal-action">
			<button class="btn btn-ghost" type="button" onclick={closeModal}>Cancel</button>
			<button class="btn btn-outline" type="button" onclick={resetFilters}>Reset to all</button>
			<button class="btn btn-primary" type="button" onclick={applyFilters}>Apply</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
