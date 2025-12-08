// lib/firebase.ts (게임판용 RTDB)
import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCKAEwUqTRwmgORUU-dU3BXHFWSDk7SIGs",
  authDomain: "netplay-badminton-yoon.firebaseapp.com",
  databaseURL: "https://netplay-badminton-yoon-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "netplay-badminton-yoon",
  storageBucket: "netplay-badminton-yoon.firebasestorage.app",
  messagingSenderId: "886512443470",
  appId: "1:886512443470:web:650af2accfe424697e631f"
};

// 🔥 RTDB는 firebaseConfig로 초기화해야 함
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// 🔥 export rtdb
export const rtdb = getDatabase(app);
