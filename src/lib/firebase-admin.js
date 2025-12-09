import "server-only";
import { initializeApp, getApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export function getFirebaseAdmin() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECTID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENTEMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATEKEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing Firebase Admin environment variables");
    throw new Error("Missing Firebase Admin environment variables");
  }

  let app;
  try {
    app = getApp();
    console.log("Reusing Firebase Admin app...");
  } catch (error) {
    console.log("Initializing Firebase Admin...");
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  }

  const auth = getAuth(app);
  return { app, auth };
}
