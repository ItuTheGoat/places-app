<script lang="ts">
	import { PLACE_STATUSES, type PlaceStatus } from '$lib/types/place';
	import { updatePlaceStatus } from '$lib/firebase/firestore';

	type Props = {
		placeId: string;
		status: PlaceStatus;
		disabled?: boolean;
		onUpdated: () => void | Promise<void>;
	};

	let { placeId, status, disabled = false, onUpdated }: Props = $props();

	let saving = $state(false);
	let error = $state<string | null>(null);

	function toTitle(s: string): string {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}

	async function setStatus(next: PlaceStatus) {
		if (next === status || saving || disabled) return;
		saving = true;
		error = null;
		try {
			await updatePlaceStatus(placeId, next);
			await onUpdated();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not update status.';
		} finally {
			saving = false;
		}
	}
</script>

<section class="rounded-2xl border border-base-300/80 bg-base-200/30 p-4">
	<h3 class="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/50">Status</h3>
	<p class="mt-1 text-sm opacity-70">Move from idea to planned to visited.</p>

	<div class="mt-4 flex flex-wrap gap-2">
		{#each PLACE_STATUSES as s (s)}
			<button
				type="button"
				class="btn btn-sm rounded-xl border-0 {status === s
					? 'btn-primary'
					: 'btn-ghost bg-base-100/60'}"
				disabled={saving || disabled}
				onclick={() => void setStatus(s)}
			>
				{toTitle(s)}
			</button>
		{/each}
	</div>

	{#if saving}
		<p class="mt-2 flex items-center gap-2 text-xs opacity-70" role="status">
			<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
			Saving…
		</p>
	{/if}
	{#if error}
		<p class="mt-2 text-sm text-error" role="alert">{error}</p>
	{/if}
</section>
