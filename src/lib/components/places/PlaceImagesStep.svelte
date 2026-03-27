<script lang="ts">
	import { onDestroy } from 'svelte';
	import {
		MAX_PLACE_IMAGE_BYTES,
		MAX_PLACE_IMAGES,
		type PlaceImageItem
	} from '$lib/schemas/placeForm';

	type Props = {
		mode: 'create' | 'edit';
		initialImageUrls?: string[];
		initialMainImageUrl?: string;
		imageItems: PlaceImageItem[];
		mainImageId: string | null;
	};

	let {
		mode,
		initialImageUrls = [],
		initialMainImageUrl,
		imageItems = $bindable([]),
		mainImageId = $bindable(null)
	}: Props = $props();

	let previewUrlById = $state<Record<string, string>>({});

	function revokePreview(id: string) {
		const url = previewUrlById[id];
		if (url) {
			URL.revokeObjectURL(url);
			const { [id]: _removed, ...rest } = previewUrlById;
			previewUrlById = rest;
		}
	}

	function previewUrlFor(item: PlaceImageItem): string {
		if (item.kind === 'existing') return item.url;
		return previewUrlById[item.id] ?? '';
	}

	onDestroy(() => {
		for (const url of Object.values(previewUrlById)) {
			URL.revokeObjectURL(url);
		}
	});

	$effect(() => {
		if (mode !== 'edit') return;
		if (initialImageUrls.length === 0) return;
		imageItems = initialImageUrls.map((url) => ({
			id: crypto.randomUUID(),
			kind: 'existing' as const,
			url
		}));
		const main = initialMainImageUrl ?? initialImageUrls[0];
		const found = imageItems.find((i) => i.kind === 'existing' && i.url === main);
		mainImageId = found?.id ?? imageItems[0]?.id ?? null;
	});

	function onFilesSelected(ev: Event) {
		const input = ev.currentTarget as HTMLInputElement;
		const fileList = input.files;
		if (!fileList?.length) return;

		const next = [...imageItems];
		let nextPreview = { ...previewUrlById };
		for (const file of Array.from(fileList)) {
			if (next.length >= MAX_PLACE_IMAGES) break;
			if (!file.type.startsWith('image/')) continue;
			if (file.size > MAX_PLACE_IMAGE_BYTES) continue;
			const id = crypto.randomUUID();
			next.push({ id, kind: 'new', file });
			nextPreview[id] = URL.createObjectURL(file);
		}
		imageItems = next;
		previewUrlById = nextPreview;
		if (!mainImageId && imageItems.length > 0) {
			mainImageId = imageItems[0].id;
		}
		input.value = '';
	}

	function removeImage(id: string) {
		const item = imageItems.find((i) => i.id === id);
		if (item?.kind === 'new') revokePreview(id);
		imageItems = imageItems.filter((i) => i.id !== id);
		if (mainImageId === id) {
			mainImageId = imageItems[0]?.id ?? null;
		}
	}
</script>

<div class="rounded-2xl border border-base-300 bg-base-200/40 p-4">
	<h3 class="mb-1 text-sm font-semibold">Images</h3>
	<p class="mb-3 text-xs opacity-70">
		Up to {MAX_PLACE_IMAGES} images, max 5 MB each. Pick one as the main image.
	</p>

	<label class="btn btn-outline btn-sm mb-4 w-full sm:w-auto">
		<i class="fa-solid fa-image mr-2" aria-hidden="true"></i>
		Add images
		<input
			type="file"
			class="hidden"
			accept="image/*"
			multiple
			onchange={onFilesSelected}
			disabled={imageItems.length >= MAX_PLACE_IMAGES}
		/>
	</label>

	{#if imageItems.length === 0}
		<p class="text-sm opacity-70">No images yet.</p>
	{:else}
		<ul class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			{#each imageItems as item (item.id)}
				<li class="flex gap-3 rounded-xl border border-base-300 bg-base-100 p-2">
					<img
						src={previewUrlFor(item)}
						alt=""
						class="h-20 w-28 shrink-0 rounded-lg object-cover"
					/>
					<div class="flex min-w-0 flex-1 flex-col justify-between gap-2">
						<label class="flex cursor-pointer items-center gap-2 text-sm">
							<input
								type="radio"
								name="mainImage"
								class="radio radio-primary radio-sm"
								checked={mainImageId === item.id}
								onchange={() => (mainImageId = item.id)}
							/>
							<span>Main</span>
						</label>
						<button
							type="button"
							class="btn btn-ghost btn-xs self-start text-error"
							onclick={() => removeImage(item.id)}
						>
							Remove
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
