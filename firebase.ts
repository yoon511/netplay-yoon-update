// firebase.ts - 통합 Firebase 설정 (Firestore + Realtime Database)
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAmm0b680XyZ4xyC5GksfvaebEv1ysEDRI",
  authDomain: "netplayvote.firebaseapp.com",
  projectId: "netplayvote",
  storageBucket: "netplayvote.appspot.com",
  messagingSenderId: "998276168124",
  appId: "1:998276168124:web:d3fd43b7b096629e50d3b9",
  measurementId: "G-4FS9ZF1HHH",
  // Realtime Database URL
  // ⚠️ netplayvote 프로젝트에 Realtime Database가 활성화되어 있지 않아서
  // 기존 프로젝트의 databaseURL을 사용합니다.
  // 완전한 통합을 위해서는 netplayvote 프로젝트에 Realtime Database를 활성화하고
  // 올바른 URL로 변경하세요.
  databaseURL: "https://netplay-badminton-yoon-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Firebase 초기화
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Firestore (투표, 출석 등)
export const db = getFirestore(app);

// Realtime Database (게임판 실시간 데이터)
export const rtdb = getDatabase(app);
