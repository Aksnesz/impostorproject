import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAb7cnbzzziujlyOXt-5GCmaIwbqlZUxOM",
  authDomain: "impostorgame-8de83.firebaseapp.com",
  databaseURL: "https://impostorgame-8de83-default-rtdb.firebaseio.com",
  projectId: "impostorgame-8de83",
  storageBucket: "impostorgame-8de83.firebasestorage.app",
  messagingSenderId: "264689751500",
  appId: "1:264689751500:web:3c11fa77d819b8b99cb969",
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
