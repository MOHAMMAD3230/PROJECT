// Firebase web configuration. These values identify your Firebase project and are
// expected to be present in browser code. Do not put service-account credentials here.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCknmnM8ognAsRt7KFIhSp3MkiyTqJIxwk",
  authDomain: "fir-rtc-96b0b.firebaseapp.com",
  projectId: "fir-rtc-96b0b",
  storageBucket: "fir-rtc-96b0b.firebasestorage.app",
  messagingSenderId: "737718134671",
  appId: "1:737718134671:web:7f3212b20de0480e1f8dfa",
  measurementId: "G-G6PNP9RDE7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
