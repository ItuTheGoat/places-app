import type { Timestamp } from 'firebase/firestore';

export type UserDoc = {
	displayName: string;
	email: string;
	photoURL?: string;
	createdAt: Timestamp;
};
