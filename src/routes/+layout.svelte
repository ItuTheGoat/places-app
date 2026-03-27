<script lang="ts">
	import '../app.css';
	import '@fortawesome/fontawesome-free/css/all.min.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-base-100 text-base-content flex flex-col">
	<header class="navbar border-b border-base-300 bg-base-200 px-4">
		<div class="w-10" aria-hidden="true"></div>
		<h1 class="flex-1 text-center text-lg font-semibold">NxtUp</h1>
		<div class="dropdown dropdown-end">
			<button class="btn btn-ghost btn-square" aria-label="Open navigation menu">
				<i class="fa-solid fa-bars text-lg"></i>
			</button>
			<ul class="menu dropdown-content z-1 mt-2 w-44 rounded-box bg-base-100 p-2 shadow">
				<li><a href="/">Home</a></li>
				<li><a href="/places">Places</a></li>
				<li><a href="/profile">Profile</a></li>
				<li><a href="/settings">Settings</a></li>
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
