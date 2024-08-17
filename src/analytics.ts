import { Analytics as FirebaseAnalytics, getAnalytics, logEvent } from "firebase/analytics";
import { initializeApp } from "firebase/app";

let analytics: FirebaseAnalytics;

const Analytics = {
    init: () => {
        const firebaseConfig = {
            apiKey: "AIzaSyDJ7z038L1ms25dsrZ5hphVmCe_OL9S3LI",
            authDomain: "garbage-45e30.firebaseapp.com",
            projectId: "garbage-45e30",
            storageBucket: "garbage-45e30.appspot.com",
            messagingSenderId: "1040442836311",
            appId: "1:1040442836311:web:51105bb254840dacbaea12",
            measurementId: "G-CE3CXV66CP"
        };

        const app = initializeApp(firebaseConfig);
        analytics = getAnalytics(app);
    },
    logEvent: (event: string) => {
        logEvent(analytics, event);
    },
};


export default Analytics;