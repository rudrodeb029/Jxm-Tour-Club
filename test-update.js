import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC4r9_2pCDHHLvozfGpRWPgVv8iwszH1TY",
  authDomain: "jxmtourclub-1747c.firebaseapp.com",
  projectId: "jxmtourclub-1747c",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testUpdate() {
  try {
    const docSnap = await getDoc(doc(db, 'matches', 'm1'));
    if (!docSnap.exists()) return;
    
    const m = docSnap.data();
    const cardId = 't1';
    const cardUpdates = { name: "Red Dragons 2" };
    
    const innerSections = (m.innerSections || []).map(c => c.id === cardId ? { ...c, ...cardUpdates } : c);
    const cleanInnerSections = JSON.parse(JSON.stringify(innerSections));
    
    await setDoc(doc(db, 'matches', 'm1'), { 
      innerSections: cleanInnerSections,
      team1: cleanInnerSections[0] || null,
      team2: cleanInnerSections[1] || null,
      team3: cleanInnerSections[2] || null
    }, { merge: true });
    
    console.log("Updated successfully in test script!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

testUpdate();
