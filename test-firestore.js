import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC4r9_2pCDHHLvozfGpRWPgVv8iwszH1TY",
  authDomain: "jxmtourclub-1747c.firebaseapp.com",
  projectId: "jxmtourclub-1747c",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkMatches() {
  try {
    const docRef = doc(db, 'matches', 'm1');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("Match m1 exists!");
      console.log(JSON.stringify(docSnap.data(), null, 2));
    } else {
      console.log("Match m1 DOES NOT EXIST in Firestore!");
    }
  } catch (error) {
    console.error("Error reading matches:", error);
  }
}

checkMatches();
