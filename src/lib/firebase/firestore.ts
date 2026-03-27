import {
	addDoc,
	arrayUnion,
	collection,
	deleteDoc,
	deleteField,
	doc,
	getDoc,
	getDocs,
	limit,
	orderBy,
	query,
	runTransaction,
	serverTimestamp,
	setDoc,
	updateDoc,
	where
} from 'firebase/firestore';

import { db } from '$lib/firebase';
import type { ListInviteCodeDoc } from '$lib/types/listInvite';
import type { ListDoc } from '$lib/types/list';
import type { PlaceDoc, PlaceStatus } from '$lib/types/place';
import { generateListInviteCode, INVITE_CODE_LEN, normalizeInviteCode } from '$lib/utils/inviteCode';

type CreateListInput = {
	name: string;
	ownerId: string;
	memberIds?: string[];
};

type CreatePlaceInput = Omit<PlaceDoc, 'createdAt' | 'imageUrls'> & {
	imageUrls?: string[];
	mainImageUrl?: string;
};

export const createList = async ({ name, ownerId, memberIds = [] }: CreateListInput): Promise<string> => {
	const listMembers = Array.from(new Set([ownerId, ...memberIds]));
	const listsRef = collection(db, 'lists');

	const payload: ListDoc = {
		name,
		ownerId,
		memberIds: listMembers,
		createdAt: serverTimestamp() as ListDoc['createdAt']
	};

	const created = await addDoc(listsRef, payload);
	return created.id;
};

export const getListsForUser = async (userId: string): Promise<Array<ListDoc & { id: string }>> => {
	const listsRef = collection(db, 'lists');
	const q = query(listsRef, where('memberIds', 'array-contains', userId), orderBy('createdAt', 'desc'));
	const snapshot = await getDocs(q);

	return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as ListDoc) }));
};

export const getListById = async (listId: string): Promise<(ListDoc & { id: string }) | null> => {
	const listRef = doc(db, 'lists', listId);
	const listSnapshot = await getDoc(listRef);
	if (!listSnapshot.exists()) return null;

	return { id: listSnapshot.id, ...(listSnapshot.data() as ListDoc) };
};

export const updateListName = async (listId: string, name: string): Promise<void> => {
	const listRef = doc(db, 'lists', listId);
	await updateDoc(listRef, { name });
};

type DeleteListOptions = {
	onBeforeDelete?: () => Promise<void>;
};

export const deleteList = async (listId: string, options?: DeleteListOptions): Promise<void> => {
	if (options?.onBeforeDelete) {
		await options.onBeforeDelete();
	}

	const listRef = doc(db, 'lists', listId);
	await deleteDoc(listRef);
};

export { generateListInviteCode };

/** Create a new invite code document. Retries on rare id collision. */
export const createListInvite = async (listId: string, ownerId: string): Promise<string> => {
	for (let attempt = 0; attempt < 12; attempt++) {
		const code = generateListInviteCode();
		const ref = doc(db, 'listInviteCodes', code);
		const snap = await getDoc(ref);
		if (snap.exists()) continue;

		const payload: ListInviteCodeDoc = {
			listId,
			ownerId,
			createdAt: serverTimestamp() as ListInviteCodeDoc['createdAt'],
			consumed: false
		};
		await setDoc(ref, payload);
		return code;
	}
	throw new Error('Could not generate a unique invite code. Try again.');
};

/** Returns an active (unconsumed) invite code for the list, or null. */
export const getActiveInviteCodeForList = async (listId: string): Promise<string | null> => {
	const invitesRef = collection(db, 'listInviteCodes');
	const q = query(
		invitesRef,
		where('listId', '==', listId),
		where('consumed', '==', false),
		limit(1)
	);
	const snapshot = await getDocs(q);
	if (snapshot.empty) return null;
	return snapshot.docs[0]!.id;
};

export const revokeListInviteCode = async (code: string): Promise<void> => {
	const normalized = normalizeInviteCode(code);
	if (!normalized) return;
	await deleteDoc(doc(db, 'listInviteCodes', normalized));
};

export const redeemListInvite = async (
	rawCode: string,
	{ uid, email }: { uid: string; email: string | null }
): Promise<string> => {
	const code = normalizeInviteCode(rawCode);
	if (code.length !== INVITE_CODE_LEN) {
		throw new Error(`Enter a ${INVITE_CODE_LEN}-character code.`);
	}

	const emailForRules = email ?? '';

	const inviteRef = doc(db, 'listInviteCodes', code);

	return runTransaction(db, async (transaction) => {
		const inviteSnap = await transaction.get(inviteRef);
		if (!inviteSnap.exists()) {
			throw new Error('Invalid or expired invite code.');
		}

		const invite = inviteSnap.data() as ListInviteCodeDoc;
		if (invite.consumed) {
			throw new Error('This invite code has already been used.');
		}

		const listRef = doc(db, 'lists', invite.listId);
		const listSnap = await transaction.get(listRef);
		if (!listSnap.exists()) {
			throw new Error('This list no longer exists.');
		}

		const list = listSnap.data() as ListDoc;
		if (list.memberIds.includes(uid)) {
			throw new Error('You are already a member of this list.');
		}

		transaction.update(listRef, {
			memberIds: arrayUnion(uid)
		});

		transaction.update(inviteRef, {
			consumed: true,
			consumedAt: serverTimestamp(),
			consumedByUid: uid,
			consumedByEmail: emailForRules
		});

		const redemptionRef = doc(collection(db, 'listInviteRedemptions'));
		transaction.set(redemptionRef, {
			listId: invite.listId,
			inviteCode: code,
			usedByUid: uid,
			usedByEmail: emailForRules,
			usedAt: serverTimestamp()
		});

		return invite.listId;
	});
};

export const createPlace = async (input: CreatePlaceInput): Promise<string> => {
	if (!input.listId) {
		throw new Error('Cannot create a place without listId.');
	}

	const placesRef = collection(db, 'places');
	const payload: PlaceDoc = {
		...input,
		imageUrls: input.imageUrls ?? [],
		createdAt: serverTimestamp() as PlaceDoc['createdAt']
	};

	const created = await addDoc(placesRef, payload);
	return created.id;
};

export const getPlaceById = async (placeId: string): Promise<(PlaceDoc & { id: string }) | null> => {
	const placeRef = doc(db, 'places', placeId);
	const snapshot = await getDoc(placeRef);
	if (!snapshot.exists()) return null;
	return { id: snapshot.id, ...(snapshot.data() as PlaceDoc) };
};

export const getPlacesByListId = async (listId: string): Promise<Array<PlaceDoc & { id: string }>> => {
	const placesRef = collection(db, 'places');
	const q = query(placesRef, where('listId', '==', listId), orderBy('createdAt', 'desc'));
	const snapshot = await getDocs(q);

	return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as PlaceDoc) }));
};

/** All places across lists the user can access (via list membership). */
export const getPlacesForUser = async (userId: string): Promise<Array<PlaceDoc & { id: string }>> => {
	const lists = await getListsForUser(userId);
	if (lists.length === 0) return [];

	const byId = new Map<string, PlaceDoc & { id: string }>();
	const batches = await Promise.all(lists.map((l) => getPlacesByListId(l.id)));
	for (const places of batches) {
		for (const p of places) {
			if (!byId.has(p.id)) byId.set(p.id, p);
		}
	}

	return Array.from(byId.values()).sort(
		(a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
	);
};

export const updatePlace = async (
	placeId: string,
	updates: Partial<Omit<PlaceDoc, 'createdAt' | 'createdBy' | 'listId'>>
): Promise<void> => {
	const placeRef = doc(db, 'places', placeId);
	await updateDoc(placeRef, updates);
};

export const updatePlaceStatus = async (placeId: string, status: PlaceStatus): Promise<void> => {
	const placeRef = doc(db, 'places', placeId);
	if (status === 'visited') {
		await updateDoc(placeRef, {
			status,
			visitedAt: serverTimestamp() as PlaceDoc['visitedAt']
		});
	} else {
		await updateDoc(placeRef, {
			status,
			visitedAt: deleteField()
		});
	}
};

export type PlaceRatingReviewPayload = {
	rating: number | null;
	review: string;
	wouldReturn: boolean | null;
};

/** Clears optional fields in Firestore when values are null (rating, wouldReturn) or review is empty. */
export const updatePlaceRatingReview = async (
	placeId: string,
	{ rating, review, wouldReturn }: PlaceRatingReviewPayload
): Promise<void> => {
	const placeRef = doc(db, 'places', placeId);
	const trimmed = review.trim();
	await updateDoc(placeRef, {
		rating: rating === null ? deleteField() : rating,
		review: trimmed === '' ? deleteField() : trimmed,
		wouldReturn: wouldReturn === null ? deleteField() : wouldReturn
	});
};

type DeletePlaceOptions = {
	onBeforeDelete?: () => Promise<void>;
};

export const deletePlace = async (placeId: string, options?: DeletePlaceOptions): Promise<void> => {
	if (options?.onBeforeDelete) {
		await options.onBeforeDelete();
	}

	const placeRef = doc(db, 'places', placeId);
	await deleteDoc(placeRef);
};
