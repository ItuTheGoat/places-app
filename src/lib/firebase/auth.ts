import {
	GoogleAuthProvider,
	type User,
	onAuthStateChanged,
	signInWithPopup,
	signOut
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

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

export const signOutUser = async (): Promise<void> => {
	await signOut(auth);
};

export const onAuthStateChangedWithUserSync = (callback: (user: User | null) => void) =>
	onAuthStateChanged(auth, async (user) => {
		if (user) {
			await ensureUserDocument(user);
		}

		callback(user);
	});
