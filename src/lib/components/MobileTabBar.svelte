<script lang="ts">
	import { page } from '$app/state';

	let path = $derived(page.url.pathname);

	function feedActive(p: string): boolean {
		return p === '/';
	}

	function createActive(p: string): boolean {
		return p === '/places/new';
	}

	function accountActive(p: string): boolean {
		return p === '/account';
	}

	function tabClass(active: boolean): string {
		return active
			? 'text-primary [&_i]:text-primary'
			: 'text-base-content/60 [&_i]:text-base-content/50';
	}
</script>

<nav
	class="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-base-300 bg-base-100/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.12)] backdrop-blur-sm"
	aria-label="Main"
>
	<div class="mx-auto flex max-w-3xl items-stretch justify-around gap-1 px-2 pt-2">
		<a
			href="/"
			class="flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide transition-colors hover:bg-base-200/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary {tabClass(
				feedActive(path)
			)}"
			aria-current={feedActive(path) ? 'page' : undefined}
		>
			<i class="fa-solid fa-house text-lg leading-none" aria-hidden="true"></i>
			<span class="truncate">Feed</span>
		</a>
		<a
			href="/places/new"
			class="flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide transition-colors hover:bg-base-200/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary {tabClass(
				createActive(path)
			)}"
			aria-current={createActive(path) ? 'page' : undefined}
		>
			<i class="fa-solid fa-plus text-lg leading-none" aria-hidden="true"></i>
			<span class="truncate">Create</span>
		</a>
		<a
			href="/account"
			class="flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide transition-colors hover:bg-base-200/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary {tabClass(
				accountActive(path)
			)}"
			aria-current={accountActive(path) ? 'page' : undefined}
		>
			<i class="fa-solid fa-user text-lg leading-none" aria-hidden="true"></i>
			<span class="truncate">Account</span>
		</a>
	</div>
</nav>
