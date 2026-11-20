
require('dotenv').config();

const {
    initializeApp,
    applicationDefault,
    getApps,
} = require('firebase-admin/app');

const { getAuth } = require('firebase-admin/auth');

if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error('FIREBASE_PROJECT_ID is missing from .env');
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error(
        'GOOGLE_APPLICATION_CREDENTIALS is missing from .env'
    );
}

const firebaseApp =
    getApps().length > 0
        ? getApps()[0]
        : initializeApp({
            credential: applicationDefault(),
            projectId: process.env.FIREBASE_PROJECT_ID,
        });

const firebaseAuth = getAuth(firebaseApp);

module.exports = { firebaseApp, firebaseAuth };
