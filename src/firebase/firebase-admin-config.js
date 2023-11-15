import { initializeApp, getApps, cert } from "firebase-admin/app";

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_PROJECTID,
    clientEmail: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_CLIENTEMAIL,
    privateKey: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_PRIVATEKEY,
  }),
};

export function customInitApp() {
  if (getApps().length <= 0) {
    initializeApp(firebaseAdminConfig);
  }
}
