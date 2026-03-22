import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB9Os4PiR2elurM_1vBxsdPpynXFZaNRBs",
  authDomain: "lizy-d80ea.firebaseapp.com",
  projectId: "lizy-d80ea",
  storageBucket: "lizy-d80ea.firebasestorage.app",
  messagingSenderId: "611864923475",
  appId: "1:611864923475:web:534b014fe7c531a3ad25a6",
  measurementId: "G-FEWCR1DPH3",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

let analyticsInstancePromise: Promise<Analytics | null> | null = null;

export const getFirebaseAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  analyticsInstancePromise ??= isSupported().then((supported) =>
    supported ? getAnalytics(firebaseApp) : null,
  );

  return analyticsInstancePromise;
};
