import { deleteObject, getDownloadURL, listAll, ref, uploadBytes, type StorageReference } from 'firebase/storage';

import { storage } from '$lib/firebase';

const createPlaceImageRef = (placeId: string, imageId: string): StorageReference =>
	ref(storage, `places/${placeId}/${imageId}.jpg`);

export const uploadPlaceImage = async (
	placeId: string,
	imageId: string,
	file: Blob
): Promise<{ path: string; url: string }> => {
	const imageRef = createPlaceImageRef(placeId, imageId);
	await uploadBytes(imageRef, file, { contentType: file.type || 'image/jpeg' });
	const url = await getDownloadURL(imageRef);

	return { path: imageRef.fullPath, url };
};

export const uploadPlaceImages = async (
	placeId: string,
	files: Blob[]
): Promise<Array<{ path: string; url: string }>> => {
	const uploads = files.map((file) => {
		const imageId = crypto.randomUUID();
		return uploadPlaceImage(placeId, imageId, file);
	});

	return Promise.all(uploads);
};

/** `downloadUrl` must be a full `https://` or `gs://` URL from `getDownloadURL`. */
export const deletePlaceImageByUrl = async (downloadUrl: string): Promise<void> => {
	const imageRef = ref(storage, downloadUrl);
	await deleteObject(imageRef);
};

export const deletePlaceImages = async (imageUrls: string[]): Promise<void> => {
	await Promise.all(imageUrls.map((url) => deletePlaceImageByUrl(url)));
};

export const deleteAllPlaceImages = async (placeId: string): Promise<void> => {
	const folderRef = ref(storage, `places/${placeId}`);
	const files = await listAll(folderRef);
	await Promise.all(files.items.map((item) => deleteObject(item)));
};
