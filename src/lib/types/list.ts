import type { Timestamp } from 'firebase/firestore';

export type ListDoc = {
	name: string;
	ownerId: string;
	memberIds: string[];
	createdAt: Timestamp;
};
