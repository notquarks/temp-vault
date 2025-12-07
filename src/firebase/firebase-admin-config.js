import { initializeApp, getApps, cert } from "firebase-admin/app";

export function customInitApp() {
  if (getApps().length > 0) {
    return true;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECTID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENTEMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATEKEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "Failed to initialize Firebase Admin: Missing environment variables.",
    );
    return false;
  }

  try {
    const firebaseAdminConfig = {
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    };

    initializeApp(firebaseAdminConfig);
    return true;
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    return false;
  }
}
