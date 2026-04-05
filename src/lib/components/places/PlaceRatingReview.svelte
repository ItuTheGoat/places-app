<script lang="ts">
	import type { PlaceDoc } from '$lib/types/place';
	import { updatePlaceRatingReview } from '$lib/firebase/firestore';
	import { placeRatingReviewSchema } from '$lib/schemas/placeRatingReview';

	type Props = {
		place: PlaceDoc & { id: string };
		disabled?: boolean;
		onUpdated: () => void | Promise<void>;
	};

	let { place, disabled = false, onUpdated }: Props = $props();

	let rating = $state<number | null>(null);
	let review = $state('');
	let wouldReturnChecked = $state(false);
	let saving = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		rating = place.rating ?? null;
		review = place.review ?? '';
		wouldReturnChecked = place.wouldReturn === true;
	});

	async function save() {
		if (saving || disabled) return;
		saving = true;
		error = null;
		const parsed = placeRatingReviewSchema.safeParse({
			rating,
			review,
			wouldReturn: wouldReturnChecked ? true : null
		});
		if (!parsed.success) {
			error = parsed.error.issues[0]?.message ?? 'Check your rating and review, then try again.';
			saving = false;
			return;
		}
		try {
			await updatePlaceRatingReview(place.id, {
				rating: parsed.data.rating,
				review: parsed.data.review,
				wouldReturn: parsed.data.wouldReturn
			});
			await onUpdated();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not save.';
		} finally {
			saving = false;
		}
	}

	async function clearAll() {
		if (saving || disabled) return;
		rating = null;
		review = '';
		wouldReturnChecked = false;
		saving = true;
		error = null;
		try {
			await updatePlaceRatingReview(place.id, {
				rating: null,
				review: '',
				wouldReturn: null
			});
			await onUpdated();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not clear.';
		} finally {
			saving = false;
		}
	}

	function setStar(value: number) {
		if (disabled || saving) return;
		rating = rating === value ? null : value;
	}
</script>

<section class="rounded-2xl border border-base-300/80 bg-base-200/30 p-4">
	<h3 class="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/50">Rating & review</h3>
	<p class="mt-1 text-sm opacity-70">
		One rating and note per place for the whole list. After you visit, add a star rating and a short review.
	</p>

	<div class="mt-4">
		<p class="mb-2 text-sm font-medium">Rating</p>
		<div class="flex flex-wrap items-center gap-1">
			{#each [1, 2, 3, 4, 5] as star (star)}
				<button
					type="button"
					class="btn btn-ghost btn-sm px-2 text-lg text-amber-400 {rating !== null && star <= rating
						? 'opacity-100'
						: 'opacity-35'}"
					aria-label="{star} star{star === 1 ? '' : 's'}"
					aria-pressed={rating !== null && star <= rating}
					disabled={saving || disabled}
					onclick={() => setStar(star)}
				>
					<i class="fa-solid fa-star" aria-hidden="true"></i>
				</button>
			{/each}
			{#if rating !== null}
				<span class="ml-2 text-sm opacity-80">{rating} / 5</span>
			{/if}
		</div>
	</div>

	<div class="form-control mt-4 w-full">
		<label class="label py-1" for="place-review-{place.id}">
			<span class="label-text text-sm">Review</span>
		</label>
		<textarea
			id="place-review-{place.id}"
			class="textarea textarea-bordered min-h-24 w-full rounded-xl text-sm"
			placeholder="What stood out?"
			bind:value={review}
			disabled={saving || disabled}
			maxlength={5000}
		></textarea>
	</div>

	<div class="form-control mt-3">
		<label class="label cursor-pointer justify-start gap-3 py-1">
			<input
				type="checkbox"
				class="checkbox checkbox-sm checkbox-primary rounded"
				bind:checked={wouldReturnChecked}
				disabled={saving || disabled}
			/>
			<span class="label-text text-sm">Would return</span>
		</label>
	</div>

	<div class="mt-4 flex flex-wrap gap-2">
		<button
			type="button"
			class="btn btn-primary btn-sm rounded-xl"
			disabled={saving || disabled}
			onclick={() => void save()}
		>
			{#if saving}
				<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
			{/if}
			Save review
		</button>
		<button
			type="button"
			class="btn btn-ghost btn-sm rounded-xl"
			disabled={saving || disabled}
			onclick={() => void clearAll()}
		>
			Clear
		</button>
	</div>

	{#if error}
		<p class="mt-2 text-sm text-error" role="alert">{error}</p>
	{/if}
</section>
