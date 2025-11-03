import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  if (!admin.apps.length) {
    // In production, use service account key file or environment variables
    // For development, you can use the service account key JSON
    const serviceAccountKey = process.env['FIREBASE_SERVICE_ACCOUNT_KEY'];
    const projectId = process.env['FIREBASE_PROJECT_ID'];
    
    if (serviceAccountKey && projectId) {
      try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: projectId,
        });
        console.log('Firebase initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
      }
    } else {
      // Fallback for development - you'll need to set up proper credentials
      console.warn('Firebase service account not configured. Push notifications will not work.');
    }
  }
  return admin;
};

export { initializeFirebase };
export default admin;