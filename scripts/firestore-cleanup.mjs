import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const rawCreds = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!rawCreds) {
  throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON secret.");
}

initializeApp({
  credential: cert(JSON.parse(rawCreds))
});

const db = getFirestore();
console.log("Connected to Firestore successfully.");
