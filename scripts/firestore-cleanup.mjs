import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const rawCreds = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!rawCreds) {
  throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON secret.");
}

initializeApp({
  credential: cert(JSON.parse(rawCreds)),
});

const db = getFirestore();

// Customize these to match your Firestore structure
const COLLECTION_NAME = "tempItems";
const TIMESTAMP_FIELD = "createdAt";
const MAX_AGE_DAYS = 7;
const DRY_RUN = false; // Set to false once verified

async function runCleanup() {
  const cutoffDate = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
  const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

  const snapshot = await db
    .collection(COLLECTION_NAME)
    .where(TIMESTAMP_FIELD, "<", cutoffTimestamp)
    .limit(400)
    .get();

  console.log(
    `Found ${snapshot.size} expired doc(s) in "${COLLECTION_NAME}" before ${cutoffDate.toISOString()}.`
  );

  if (snapshot.empty) {
    console.log("Nothing to clean up.");
    return;
  }

  if (DRY_RUN) {
    snapshot.docs.forEach((doc) => console.log(`[DRY_RUN] Would delete: ${doc.id}`));
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  console.log(`Deleted ${snapshot.size} doc(s) from "${COLLECTION_NAME}".`);
}

runCleanup().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
