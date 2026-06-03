import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC4r9_2pCDHHLvozfGpRWPgVv8iwszH1TY",
  authDomain: "jxmtourclub-1747c.firebaseapp.com",
  projectId: "jxmtourclub-1747c",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function readAll() {
  try {
    const querySnapshot = await getDocs(collection(db, "matches"));
    querySnapshot.forEach((doc) => {
      console.log(`=== Match ${doc.id} ===`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  } catch (error) {
    console.error("Error reading matches:", error);
  } finally {
    process.exit(0);
  }
}

readAll();
