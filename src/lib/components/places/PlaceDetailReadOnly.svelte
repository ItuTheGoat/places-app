<script lang="ts">
	import type { Timestamp } from 'firebase/firestore';

	import type { PlaceCategory, PlacePriority, PlaceStatus, PlaceVibe } from '$lib/types/place';

	type Props = {
		name: string;
		category: PlaceCategory;
		status: PlaceStatus;
		priority: PlacePriority;
		vibe?: PlaceVibe;
		location?: string;
		mapsUrl?: string;
		notes?: string;
		listName: string | null;
		createdAt: Timestamp;
		visitedAt?: Timestamp;
	};

	let { name, category, status, priority, vibe, location, mapsUrl, notes, listName, createdAt, visitedAt }: Props =
		$props();

	function toTitle(s: string): string {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}

	function formatDate(ts: Timestamp): string {
		return ts.toDate().toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="space-y-6">
	<header class="space-y-2">
		<h2 class="text-2xl font-bold leading-tight tracking-tight text-base-content">{name}</h2>
		<div class="flex flex-wrap gap-2">
			<span class="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
				{toTitle(category)}
			</span>
			<span class="rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary">
				{toTitle(status)}
			</span>
			<span
				class="rounded-full bg-base-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-base-content/70"
			>
				{toTitle(priority)} priority
			</span>
			{#if vibe}
				<span class="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
					{toTitle(vibe)}
				</span>
			{/if}
		</div>
	</header>

	<section class="rounded-2xl border border-base-300/80 bg-base-200/30 p-4">
		<h3 class="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/50">Location</h3>
		{#if location || mapsUrl}
			<p class="mt-2 text-sm font-medium text-base-content/90">{location || '—'}</p>
			{#if mapsUrl}
				<a
					href={mapsUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="btn btn-outline btn-sm mt-3 gap-2 rounded-xl"
				>
					<i class="fa-solid fa-map-location-dot" aria-hidden="true"></i>
					Open in maps
				</a>
			{/if}
		{:else}
			<p class="mt-2 text-sm opacity-60">No location added yet.</p>
		{/if}
	</section>

	<section class="rounded-2xl border border-base-300/80 bg-base-200/30 p-4">
		<h3 class="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/50">Notes</h3>
		{#if notes?.trim()}
			<p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-base-content/80">{notes}</p>
		{:else}
			<p class="mt-2 text-sm opacity-60">No notes yet.</p>
		{/if}
	</section>

	<section class="rounded-2xl border border-base-300/80 bg-base-200/30 p-4">
		<h3 class="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/50">List & dates</h3>
		<dl class="mt-3 space-y-2 text-sm">
			<div class="flex justify-between gap-4">
				<dt class="opacity-60">List</dt>
				<dd class="text-right font-medium">{listName ?? '—'}</dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="opacity-60">Added</dt>
				<dd class="text-right">{formatDate(createdAt)}</dd>
			</div>
			{#if visitedAt}
				<div class="flex justify-between gap-4">
					<dt class="opacity-60">Visited</dt>
					<dd class="text-right">{formatDate(visitedAt)}</dd>
				</div>
			{/if}
		</dl>
	</section>
</div>
