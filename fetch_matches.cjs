const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyC4r9_2pCDHHLvozfGpRWPgVv8iwszH1TY",
  authDomain: "jxmtourclub-1747c.firebaseapp.com",
  databaseURL: "https://jxmtourclub-1747c-default-rtdb.firebaseio.com",
  projectId: "jxmtourclub-1747c",
  storageBucket: "jxmtourclub-1747c.firebasestorage.app",
  messagingSenderId: "194765747449",
  appId: "1:194765747449:web:36de7e15e228703d651e28"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchMatches() {
  try {
    const snapshot = await getDocs(collection(db, "matches"));
    const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(JSON.stringify(matches, null, 2));
  } catch (err) {
    console.error(err);
  }
}

fetchMatches();
