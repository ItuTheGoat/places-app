<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authStore } from '$lib/stores/auth.svelte';

	let email = $state('');
	let password = $state('');
	let recoveryEmail = $state('');
	let statusMessage = $state<string | null>(null);
	let showSignInPassword = $state(false);
	let showSignUpPassword = $state(false);
	type AuthTab = 'signin' | 'signup' | 'recover';

	const currentTab = $derived((() => {
		const tab = page.url.searchParams.get('tab');
		return tab === 'signin' || tab === 'signup' || tab === 'recover' ? tab : 'signin';
	})() satisfies AuthTab);

	const clearFeedback = () => {
		statusMessage = null;
		authStore.clearError();
	};

	const onGoogleSignIn = async () => {
		clearFeedback();
		try {
			await authStore.signInWithGoogle();
		} catch {
			// authStore.error is shown in UI
		}
	};

	const onEmailSignIn = async () => {
		clearFeedback();
		try {
			await authStore.signInWithEmail(email.trim(), password);
			statusMessage = 'Signed in successfully.';
		} catch {
			// authStore.error is shown in UI
		}
	};

	const onEmailSignUp = async () => {
		clearFeedback();
		try {
			await authStore.signUpWithEmail(email.trim(), password);
			statusMessage = 'Account created successfully.';
		} catch {
			// authStore.error is shown in UI
		}
	};

	const onRecoverPassword = async () => {
		clearFeedback();
		const normalizedEmail = recoveryEmail.trim();

		try {
			const methods = await authStore.checkSignInMethods(normalizedEmail);
			if (methods.includes('password')) {
				await authStore.sendPasswordReset(normalizedEmail);
				statusMessage = 'Password reset email sent.';
				return;
			}

			if (methods.includes('google.com')) {
				statusMessage = 'This account uses Google sign-in. Please continue with Google.';
				return;
			}

			statusMessage = 'No account found for this email.';
		} catch {
			// authStore.error is shown in UI
		}
	};

	$effect(() => {
		if (!authStore.isAuthenticated) return;
		void goto('/', { replaceState: true });
	});
</script>

<div class="mx-auto flex w-full max-w-md flex-col gap-4">
	{#if authStore.isAuthenticated}
		<div class="alert alert-success shadow-sm">
			<span>You are already signed in.</span>
			<a href="/account" class="link font-medium">Go to account</a>
		</div>
	{/if}

	{#if authStore.error}
		<div class="alert alert-error shadow-sm">
			<span>{authStore.error}</span>
		</div>
	{/if}

	{#if statusMessage}
		<div class="alert alert-info shadow-sm">
			<span>{statusMessage}</span>
		</div>
	{/if}

	<nav class="tabs tabs-boxed w-full bg-base-200 p-1">
		<a
			class="tab flex-1"
			class:tab-active={currentTab === 'signin'}
			href="/auth?tab=signin"
			onclick={clearFeedback}>Sign in</a
		>
		<a
			class="tab flex-1"
			class:tab-active={currentTab === 'signup'}
			href="/auth?tab=signup"
			onclick={clearFeedback}>Sign up</a
		>
		<a
			class="tab flex-1"
			class:tab-active={currentTab === 'recover'}
			href="/auth?tab=recover"
			onclick={clearFeedback}>Recover</a
		>
	</nav>

	{#if currentTab === 'signin'}
		<section class="card bg-base-200 shadow-sm">
			<div class="card-body gap-3">
				<h2 class="card-title text-base">Google sign-in</h2>
				<button class="btn btn-primary" type="button" onclick={onGoogleSignIn} disabled={authStore.isWorking}>
					<i class="fa-brands fa-google" aria-hidden="true"></i>
					{authStore.isWorking ? 'Working...' : 'Continue with Google'}
				</button>
			</div>
		</section>

		<section class="card bg-base-200 shadow-sm">
			<div class="card-body gap-3">
				<h2 class="card-title text-base">Email sign-in</h2>
				<label class="form-control w-full">
					<span class="label-text mb-1">Email</span>
					<input
						class="input input-bordered w-full"
						type="email"
						bind:value={email}
						placeholder="you@example.com"
						oninput={clearFeedback}
					/>
				</label>
				<label class="form-control w-full">
					<span class="label-text mb-1">Password</span>
					<div class="flex gap-2">
						<input
							class="input input-bordered w-full"
							type={showSignInPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder="Your password"
							oninput={clearFeedback}
						/>
						<button
							class="btn btn-outline btn-sm min-w-20"
							type="button"
							aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
							onclick={() => (showSignInPassword = !showSignInPassword)}
						>
							{showSignInPassword ? 'Hide' : 'Show'}
						</button>
					</div>
				</label>
				<button class="btn btn-primary" type="button" onclick={onEmailSignIn} disabled={authStore.isWorking}>
					Sign in
				</button>
				<p class="text-sm">
					Need an account?
					<a class="link link-primary font-medium" href="/auth?tab=signup" onclick={clearFeedback}>Sign up</a>
				</p>
			</div>
		</section>
	{:else if currentTab === 'signup'}
		<section class="card bg-base-200 shadow-sm">
			<div class="card-body gap-3">
				<h2 class="card-title text-base">Create account</h2>
				<label class="form-control w-full">
					<span class="label-text mb-1">Email</span>
					<input
						class="input input-bordered w-full"
						type="email"
						bind:value={email}
						placeholder="you@example.com"
						oninput={clearFeedback}
					/>
				</label>
				<label class="form-control w-full">
					<span class="label-text mb-1">Password</span>
					<div class="flex gap-2">
						<input
							class="input input-bordered w-full"
							type={showSignUpPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder="Create a password"
							oninput={clearFeedback}
						/>
						<button
							class="btn btn-outline btn-sm min-w-20"
							type="button"
							aria-label={showSignUpPassword ? 'Hide password' : 'Show password'}
							onclick={() => (showSignUpPassword = !showSignUpPassword)}
						>
							{showSignUpPassword ? 'Hide' : 'Show'}
						</button>
					</div>
				</label>
				<button class="btn btn-primary" type="button" onclick={onEmailSignUp} disabled={authStore.isWorking}>
					Create account
				</button>
			</div>
		</section>
	{:else}
		<section class="card bg-base-200 shadow-sm">
			<div class="card-body gap-3">
				<h2 class="card-title text-base">Password recovery</h2>
				<label class="form-control w-full">
					<span class="label-text mb-1">Account email</span>
					<input
						class="input input-bordered w-full"
						type="email"
						bind:value={recoveryEmail}
						placeholder="you@example.com"
						oninput={clearFeedback}
					/>
				</label>
				<button class="btn btn-secondary" type="button" onclick={onRecoverPassword} disabled={authStore.isWorking}>
					Recover password
				</button>
			</div>
		</section>
	{/if}
</div>
