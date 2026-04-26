import { useState, useEffect, useRef, useMemo } from 'react';
import {
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
} from 'firebase/auth';
import {
    doc,
    setDoc,
    updateDoc,
    onSnapshot,
    increment
} from 'firebase/firestore';
import { auth, db, APP_ID, messaging, getToken, onMessage } from './firebase';
import { getLogicalDateStr, calculateStreak } from './streakUtils';
import { ensureProfile } from './friendsService';

// Re-export for backward compatibility (canonical source is streakUtils.js)
export { getLogicalDateStr } from './streakUtils';

// --- MAIN STATE HOOK ---
export function useAppState() {
    // Auth
    const [user, setUser] = useState(null);
    const [authResolved, setAuthResolved] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [isManualLoggingIn, setIsManualLoggingIn] = useState(false);

    // UI
    const [isUpdating, setIsUpdating] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [currentView, setCurrentView] = useState('home');

    // Data
    const [userData, setUserData] = useState({ goal: 1500, history: {}, streakResetDate: null });

    // Calendar
    const [showCalendar, setShowCalendar] = useState(false);
    const [calMonth, setCalMonth] = useState(new Date().getMonth());
    const [calYear, setCalYear] = useState(new Date().getFullYear());

    // Custom amount modal
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customAmount, setCustomAmount] = useState('');

    // Toast & reward
    const [toast, setToast] = useState({ show: false, message: '', isSuccess: true });
    const [showRewardModal, setShowRewardModal] = useState(false);

    // Refs
    const customInputRef = useRef(null);
    const toastTimeoutRef = useRef(null);

    // --- AUTHENTICATION ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setAuthResolved(true);
        });
        return () => unsubscribe();
    }, []);

    // --- AUTO-CREATE PROFILE ON LOGIN ---
    useEffect(() => {
        if (user) {
            ensureProfile(user).catch(err => {
                console.error('Profile creation error:', err);
            });
        }
    }, [user]);

    // --- CLEANUP OLD SERVICE WORKERS ---
    // Unregister any SW that is NOT our canonical firebase-messaging-sw.js
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const reg of registrations) {
                    const scriptURL = reg.active?.scriptURL || '';
                    if (scriptURL && !scriptURL.includes('firebase-messaging-sw.js')) {
                        reg.unregister().then(() => {
                            console.log('[SW] Unregistered non-canonical SW:', scriptURL);
                        });
                    }
                }
            });
        }
    }, []);

    // --- PUSH NOTIFICATION ---
    const [notifPermission, setNotifPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );

    const registerFCMToken = async () => {
        if (!user || !messaging) return;
        try {
            const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('[SW] Registration successful. Waiting for ready state...');
            await navigator.serviceWorker.ready; // IMPORTANT: wait for SW to be ready on iOS
            console.log('[SW] Ready state reached. Requesting FCM token...');

            const currentToken = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: swReg
            });

            if (currentToken) {
                console.log('✅ FCM Token generated successfully:', currentToken);
                const tokenDocRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'fcmToken');
                await setDoc(tokenDocRef, { token: currentToken, updatedAt: new Date().toISOString() }, { merge: true });
                console.log('✅ FCM Token saved to Firestore (users/' + user.uid + '/data/fcmToken)');
            } else {
                console.warn('⚠️ No FCM token returned. Ensure permission is granted.');
            }
        } catch (err) {
            console.error('❌ FCM token registration failed! Error:', err.message || err);
            console.error(err);
        }
    };

    // Called from a button tap (required for iOS)
    const requestNotificationPermission = async () => {
        if (!messaging) {
            showToastMsg('Push notifications not supported', false);
            return;
        }
        try {
            const permission = await Notification.requestPermission();
            setNotifPermission(permission);
            if (permission === 'granted') {
                await registerFCMToken();
                showToastMsg('🔔 Notifications enabled!', true);
            } else {
                showToastMsg('Notification permission denied', false);
            }
        } catch (err) {
            console.error('Notification permission error:', err);
            showToastMsg('Failed to enable notifications', false);
        }
    };

    // Auto-register if permission already granted (desktop revisit)
    useEffect(() => {
        if (!user || !messaging) return;
        // Safely check Notification object because it might be undefined on some older iOS without PWA installed
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            registerFCMToken();
        }

        // Handle foreground messages
        const unsubscribeMsg = onMessage(messaging, (payload) => {
            console.log('Foreground message:', payload);
            const title = payload.notification?.title || 'Water Reminder';
            const body = payload.notification?.body || '';
            showToastMsg(`${title}: ${body}`, true);
        });

        return () => unsubscribeMsg();
    }, [user]);

    // --- FIRESTORE SYNC ---
    useEffect(() => {
        if (!user) {
            setDataLoaded(false);
            return;
        }

        const userDocRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'tracker');

        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const missing = {};
                if (data.goal === undefined) missing.goal = 1500;
                if (data.streakResetDate === undefined) missing.streakResetDate = null;
                if (Object.keys(missing).length > 0) {
                    setDoc(userDocRef, missing, { merge: true });
                }
                setUserData({ goal: 1500, history: {}, streakResetDate: null, ...data });
                setIsUpdating(false);
            } else {
                const initialData = { goal: 1500, history: {}, streakResetDate: null };
                setDoc(userDocRef, initialData);
                setUserData(initialData);
                setIsUpdating(false);
            }

            setTimeout(() => {
                setDataLoaded(true);
                setIsManualLoggingIn(false);
            }, 800);
        }, (error) => {
            console.error('Firestore sync error:', error);
            setIsUpdating(false);
            setDataLoaded(true);
            setIsManualLoggingIn(false);
        });

        return () => unsubscribe();
    }, [user]);

    // --- AUTO-FOCUS CUSTOM MODAL ---
    useEffect(() => {
        if (showCustomModal) {
            const timer = setTimeout(() => {
                if (customInputRef.current) customInputRef.current.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [showCustomModal]);

    // --- TOAST CLEANUP ON UNMOUNT ---
    useEffect(() => {
        return () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); };
    }, []);

    // --- DYNAMIC PWA THEME COLOR ---
    useEffect(() => {
        const metaThemeColor = document.getElementById('theme-color-meta');
        if (metaThemeColor) {
            // Jika sedag loading (splash), atau login, warnanya putih (#FFFFFF)
            // Jika tidak login, di landing page pakainya pink (#FDE8ED)
            // Jika login dan masuk app (home/streak), putih (#FFFFFF)
            if (!authResolved || isManualLoggingIn || (user && !dataLoaded)) {
                metaThemeColor.setAttribute("content", "#FFFFFF");
            } else if (!user) {
                metaThemeColor.setAttribute("content", "#FDE8ED");
            } else {
                metaThemeColor.setAttribute("content", "#FFFFFF");
            }
        }
    }, [user, authResolved, dataLoaded, isManualLoggingIn]);

    // --- TOAST HELPER ---
    const showToastMsg = (message, isSuccess = true) => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToast({ show: true, message, isSuccess });
        toastTimeoutRef.current = setTimeout(
            () => setToast({ show: false, message: '', isSuccess: true }),
            3000
        );
    };

    // --- DERIVED DATA ---
    const todayStr = getLogicalDateStr();
    const currentCount = userData.history[todayStr] || 0;
    const isTodayGoalMet = currentCount >= userData.goal;
    const progress = Math.min((currentCount / userData.goal) * 100, 100);

    // --- STREAK CALC (memoized, uses shared utility) ---
    const streakCount = useMemo(() => {
        return calculateStreak(userData.history, userData.goal, userData.streakResetDate);
    }, [userData.history, userData.goal, userData.streakResetDate]);

    // --- WEEK DAYS (memoized) ---
    const weekDays = useMemo(() => {
        const today = new Date();
        const sun = new Date(today);
        sun.setDate(sun.getDate() - sun.getDay());

        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(sun);
            d.setDate(d.getDate() + i);
            const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return {
                name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                isHit: (userData.history[str] || 0) >= userData.goal
            };
        });
    }, [userData.history, userData.goal]);

    // --- CALENDAR NAVIGATION ---
    const handlePrevMonth = () => {
        const d = new Date(calYear, calMonth - 1, 1);
        setCalMonth(d.getMonth());
        setCalYear(d.getFullYear());
    };
    const handleNextMonth = () => {
        const d = new Date(calYear, calMonth + 1, 1);
        setCalMonth(d.getMonth());
        setCalYear(d.getFullYear());
    };

    // --- ACTIONS ---
    const handleLogin = async () => {
        setIsManualLoggingIn(true);
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
        } catch (error) {
            console.error('Login Error:', error);
            setIsManualLoggingIn(false);
            showToastMsg('Gagal login: ' + error.message, false);
        }
    };

    const handleLogout = () => {
        signOut(auth);
        setCurrentView('home');
        setShowCalendar(false);
        setShowCustomModal(false);
        setShowRewardModal(false);
        setCustomAmount('');
        setIsUpdating(false);
        setIsClaiming(false);
    };

    const updateWater = async (amount) => {
        if (!user || isUpdating) return;
        const today = getLogicalDateStr();
        const count = userData.history[today] || 0;
        const newCount = Math.max(0, Math.min(2000, count + amount));
        if (newCount === count) return;

        setIsUpdating(true);
        try {
            const userDocRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'tracker');
            await updateDoc(userDocRef, { [`history.${today}`]: newCount });
        } catch (error) {
            console.error('Error updating water:', error);
            setIsUpdating(false);
        }
    };

    const handleCustomSubmit = async (e) => {
        e.preventDefault();
        const amt = parseInt(customAmount);
        if (amt && !isNaN(amt) && amt > 0) await updateWater(amt);
        setShowCustomModal(false);
        setCustomAmount('');
    };

    const handleClaimReward = async () => {
        if (isClaiming) return;

        if (streakCount >= 7) {
            setIsClaiming(true);
            try {
                const userDocRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'tracker');
                await setDoc(userDocRef, { matchaClaimed: increment(1) }, { merge: true });
                showToastMsg('Reward claimed! Streak reset.', true);
                const message = encodeURIComponent("Yay! I successfully completed my 7-day hydration streak! I'm ready to claim my Matcha reward 🍵✨");
                window.open(`https://wa.me/6281231223796?text=${message}`, '_blank', 'noopener,noreferrer');
            } catch (error) {
                console.error('Error claiming reward:', error);
                showToastMsg('Failed to claim. Try again.', false);
            } finally {
                setIsClaiming(false);
            }
        } else {
            setShowRewardModal(true);
        }
    };

    return {
        // Auth state
        user, authResolved, dataLoaded, isManualLoggingIn,
        // UI state
        isUpdating, isClaiming, currentView, setCurrentView,
        // Data
        userData, toast,
        // Derived
        todayStr, currentCount, isTodayGoalMet, progress, streakCount, weekDays,
        // Calendar
        showCalendar, setShowCalendar, calMonth, calYear, handlePrevMonth, handleNextMonth,
        // Custom modal
        showCustomModal, setShowCustomModal, customAmount, setCustomAmount, customInputRef,
        // Reward modal
        showRewardModal, setShowRewardModal,
        // Actions
        handleLogin, handleLogout, updateWater, handleCustomSubmit, handleClaimReward, showToastMsg,
        // Notifications
        notifPermission, requestNotificationPermission,
    };
}
