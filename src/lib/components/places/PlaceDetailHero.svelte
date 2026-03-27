<script lang="ts">
	type Props = {
		name: string;
		imageUrls: string[];
		mainImageUrl?: string;
	};

	let { name, imageUrls, mainImageUrl }: Props = $props();

	const initialHero = $derived.by(() => {
		if (mainImageUrl && imageUrls.includes(mainImageUrl)) return mainImageUrl;
		return imageUrls[0] ?? '';
	});

	let selectedUrl = $state<string | null>(null);

	const displaySrc = $derived(selectedUrl ?? initialHero);
	const thumbUrls = $derived(imageUrls);

	function pick(url: string) {
		selectedUrl = url;
	}
</script>

<div class="overflow-hidden rounded-2xl bg-base-200 ring-1 ring-white/5">
	<figure class="aspect-21/9 w-full bg-base-300 sm:aspect-video">
		{#if displaySrc}
			<img
				src={displaySrc}
				alt={name}
				class="h-full w-full object-cover"
			/>
		{:else}
			<div
				class="flex h-full min-h-48 w-full items-center justify-center"
				aria-hidden="true"
			>
				<i class="fa-solid fa-image text-5xl opacity-25"></i>
			</div>
		{/if}
	</figure>

	{#if thumbUrls.length > 1}
		<div
			class="flex gap-2 overflow-x-auto border-t border-base-300/80 bg-base-200/80 px-3 py-2 [scrollbar-width:thin]"
			role="list"
			aria-label="Place photos"
		>
			{#each thumbUrls as url, i (url)}
				<button
					type="button"
					class="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition {displaySrc ===
					url
						? 'ring-primary'
						: 'ring-transparent hover:ring-base-content/20'}"
					onclick={() => pick(url)}
					aria-label="Show photo {i + 1}"
					aria-pressed={displaySrc === url}
				>
					<img src={url} alt="" class="h-full w-full object-cover" />
				</button>
			{/each}
		</div>
	{/if}
</div>
