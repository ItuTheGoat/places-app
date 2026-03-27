<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';

	let displayName = $state('');
	let statusMessage = $state<string | null>(null);
	let avatarFailed = $state(false);

	const clearFeedback = () => {
		statusMessage = null;
		authStore.clearError();
	};

	const previewPhotoUrl = $derived((authStore.currentUser?.photoURL ?? '').trim());

	const avatarInitials = $derived.by(() => {
		const u = authStore.currentUser;
		const name = displayName.trim() || u?.displayName?.trim() || '';
		const email = u?.email?.trim() || '';
		if (name) {
			const parts = name.split(/\s+/).filter(Boolean);
			if (parts.length >= 2) {
				return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
			}
			return name.slice(0, 2).toUpperCase();
		}
		if (email) return email.slice(0, 2).toUpperCase();
		return '?';
	});

	$effect(() => {
		void previewPhotoUrl;
		avatarFailed = false;
	});

	$effect(() => {
		const u = authStore.currentUser;
		if (!u) return;
		displayName = u.displayName ?? '';
	});

	const onUpdateProfile = async () => {
		clearFeedback();
		try {
			await authStore.updateProfile({
				displayName: displayName.trim() || undefined
			});
			statusMessage = 'Profile updated.';
		} catch {
			// authStore.error is shown in UI
		}
	};

	const onSendReset = async () => {
		const email = authStore.currentUser?.email;
		if (!email) return;
		clearFeedback();
		try {
			await authStore.sendPasswordReset(email);
			statusMessage = 'Check your email for a link to reset your password.';
		} catch {
			// authStore.error is shown in UI
		}
	};

	const onDeleteAccount = async () => {
		clearFeedback();
		try {
			await authStore.deleteAccount();
			statusMessage = 'Account deleted.';
		} catch {
			// authStore.error is shown in UI
		}
	};
</script>

{#if authStore.currentUser}
	<div class="mx-auto flex w-full max-w-md flex-col gap-4">
		{#if authStore.error}
			<div class="alert alert-error shadow-sm">
				<span>{authStore.error}</span>
			</div>
		{/if}

		{#if statusMessage}
			<div class="alert alert-success shadow-sm">
				<span>{statusMessage}</span>
			</div>
		{/if}

		<section class="card bg-base-200 shadow-sm">
			<div class="card-body gap-3">
				<h2 class="card-title text-base">Update profile</h2>

				<div class="flex flex-col items-center gap-2">
					<div
						class="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-base-300 ring-2 ring-base-content/15"
					>
						{#if previewPhotoUrl && !avatarFailed}
							<img
								src={previewPhotoUrl}
								alt=""
								class="h-full w-full object-cover"
								onerror={() => (avatarFailed = true)}
							/>
						{:else}
							<span class="text-xl font-semibold text-base-content/80">{avatarInitials}</span>
						{/if}
					</div>
				</div>

				<label class="form-control w-full">
					<span class="label-text mb-1">Display name</span>
					<input
						class="input input-bordered w-full"
						type="text"
						bind:value={displayName}
						placeholder={authStore.currentUser?.displayName ?? 'Your display name'}
						oninput={clearFeedback}
					/>
				</label>
				<button class="btn btn-primary" type="button" onclick={onUpdateProfile} disabled={authStore.isWorking}>
					Save profile
				</button>
			</div>
		</section>

		{#if authStore.currentUser?.email}
			<section class="card bg-base-200 shadow-sm">
				<div class="card-body gap-2">
					<h2 class="card-title text-base">Password</h2>
					<p class="text-sm text-base-content/70">
						Forgot your password? We will email a reset link to <span class="font-medium text-base-content/90"
							>{authStore.currentUser.email}</span
						>.
					</p>
					<button
						class="btn btn-secondary rounded-xl"
						type="button"
						onclick={onSendReset}
						disabled={authStore.isWorking}
					>
						Email me a reset link
					</button>
				</div>
			</section>
		{/if}

		<section class="card bg-base-200 shadow-sm">
			<div class="card-body gap-3">
				<h2 class="card-title text-base">Account actions</h2>
				<button
					class="btn w-full rounded-xl border border-base-content/30 bg-base-300/40 text-base-content hover:border-base-content/50 hover:bg-base-300 sm:w-auto"
					type="button"
					onclick={() => void authStore.signOut()}
					disabled={authStore.isWorking}
				>
					Sign out
				</button>
				<button class="btn btn-error rounded-xl" type="button" onclick={onDeleteAccount} disabled={authStore.isWorking}>
					Delete account
				</button>
			</div>
		</section>
	</div>
{/if}
