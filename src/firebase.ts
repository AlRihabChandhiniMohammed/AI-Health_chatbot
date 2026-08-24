/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { initializeFirestore, type Firestore, doc, getDocFromServer } from "firebase/firestore";

// Load config - works with both real and placeholder values
let firebaseConfig: any;
try {
  firebaseConfig = require("../firebase-applet-config.json");
} catch {
  firebaseConfig = {};
}

// Check if config has real values (not placeholders)
const isConfigReal =
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.startsWith("YOUR_") &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.startsWith("YOUR_");

// Initialize Firebase only with real config
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
  console.warn("Firebase config contains placeholder values. Running in offline/demo mode.");
}

// Export mock auth for demo mode if real auth unavailable
export { db, auth };
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
      userId: auth?.currentUser?.uid ?? null,
      email: auth?.currentUser?.email ?? null,
      emailVerified: auth?.currentUser?.emailVerified ?? null,
      isAnonymous: auth?.currentUser?.isAnonymous ?? null,
      tenantId: auth?.currentUser?.tenantId ?? null,
    },
    operationType,
    path
  };
  
  console.error('[Clinical Platform Firestore Error]: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection only if Firebase is configured
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
