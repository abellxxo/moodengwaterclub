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
    onSnapshot
} from 'firebase/firestore';
import { auth, db, APP_ID } from './firebase';

// --- LOGICAL DATE HELPER ---
export const getLogicalDateStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

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

    // --- STREAK CALC (memoized) ---
    const streakCount = useMemo(() => {
        let currentStreak = 0;
        let checkDate = new Date();
        let safety = 0;
        const today = getLogicalDateStr();

        while (safety < 180) {
            safety++;
            const str = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

            if (userData.streakResetDate && str <= userData.streakResetDate) break;

            if ((userData.history[str] || 0) >= userData.goal) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                if (str === today) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    continue;
                }
                break;
            }
        }
        return currentStreak;
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
                await setDoc(userDocRef, { streakResetDate: getLogicalDateStr() }, { merge: true });
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
    };
}
