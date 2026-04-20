import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, get } from 'firebase/database';

// ============================================================
// SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com
// 2. Click "Create a project" (name it "lets-go-for-that")
// 3. Skip Google Analytics when asked
// 4. In the project, click "Build" > "Realtime Database"
// 5. Click "Create Database", choose your region, start in TEST MODE
// 6. Go to Project Settings (gear icon) > General > scroll to "Your apps"
// 7. Click the web icon (</>), register app name "lgft"
// 8. Copy the firebaseConfig values below
// 9. Replace the placeholder values with your actual values
//
// IMPORTANT: After 30 days, update your database rules to:
// {
//   "rules": {
//     ".read": true,
//     ".write": true
//   }
// }
// (Go to Realtime Database > Rules tab)
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyAkhN6C5FGbVGxq0XkEsesrHj_dKonWlCE",
  authDomain: "let-s-go-for-that.firebaseapp.com",
  databaseURL: "https://let-s-go-for-that-default-rtdb.firebaseio.com",
  projectId: "let-s-go-for-that",
  storageBucket: "let-s-go-for-that.firebasestorage.app",
  messagingSenderId: "392067357298",
  appId: "1:392067357298:web:a12ee9cc95604049d180eb"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Sanitize keys for Firebase (no . # $ [ ] /)
function cleanKey(key) {
  return key.replace(/[.#$\[\]\/]/g, '_');
}

export async function fbGet(key) {
  try {
    const snapshot = await get(ref(db, 'data/' + cleanKey(key)));
    if (snapshot.exists()) return snapshot.val();
    return null;
  } catch (e) {
    console.error('fbGet error:', key, e);
    return null;
  }
}

export async function fbSet(key, value) {
  try {
    await set(ref(db, 'data/' + cleanKey(key)), value);
  } catch (e) {
    console.error('fbSet error:', key, e);
  }
}

// Real-time listener — calls callback whenever data changes
export function fbListen(key, callback) {
  const dbRef = ref(db, 'data/' + cleanKey(key));
  const unsub = onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('fbListen error:', key, error);
  });
  return unsub;
}
