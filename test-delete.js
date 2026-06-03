import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC4r9_2pCDHHLvozfGpRWPgVv8iwszH1TY",
  authDomain: "jxmtourclub-1747c.firebaseapp.com",
  projectId: "jxmtourclub-1747c",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkDelete() {
  try {
    const matchId = 'm1';
    const cardId = 't1';
    const docRef = doc(db, 'matches', matchId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      console.log("Match m1 DOES NOT EXIST");
      return;
    }
    
    const m = docSnap.data();
    const innerSections = (m.innerSections || []).filter(c => c.id !== cardId);
    
    console.log("Attempting to delete cardId:", cardId);
    await setDoc(doc(db, 'matches', matchId), { 
      innerSections,
      team1: innerSections[0] || null,
      team2: innerSections[1] || null,
      team3: innerSections[2] || null
    }, { merge: true });
    
    console.log("Successfully deleted card!");
  } catch (error) {
    console.error("Error deleting match card:", error);
  } finally {
    process.exit(0);
  }
}

checkDelete();
