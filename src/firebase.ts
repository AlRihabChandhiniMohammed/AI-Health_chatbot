/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { initializeFirestore, type Firestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const isConfigReal =
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.startsWith("YOUR_") &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.startsWith("YOUR_");

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let _auth: Auth | null = null;

if (isConfigReal) {
  try {
    app = initializeApp(firebaseConfig);
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId);
    _auth = getAuth();
  } catch (e) {
    console.warn("Firebase init failed:", e);
  }
} else {
  console.warn("Firebase not configured. Running in demo mode.");
}

// Safe auth proxy: exposes currentUser without Firebase SDK internals
// This prevents crashes in components that access auth.currentUser
export const auth = new Proxy({} as any, {
  get(_target, prop) {
    if (prop === "currentUser") {
      // Return guest user if set, otherwise real auth user or null
      const guest = (globalThis as any).__guestUser;
      return guest ?? _auth?.currentUser ?? null;
    }
    if (prop === "__esModule" || prop === "default") return undefined;
    if (_auth && typeof (_auth as any)[prop] === "function") {
      return (_auth as any)[prop].bind(_auth);
    }
    return undefined;
  }
});

// Real Firebase Auth for SDK functions (onAuthStateChanged, signIn, etc.)
// Only available when Firebase is configured
export const realAuth = _auth;

export { db };
export const isFirebaseReady = isConfigReal && !!_auth;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
    },
    operationType,
    path
  };
  
  console.error('[Clinical Platform Firestore Error]: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or networks. Client is offline.");
    }
  }
}

testConnection();
