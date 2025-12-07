// firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAmm0b680XyZ4xyC5GksfvaebEv1ysEDRI",
  authDomain: "netplayvote.firebaseapp.com",
  projectId: "netplayvote",
  storageBucket: "netplayvote.firebasestorage.app",
  messagingSenderId: "998276168124",
  appId: "1:998276168124:web:d3fd43b7b096629e50d3b9",
  measurementId: "G-4FS9ZF1HHH"
};

// 위 값들은 Firebase 콘솔 > 프로젝트 설정 > Web 앱 설정에서 복붙해서 넣으면 돼

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
