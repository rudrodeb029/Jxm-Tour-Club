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

async function check() {
  const querySnapshot = await getDocs(collection(db, "matches"));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    console.log("Match ID:", doc.id);
    console.log("  Name:", data.name);
    console.log("  Status:", data.status);
    console.log("  Time:", data.time);
    if (data.innerSections) {
      console.log("  Inner sections:");
      data.innerSections.forEach(c => {
        console.log(`    Card ID: ${c.id}, Name: ${c.name}, StartTime: ${c.startTime}, liveDuration: ${c.liveDuration}`);
      });
    }
    console.log("---------------------------------------");
  });
}

check().catch(console.error);
