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
let auth: Auth | null = null;

if (isConfigReal) {
  try {
    app = initializeApp(firebaseConfig);
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId);
    auth = getAuth();
  } catch (e) {
    console.warn("Firebase init failed:", e);
  }
} else {
  console.warn("Firebase not configured. Running in demo mode.");
}

// Create a mock auth so components don't crash when auth is null
const mockAuth = {
  currentUser: null as any,
  app: null as any,
  name: "[mock]",
  config: {} as any,
  languageCode: null,
  tenantId: null,
  _canInitEmulator: () => false,
  _updatePercentSanitizedUserIndex: () => {},
  _removeUserFromIndex: () => {},
  _setUserIndex: () => {},
  _onStorageEventManager: { addEventListener: () => {}, removeEventListener: () => {} },
  _persistLocalStoreEventTarget: null,
} as unknown as Auth;

export { db };
export const authProxy = auth || mockAuth;
// Also export as `auth` for backward compatibility with all existing imports
export { authProxy as auth };
export const isFirebaseReady = isConfigReal && !!auth;

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
      userId: authProxy.currentUser?.uid ?? null,
      email: authProxy.currentUser?.email ?? null,
      emailVerified: authProxy.currentUser?.emailVerified ?? null,
      isAnonymous: authProxy.currentUser?.isAnonymous ?? null,
      tenantId: authProxy.currentUser?.tenantId ?? null,
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
