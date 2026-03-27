<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import '../app.css';
	import '@fortawesome/fontawesome-free/css/all.min.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authStore } from '$lib/stores/auth.svelte';

	let { children } = $props();

	onMount(() => {
		void authStore.init();
	});

	$effect(() => {
		if (authStore.isLoading || authStore.isAuthenticated) return;
		if (page.url.pathname.startsWith('/auth')) return;

		void goto('/auth?tab=signin', { replaceState: true });
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-base-100 text-base-content flex flex-col">
	<header class="navbar border-b border-base-300 bg-base-200 px-4">
		<div class="w-10" aria-hidden="true"></div>
		<h1 class="flex flex-1 items-center justify-center gap-2 text-center text-lg font-semibold">
			<span>NxtUp</span>
			{#if authStore.isLoading}
				<span class="loading loading-spinner loading-xs" aria-label="Loading auth state"></span>
			{/if}
		</h1>
		<div class="dropdown dropdown-end">
			<button class="btn btn-ghost btn-square" aria-label="Open navigation menu">
				<i class="fa-solid fa-bars text-lg"></i>
			</button>
			<ul class="menu dropdown-content z-1 mt-2 w-44 rounded-box bg-base-100 p-2 shadow">
				{#if authStore.isAuthenticated}
					<li><a href="/">Home</a></li>
					<li><a href="/places">Places</a></li>
					<li><a href="/account">Account</a></li>
					<li>
						<button type="button" onclick={() => void authStore.signOut()}>Sign out</button>
					</li>
				{:else}
					<li><a href="/auth">Sign in</a></li>
					<li><a href="/auth?tab=signup">Sign up</a></li>
				{/if}
			</ul>
		</div>
	</header>

	<main class="flex-1 px-4 py-6">
		<div class="mx-auto w-full max-w-3xl">
			{@render children()}
		</div>
	</main>

	<footer class="border-t border-base-300 bg-base-200 px-4 py-3">
		<p class="text-center text-xs opacity-70">© 2026 NxtUp. All rights reserved.</p>
	</footer>
</div>
