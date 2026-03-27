import type { Timestamp } from 'firebase/firestore';

/** Document id = 8-char invite code (A–Z, 0–9). */
export type ListInviteCodeDoc = {
	listId: string;
	ownerId: string;
	createdAt: Timestamp;
	consumed: boolean;
	consumedAt?: Timestamp;
	consumedByUid?: string;
	consumedByEmail?: string;
};

/** Append-only audit row when a code is redeemed. */
export type ListInviteRedemptionDoc = {
	listId: string;
	inviteCode: string;
	usedByUid: string;
	usedByEmail: string;
	usedAt: Timestamp;
};
