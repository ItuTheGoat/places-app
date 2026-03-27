import { browser } from '$app/environment';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
	apiKey: import.meta.env.FIREBASE_API_KEY,
	authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.FIREBASE_APP_ID,
	measurementId: import.meta.env.FIREBASE_MEASUREMENT_ID
};

const app: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let analytics: Analytics | null = null;

if (browser) {
	isSupported()
		.then((supported) => {
			if (supported) analytics = getAnalytics(app);
		})
		.catch(() => {
			analytics = null;
		});
}

export { app, auth, db, storage, analytics };
