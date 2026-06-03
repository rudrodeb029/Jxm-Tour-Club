import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC4r9_2pCDHHLvozfGpRWPgVv8iwszH1TY",
  authDomain: "jxmtourclub-1747c.firebaseapp.com",
  projectId: "jxmtourclub-1747c",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkMatches() {
  try {
    const docSnap = await getDoc(doc(db, 'matches', 'm1'));
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log(JSON.stringify(data.innerSections.map(s => s.name), null, 2));
    } else {
      console.log("m1 not found");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkMatches();
