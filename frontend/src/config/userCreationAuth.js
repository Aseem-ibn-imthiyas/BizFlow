
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseApp from './firebase';

const appName = 'BizFlowUserCreation';

const existingApp = getApps().find(
    (app) => app.name === appName
);

const userCreationApp =
    existingApp || initializeApp(firebaseApp.options, appName);

export const userCreationAuth = getAuth(userCreationApp);
