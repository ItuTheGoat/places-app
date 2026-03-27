import type { User } from 'firebase/auth';
import type { FirebaseError } from 'firebase/app';

import {
	deleteCurrentUserAccount,
	getSignInMethods,
	onAuthStateChangedWithUserSync,
	reauthenticateEmailUser,
	sendPasswordReset,
	signInWithEmail,
	signInWithGoogle,
	signOutUser,
	signUpWithEmail,
	updateCurrentUserProfile
} from '$lib/firebase/auth';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
type ProfileUpdates = {
	displayName?: string;
	photoURL?: string | null;
};

const normalizeAuthError = (error: unknown): string => {
	const fallback = 'Something went wrong. Please try again.';
	if (!error) return fallback;

	const firebaseError = error as Partial<FirebaseError>;
	const code = firebaseError.code ?? '';

	if (code.includes('popup-closed-by-user')) return 'Sign-in was canceled.';
	if (code.includes('network-request-failed')) return 'Network error. Check your connection and try again.';
	if (code.includes('invalid-credential')) return 'Invalid credentials. Please try again.';
	if (code.includes('wrong-password')) return 'Incorrect password.';
	if (code.includes('invalid-email')) return 'Please enter a valid email address.';
	if (code.includes('email-already-in-use')) return 'This email is already in use.';
	if (code.includes('user-not-found')) return 'No account was found for that email.';
	if (code.includes('too-many-requests')) return 'Too many attempts. Please wait and try again.';
	if (code.includes('requires-recent-login')) return 'Please sign in again to continue.';
	if (code.includes('weak-password')) return 'Password is too weak.';

	if (error instanceof Error && error.message) return error.message;
	return fallback;
};

const createAuthStore = () => {
	let unsubscribeAuth: (() => void) | null = null;
	let isInitInFlight = false;
	let hasResolvedInitialAuth = false;

	/** `undefined` = auth not resolved yet; `null` = signed out; `User` = signed in */
	let currentUser = $state<User | null | undefined>(undefined);
	let status = $state<AuthStatus>('loading');
	let error = $state<string | null>(null);
	let isWorking = $state(false);
	let isInitialized = $state(false);

	const isLoading = $derived(status === 'loading');
	const isAuthenticated = $derived(status === 'authenticated');

	const clearError = () => {
		error = null;
	};

	const runAction = async <T>(action: () => Promise<T>): Promise<T> => {
		isWorking = true;
		error = null;

		try {
			return await action();
		} catch (err) {
			error = normalizeAuthError(err);
			throw err;
		} finally {
			isWorking = false;
		}
	};

	const init = async (): Promise<void> => {
		if (unsubscribeAuth || isInitInFlight) return;
		isInitInFlight = true;
		status = 'loading';
		error = null;

		unsubscribeAuth = onAuthStateChangedWithUserSync((user) => {
			currentUser = user;
			status = user ? 'authenticated' : 'unauthenticated';

			if (!hasResolvedInitialAuth) {
				hasResolvedInitialAuth = true;
				isInitialized = true;
			}
		});

		isInitInFlight = false;
	};

	const signInWithGoogleAction = async (): Promise<void> =>
		runAction(async () => {
			const user = await signInWithGoogle();
			currentUser = user;
			status = 'authenticated';
		});

	const signInWithEmailAction = async (email: string, password: string): Promise<void> =>
		runAction(async () => {
			const user = await signInWithEmail(email, password);
			currentUser = user;
			status = 'authenticated';
		});

	const signUpWithEmailAction = async (email: string, password: string): Promise<void> =>
		runAction(async () => {
			const user = await signUpWithEmail(email, password);
			currentUser = user;
			status = 'authenticated';
		});

	const signOutAction = async (): Promise<void> =>
		runAction(async () => {
			await signOutUser();
			currentUser = null;
			status = 'unauthenticated';
		});

	const checkSignInMethods = async (email: string): Promise<string[]> =>
		runAction(async () => {
			const methods = await getSignInMethods(email);
			return methods;
		});

	const sendPasswordResetAction = async (email: string): Promise<void> =>
		runAction(async () => {
			await sendPasswordReset(email);
		});

	const updateProfileAction = async (updates: ProfileUpdates): Promise<void> =>
		runAction(async () => {
			await updateCurrentUserProfile(updates);
		});

	const reauthenticateAction = async (email: string, password: string): Promise<void> =>
		runAction(async () => {
			await reauthenticateEmailUser(email, password);
		});

	const deleteAccountAction = async (): Promise<void> =>
		runAction(async () => {
			await deleteCurrentUserAccount();
			currentUser = null;
			status = 'unauthenticated';
		});

	return {
		get currentUser() {
			return currentUser;
		},
		get status() {
			return status;
		},
		get error() {
			return error;
		},
		get isWorking() {
			return isWorking;
		},
		get isInitialized() {
			return isInitialized;
		},
		get isLoading() {
			return isLoading;
		},
		get isAuthenticated() {
			return isAuthenticated;
		},
		init,
		clearError,
		signInWithGoogle: signInWithGoogleAction,
		signInWithEmail: signInWithEmailAction,
		signUpWithEmail: signUpWithEmailAction,
		signOut: signOutAction,
		checkSignInMethods,
		sendPasswordReset: sendPasswordResetAction,
		updateProfile: updateProfileAction,
		reauthenticate: reauthenticateAction,
		deleteAccount: deleteAccountAction
	};
};

export const authStore = createAuthStore();
