import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	orderBy,
	query,
	serverTimestamp,
	updateDoc,
	where
} from 'firebase/firestore';

import { db } from '$lib/firebase';
import type { ListDoc } from '$lib/types/list';
import type { PlaceDoc } from '$lib/types/place';

type CreateListInput = {
	name: string;
	ownerId: string;
	memberIds?: string[];
};

type CreatePlaceInput = Omit<PlaceDoc, 'createdAt' | 'imageUrls'> & {
	imageUrls?: string[];
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

export const getPlacesByListId = async (listId: string): Promise<Array<PlaceDoc & { id: string }>> => {
	const placesRef = collection(db, 'places');
	const q = query(placesRef, where('listId', '==', listId), orderBy('createdAt', 'desc'));
	const snapshot = await getDocs(q);

	return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as PlaceDoc) }));
};

export const updatePlace = async (
	placeId: string,
	updates: Partial<Omit<PlaceDoc, 'createdAt' | 'createdBy' | 'listId'>>
): Promise<void> => {
	const placeRef = doc(db, 'places', placeId);
	await updateDoc(placeRef, updates);
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
