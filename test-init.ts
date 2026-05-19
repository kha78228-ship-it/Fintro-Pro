import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const app = initializeApp({});
// how many arguments does initializeFirestore take?
const db = initializeFirestore(app, {}, "my-db");
