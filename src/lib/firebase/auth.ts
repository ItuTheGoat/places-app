import {
	EmailAuthProvider,
	GoogleAuthProvider,
	createUserWithEmailAndPassword,
	deleteUser,
	fetchSignInMethodsForEmail,
	reauthenticateWithCredential,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signInWithPopup,
	type User,
	onAuthStateChanged,
	updateProfile as firebaseUpdateProfile,
	signOut
} from 'firebase/auth';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '$lib/firebase';
import type { UserDoc } from '$lib/types/user';

const googleProvider = new GoogleAuthProvider();

export const ensureUserDocument = async (user: User): Promise<void> => {
	const userRef = doc(db, 'users', user.uid);
	const userSnapshot = await getDoc(userRef);

	if (userSnapshot.exists()) return;

	const payload: UserDoc = {
		displayName: user.displayName ?? 'NxtUp User',
		email: user.email ?? '',
		photoURL: user.photoURL ?? undefined,
		createdAt: serverTimestamp() as UserDoc['createdAt']
	};

	await setDoc(userRef, payload);
};

export const signInWithGoogle = async (): Promise<User> => {
	const credential = await signInWithPopup(auth, googleProvider);
	await ensureUserDocument(credential.user);
	return credential.user;
};

export const signUpWithEmail = async (email: string, password: string): Promise<User> => {
	const credential = await createUserWithEmailAndPassword(auth, email, password);
	await ensureUserDocument(credential.user);
	return credential.user;
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
	const credential = await signInWithEmailAndPassword(auth, email, password);
	await ensureUserDocument(credential.user);
	return credential.user;
};

export const signOutUser = async (): Promise<void> => {
	await signOut(auth);
};

export const getSignInMethods = async (email: string): Promise<string[]> => {
	return fetchSignInMethodsForEmail(auth, email);
};

export const sendPasswordReset = async (email: string): Promise<void> => {
	await sendPasswordResetEmail(auth, email);
};

export const updateCurrentUserProfile = async (updates: {
	displayName?: string;
	photoURL?: string | null;
}): Promise<void> => {
	if (!auth.currentUser) {
		throw new Error('No authenticated user.');
	}

	await firebaseUpdateProfile(auth.currentUser, updates);
	await setDoc(
		doc(db, 'users', auth.currentUser.uid),
		{
			displayName: auth.currentUser.displayName ?? 'NxtUp User',
			email: auth.currentUser.email ?? '',
			photoURL: auth.currentUser.photoURL ?? null
		},
		{ merge: true }
	);
};

export const reauthenticateEmailUser = async (email: string, password: string): Promise<void> => {
	if (!auth.currentUser) {
		throw new Error('No authenticated user.');
	}

	const credential = EmailAuthProvider.credential(email, password);
	await reauthenticateWithCredential(auth.currentUser, credential);
};

export const deleteCurrentUserAccount = async (): Promise<void> => {
	if (!auth.currentUser) {
		throw new Error('No authenticated user.');
	}

	const uid = auth.currentUser.uid;
	await deleteDoc(doc(db, 'users', uid));
	await deleteUser(auth.currentUser);
};

export const onAuthStateChangedWithUserSync = (callback: (user: User | null) => void) =>
	onAuthStateChanged(auth, async (user) => {
		if (user) {
			await ensureUserDocument(user);
		}

		callback(user);
	});
