import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
let adminInitialized = false;

// Initialize Firebase Admin with error handling
function initializeFirebaseAdmin() {
  if (adminInitialized) return;

  // Check for required environment variables
  const requiredEnvVars = [
    'FIREBASE_SERVICE_ACCOUNT_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_DATABASE_URL'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`${envVar} environment variable is not set`);
    }
  }

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
    
    // Validate service account
    const requiredServiceAccountFields = ['project_id', 'private_key', 'client_email'];
    for (const field of requiredServiceAccountFields) {
      if (!serviceAccount[field]) {
        throw new Error(`Service account is missing ${field}`);
      }
    }

    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      console.log('Firebase Admin initialized successfully');
    }
    
    adminInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

// Export initialized services with lazy initialization
const getFirebaseServices = () => {
  if (!adminInitialized) {
    initializeFirebaseAdmin();
  }
  
  return {
    db: getFirestore(),
    auth: getAuth()
  };
};

// Export the services
export const { db, auth } = getFirebaseServices();

// Helper function to verify ID token with proper error handling
export async function verifyIdToken(token: string) {
  try {
    return await auth.verifyIdToken(token);
  } catch (error) {
    console.error('Error verifying token:', error);
    throw error;
  }
}
