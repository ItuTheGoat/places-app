<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';

	let displayName = $state('');
	let photoURL = $state('');
	let reauthEmail = $state('');
	let reauthPassword = $state('');
	let statusMessage = $state<string | null>(null);

	const clearFeedback = () => {
		statusMessage = null;
		authStore.clearError();
	};

	const onUpdateProfile = async () => {
		clearFeedback();
		try {
			await authStore.updateProfile({
				displayName: displayName.trim() || undefined,
				photoURL: photoURL.trim() || null
			});
			statusMessage = 'Profile updated.';
		} catch {
			// authStore.error is shown in UI
		}
	};

	const onReauthenticate = async () => {
		clearFeedback();
		const email = reauthEmail.trim() || authStore.currentUser?.email || '';
		try {
			await authStore.reauthenticate(email, reauthPassword);
			statusMessage = 'Reauthenticated successfully.';
			reauthPassword = '';
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
			statusMessage = 'Password reset email sent.';
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
				<label class="form-control w-full">
					<span class="label-text mb-1">Photo URL</span>
					<input
						class="input input-bordered w-full"
						type="url"
						bind:value={photoURL}
						placeholder={authStore.currentUser?.photoURL ?? 'https://example.com/photo.jpg'}
						oninput={clearFeedback}
					/>
				</label>
				<button class="btn btn-primary" type="button" onclick={onUpdateProfile} disabled={authStore.isWorking}>
					Save profile
				</button>
			</div>
		</section>

		<section class="card bg-base-200 shadow-sm">
			<div class="card-body gap-3">
				<h2 class="card-title text-base">Reauthenticate</h2>
				<label class="form-control w-full">
					<span class="label-text mb-1">Email</span>
					<input
						class="input input-bordered w-full"
						type="email"
						bind:value={reauthEmail}
						placeholder={authStore.currentUser?.email ?? 'you@example.com'}
						oninput={clearFeedback}
					/>
				</label>
				<label class="form-control w-full">
					<span class="label-text mb-1">Password</span>
					<input
						class="input input-bordered w-full"
						type="password"
						bind:value={reauthPassword}
						oninput={clearFeedback}
					/>
				</label>
				<button class="btn btn-outline" type="button" onclick={onReauthenticate} disabled={authStore.isWorking}>
					Confirm credentials
				</button>
			</div>
		</section>

		<section class="card bg-base-200 shadow-sm">
			<div class="card-body gap-3">
				<h2 class="card-title text-base">Account actions</h2>
				<button
					class="btn btn-outline btn-neutral w-full sm:w-auto"
					type="button"
					onclick={() => void authStore.signOut()}
					disabled={authStore.isWorking}
				>
					Sign out
				</button>
				{#if authStore.currentUser?.email}
					<button class="btn btn-secondary" type="button" onclick={onSendReset} disabled={authStore.isWorking}>
						Send password reset email
					</button>
				{/if}
				<button class="btn btn-error" type="button" onclick={onDeleteAccount} disabled={authStore.isWorking}>
					Delete account
				</button>
			</div>
		</section>
	</div>
{/if}
