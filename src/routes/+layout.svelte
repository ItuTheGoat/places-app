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
		if (authStore.currentUser === undefined) return;
		if (authStore.currentUser !== null) return;
		if (page.url.pathname.startsWith('/auth')) return;

		void goto('/auth?tab=signin', { replaceState: true });
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if authStore.currentUser === undefined}
	<div
		class="flex min-h-screen flex-col items-center justify-center gap-6 bg-base-100 px-6 text-center"
		role="status"
		aria-busy="true"
		aria-live="polite"
	>
		<div class="flex flex-col items-center gap-3">
			<p class="text-xl font-semibold tracking-tight">NxtUp</p>
			<span class="loading loading-spinner loading-lg text-primary" aria-hidden="true"></span>
			<p class="text-sm opacity-70">Checking your session…</p>
		</div>
	</div>
{:else if authStore.currentUser === null && !page.url.pathname.startsWith('/auth')}
	<div
		class="flex min-h-screen flex-col items-center justify-center gap-6 bg-base-100 px-6 text-center"
		role="status"
		aria-busy="true"
		aria-live="polite"
	>
		<div class="flex flex-col items-center gap-3">
			<p class="text-xl font-semibold tracking-tight">NxtUp</p>
			<span class="loading loading-spinner loading-lg text-primary" aria-hidden="true"></span>
			<p class="text-sm opacity-70">Redirecting to sign in…</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-base-100 text-base-content flex flex-col">
		<header class="navbar bg-base-100 px-4 py-3">
			<div class="w-10" aria-hidden="true"></div>
			<h1 class="flex flex-1 items-center justify-center gap-2 text-center text-lg font-semibold tracking-tight">
				<span>NxtUp</span>
				{#if authStore.isWorking}
					<span class="loading loading-spinner loading-xs" aria-label="Working"></span>
				{/if}
			</h1>
			<div class="dropdown dropdown-end">
				<button class="btn btn-ghost btn-square" aria-label="Open navigation menu">
					<i class="fa-solid fa-bars text-lg"></i>
				</button>
				<ul class="menu dropdown-content z-1 mt-2 w-44 rounded-box bg-base-100 p-2 shadow">
					{#if authStore.isAuthenticated}
						<li><a href="/">Home</a></li>
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

		<main class="flex-1 px-4 pb-6 pt-2">
			<div class="mx-auto w-full max-w-3xl">
				{@render children()}
			</div>
		</main>

		<footer class="bg-base-100 px-4 py-3">
			<p class="text-center text-xs opacity-70">© 2026 NxtUp. All rights reserved.</p>
		</footer>
	</div>
{/if}
