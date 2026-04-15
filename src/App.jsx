import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInWithPopup,
    GoogleAuthProvider, 
    onAuthStateChanged, 
    signOut
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc,
    updateDoc,
    onSnapshot 
} from 'firebase/firestore';

// --- INITIALIZE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAt7roNCIyeOKjNHx7lZXJ3DFULmCak1uw",
  authDomain: "water-tracker-kita.firebaseapp.com",
  projectId: "water-tracker-kita",
  storageBucket: "water-tracker-kita.firebasestorage.app",
  messagingSenderId: "1065083698538",
  appId: "1:1065083698538:web:0198badb0d75388e4db913"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = 'water-tracker-kita';

export default function App() {
    // --- STATE ---
    const [user, setUser] = useState(null);
    
    // State alur loading
    const [authResolved, setAuthResolved] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [isManualLoggingIn, setIsManualLoggingIn] = useState(false);
    
    const [isUpdating, setIsUpdating] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [currentView, setCurrentView] = useState('home');
    
    const [userData, setUserData] = useState({
        goal: 1500,
        history: {}, 
        streakResetDate: null
    });
    
    const [showCalendar, setShowCalendar] = useState(false);
    const [calMonth, setCalMonth] = useState(new Date().getMonth());
    const [calYear, setCalYear] = useState(new Date().getFullYear());
    
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
    const customInputRef = useRef(null);

    const [toast, setToast] = useState({ show: false, message: '', isSuccess: true });

    // --- LOGICAL DATE HELPER ---
    const getLogicalDateStr = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    // --- AUTHENTICATION ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setAuthResolved(true); // Pengecekan auth awal selesai
        });
        return () => unsubscribe();
    }, []);

    // --- FIRESTORE SYNC ---
    useEffect(() => {
        if (!user) {
            setDataLoaded(false);
            return;
        }

        const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'tracker');
        
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
            }
            
            setTimeout(() => {
                setDataLoaded(true);
                setIsManualLoggingIn(false);
            }, 800);

        }, (error) => {
            console.error("Firestore sync error:", error);
            setIsUpdating(false);
            setDataLoaded(true);
            setIsManualLoggingIn(false);
        });

        return () => unsubscribe();
    }, [user]);

    // --- AUTO-FOCUS CUSTOM MODAL ---
    useEffect(() => {
        if (showCustomModal && customInputRef.current) {
            setTimeout(() => customInputRef.current.focus(), 100);
        }
    }, [showCustomModal]);

    // --- TOAST HELPER ---
    const showToastMsg = (message, isSuccess = true) => {
        setToast({ show: true, message, isSuccess });
        setTimeout(() => setToast({ show: false, message: '', isSuccess }), 3000);
    };

    // --- ACTIONS ---
    const handleLogin = async () => {
        setIsManualLoggingIn(true);
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
        } catch (error) {
            console.error("Login Error:", error);
            setIsManualLoggingIn(false);
            showToastMsg("Gagal login: " + error.message, false);
        }
    };
    
    const handleLogout = () => signOut(auth);

    const updateWater = async (amount) => {
        if (!user || isUpdating) return;
        const todayStr = getLogicalDateStr();
        const currentCount = userData.history[todayStr] || 0;
        
        let newCount = Math.max(0, Math.min(2000, currentCount + amount));
        if (newCount === currentCount) return; 

        setIsUpdating(true);
        try {
            const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'tracker');
            await updateDoc(userDocRef, {
                [`history.${todayStr}`]: newCount
            });
        } catch (error) {
            console.error("Error updating water:", error);
            setIsUpdating(false);
        }
    };

    const handleCustomSubmit = async (e) => {
        e.preventDefault();
        const amt = parseInt(customAmount);
        if (amt && !isNaN(amt) && amt > 0) {
            await updateWater(amt);
        }
        setShowCustomModal(false);
        setCustomAmount('');
    };

    const handleClaimReward = async () => {
        if (isClaiming) return;

        if (streakCount >= 7) { 
            setIsClaiming(true);
            try {
                const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'tracker');
                await setDoc(userDocRef, { streakResetDate: getLogicalDateStr() }, { merge: true });
                
                showToastMsg("Reward claimed! Streak reset.", true);
                
                const message = encodeURIComponent("Yay! I successfully completed my 7-day hydration streak! I'm ready to claim my Matcha reward 🍵✨");
                window.location.href = `https://wa.me/6281231223796?text=${message}`;
                
            } catch (error) {
                console.error("Error claiming reward:", error);
                showToastMsg("Failed to claim. Try again.", false);
            } finally {
                setIsClaiming(false);
            }
        } else {
            showToastMsg(`Streak is not full yet (needs 7 days)!`, false);
        }
    };

    // --- DERIVED DATA ---
    const todayStr = getLogicalDateStr();
    const currentCount = userData.history[todayStr] || 0;
    const isTodayGoalMet = currentCount >= userData.goal;
    const progress = Math.min((currentCount / userData.goal) * 100, 100);

    // --- STREAK CALC ---
    const streakCount = (() => {
        let currentStreak = 0;
        let checkDate = new Date();
        let safety = 0;
        
        while (safety < 180) {
            safety++;
            let str = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
            
            if (userData.streakResetDate && str <= userData.streakResetDate) break;

            if ((userData.history[str] || 0) >= userData.goal) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                if (str === getLogicalDateStr()) { 
                    checkDate.setDate(checkDate.getDate() - 1); 
                    continue; 
                }
                break;
            }
        }
        return currentStreak;
    })();

    const weekDays = (() => {
        const today = new Date();
        const sun = new Date(today);
        sun.setDate(sun.getDate() - sun.getDay()); 
        
        return Array.from({length: 7}).map((_, i) => {
            const d = new Date(sun);
            d.setDate(d.getDate() + i); 
            const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return { 
                name: d.toLocaleDateString('en-US', { weekday: 'short' }), 
                isHit: (userData.history[str] || 0) >= userData.goal 
            };
        });
    })();

    // --- CALENDAR LOGIC ---
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
    const renderCalendarGrid = () => {
        const firstDay = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const blanks = Array.from({length: firstDay}).map((_, i) => <div key={`blank-${i}`}></div>);
        const days = Array.from({length: daysInMonth}).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isHit = (userData.history[dateStr] || 0) >= userData.goal; 
            const isToday = dateStr === getLogicalDateStr();
            return (
                <div key={dayNum} className="flex justify-center items-center h-8">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full text-[13px] transition-all
                        ${isHit ? 'bg-[#007AFF] text-white shadow-md font-bold' : isToday ? 'bg-[#F2F2F7] text-[#1C1C1E] font-bold border border-gray-200' : 'text-[#1C1C1E]'}`}>
                        {dayNum}
                    </div>
                </div>
            );
        });
        return [...blanks, ...days];
    };

    // --- GLOBAL CSS INJECTION UNTUK ANTI-BOUNCE YANG AMAN ---
    const globalCss = `
        /* Safari Safe Anti-Bounce */
        html, body {
            overflow: hidden;
            overscroll-behavior: none;
            background-color: #FFFFFF;
            margin: 0;
            padding: 0;
        }
        @media (min-width: 640px) {
            html, body {
                background-color: #F2F2F7;
            }
        }
        #root {
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        /* Ijinkan area dalam aplikasi untuk scroll normal tanpa efek karet */
        main, .overflow-y-auto {
            touch-action: pan-y;
            overscroll-behavior-y: contain; 
        }
        * { -webkit-tap-highlight-color: transparent; user-select: none; } 
        .no-scrollbar::-webkit-scrollbar { display: none; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
        
        @keyframes float1 { 0%, 100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-12px) scale(1.05); } }
        @keyframes float2 { 0%, 100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-8px) scale(1.08); } }
        @keyframes float3 { 0%, 100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-15px) scale(0.95); } }
        @keyframes fillup { 0% { height: 0%; opacity: 0; } 5% { opacity: 1; } 100% { height: 60%; opacity: 1; } }
        .bubble-1 { animation: float1 4s ease-in-out infinite; }
        .bubble-2 { animation: float2 5s ease-in-out infinite 0.8s; }
        .bubble-3 { animation: float3 3.5s ease-in-out infinite 1.5s; }
        .water-fill { animation: fillup 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
    `;

    // ==========================================
    // 1. TAHAP PENGECEKAN AUTH AWAL (MINI SPLASH)
    // ==========================================
    // Supaya tidak blank putih saat Safari memuat, kita tampilkan logo kecil
    if (!authResolved) return (
        <div className="bg-white sm:bg-[#F2F2F7] fixed inset-0 w-full h-full flex items-center justify-center z-50">
            <style dangerouslySetInnerHTML={{ __html: globalCss }} />
            <div className="w-16 h-16 bg-gradient-to-br from-[#5AC8FA] to-[#007AFF] rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-2xl relative top-0.5">💧</span>
            </div>
        </div>
    );

    // ==========================================
    // 2. SPLASH SCREEN (Muncul saat login MANUAL ATAU memuat data dari Firebase)
    // ==========================================
    if (isManualLoggingIn || (user && !dataLoaded)) return (
        <div className="bg-white sm:bg-[#F2F2F7] fixed inset-0 w-full h-full flex items-center justify-center font-sans text-[#1C1C1E] antialiased z-50">
            <style dangerouslySetInnerHTML={{ __html: globalCss }} />
            <main className="bg-white w-full h-full sm:h-[844px] sm:max-w-[390px] sm:rounded-[3rem] flex flex-col items-center justify-center relative sm:shadow-2xl overflow-hidden">
                <div className="absolute top-[-5%] right-[-10%] w-[80vw] max-w-[400px] h-[80vw] max-h-[400px] bg-blue-100/40 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute bottom-[10%] left-[-10%] w-[60vw] max-w-[350px] h-[60vw] max-h-[350px] bg-cyan-100/40 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="w-24 h-24 bg-gradient-to-br from-[#5AC8FA] to-[#007AFF] rounded-[2rem] flex items-center justify-center shadow-[0_10px_30px_rgba(0,122,255,0.3)] animate-pulse z-10 mb-6">
                    <span className="text-4xl relative top-0.5">💧</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight text-[#1C1C1E] z-10">Silit Tracker</h1>
                <p className="text-[#8E8E93] text-sm font-medium z-10 mt-1">Fetching your hydration...</p>
            </main>
        </div>
    );

    // ==========================================
    // 3. LANDING PAGE (Jika belum login)
    // ==========================================
    if (!user) return (
        <div className="bg-white sm:bg-[#F2F2F7] fixed inset-0 w-full h-full flex items-center justify-center font-sans text-[#1C1C1E] selection:bg-blue-200 antialiased overflow-hidden sm:py-10">
            <style dangerouslySetInnerHTML={{ __html: globalCss }} />

            {/* Toast Khusus Landing Page */}
            <div className={`absolute top-10 left-1/2 -translate-x-1/2 z-[60] transition-all duration-500 ${toast.show ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <div className="bg-red-50 px-5 py-3 rounded-xl shadow-lg border border-red-200 flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <span className="text-[12px] font-bold text-red-700">{toast.message}</span>
                </div>
            </div>

            <main className="bg-white w-full h-full sm:h-[844px] sm:max-w-[390px] sm:rounded-[3rem] overflow-hidden flex flex-col relative sm:shadow-2xl sm:ring-1 sm:ring-black/5 mx-auto">
                <div className="absolute top-[-5%] right-[-10%] w-[80vw] max-w-[400px] h-[80vw] max-h-[400px] bg-blue-100/40 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute bottom-[10%] left-[-10%] w-[60vw] max-w-[350px] h-[60vw] max-h-[350px] bg-cyan-100/40 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="z-10 w-full h-full flex flex-col items-center py-10 px-8 relative">
                    <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full mt-4">
                        <div className="relative flex justify-center items-end w-full h-[240px]">
                            <div className="bubble-1 absolute left-[10%] bottom-[50%] w-10 h-10 bg-gradient-to-br from-[#5AC8FA] to-[#007AFF] rounded-full shadow-lg shadow-blue-200/50 flex items-center justify-center">
                                <span className="text-sm">💧</span>
                            </div>
                            <div className="bubble-2 absolute right-[15%] bottom-[40%] w-6 h-6 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full shadow-md shadow-blue-200/50"></div>
                            <div className="bubble-3 absolute left-[25%] bottom-[75%] w-4 h-4 bg-blue-200 rounded-full"></div>
                            <div className="bubble-1 absolute right-[25%] bottom-[70%] w-3 h-3 bg-cyan-200 rounded-full" style={{animationDelay: '2s'}}></div>

                            <div className="w-44 h-64 rounded-[3.5rem] p-2 bg-gradient-to-b from-[#F2F2F7] to-white shadow-[inset_0_2px_20px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden flex items-end">
                                <div className="water-fill w-full bg-gradient-to-t from-[#007AFF] via-[#148EFF] to-[#5AC8FA] relative rounded-[3rem] overflow-hidden shadow-[0_-8px_25px_rgba(0,122,255,0.3)]">
                                    <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white/40 to-transparent rounded-[100%] scale-150 -translate-y-1/2"></div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-white/10"></div>
                                </div>
                                <div className="absolute top-6 bottom-6 left-4 w-3 bg-gray-100/60 rounded-full pointer-events-none"></div>
                            </div>
                        </div>

                        <div className="text-center mt-2">
                            <h1 className="text-[40px] font-black tracking-tighter text-[#1C1C1E] leading-[1.1] mb-2">
                                Drink your water.<br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#007AFF] to-[#5AC8FA]">Don't be a dry silit</span>
                            </h1>
                        </div>

                        <div className="flex gap-3 w-full justify-center mt-2">
                            <div className="flex-1 bg-[#F2F2F7] rounded-[1.25rem] p-4 text-center border border-gray-100/50">
                                <p className="text-[22px] font-black text-[#007AFF] leading-none">1.5L</p>
                                <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider mt-2">Daily Goal</p>
                            </div>
                            <div className="flex-1 bg-[#F2F2F7] rounded-[1.25rem] p-4 text-center border border-gray-100/50">
                                <p className="text-[22px] font-black text-[#FF9500] leading-none">🔥 7</p>
                                <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider mt-2">Day Streak</p>
                            </div>
                            <div className="flex-1 bg-[#F2F2F7] rounded-[1.25rem] p-4 text-center border border-gray-100/50">
                                <p className="text-[22px] font-black text-[#34C759] leading-none">🍵</p>
                                <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider mt-2">Reward</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full shrink-0 pb-6 flex flex-col items-center mt-6">
                        <button 
                            onClick={handleLogin} 
                            className="group relative w-full py-4 bg-[#007AFF] hover:bg-[#0066CC] rounded-2xl font-bold text-white text-[15px] flex items-center justify-center gap-3 overflow-hidden transition-all active:scale-95 shadow-[0_10px_25px_rgba(0,122,255,0.3)]"
                        >
                            <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#fff"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
                            </svg>
                            <span className="relative z-10 tracking-wide">Continue with Google</span>
                        </button>
                        <p className="text-center text-[11px] text-[#C7C7CC] font-medium mt-4">Only for Silit & Kopet</p>
                    </div>
                </div>
            </main>
        </div>
    );

    // ==========================================
    // 4. MAIN APP SCREEN (Sudah Logged In & Load Data)
    // ==========================================
    return (
        <div className="bg-white sm:bg-[#F2F2F7] fixed inset-0 w-full h-full flex items-center justify-center font-sans text-[#1C1C1E] selection:bg-blue-200 antialiased overflow-hidden sm:py-10">
            <style dangerouslySetInnerHTML={{ __html: globalCss }} />

            <main className="bg-white w-full h-full sm:h-[844px] sm:max-w-[390px] sm:rounded-[3rem] overflow-hidden flex flex-col relative sm:shadow-2xl sm:ring-1 sm:ring-black/5 mx-auto">
                
                {/* TOAST */}
                <div className={`absolute left-1/2 -translate-x-1/2 z-[60] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${toast.show ? 'bottom-[120px] opacity-100 scale-100' : 'bottom-16 opacity-0 scale-95 pointer-events-none'}`}>
                    <div className="bg-white px-5 py-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center gap-3">
                        <span className="text-xl">{toast.isSuccess ? '🍵' : '⚠️'}</span>
                        <span className="text-[13px] font-bold text-[#1C1C1E] whitespace-nowrap">{toast.message}</span>
                    </div>
                </div>

                {/* CALENDAR MODAL */}
                <div className={`absolute inset-0 z-50 flex items-center justify-center transition-all duration-300 ${showCalendar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowCalendar(false)}></div>
                    <div className={`bg-white w-[90%] max-w-[340px] rounded-[2.5rem] p-6 shadow-2xl relative z-10 transform transition-all duration-300 ${showCalendar ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-[#007AFF] hover:bg-gray-100 active:scale-90 transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <h2 className="font-bold text-lg tracking-tight">
                                {new Date(calYear, calMonth).toLocaleString('default', { month: 'long' })} {calYear}
                            </h2>
                            <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-[#007AFF] hover:bg-gray-100 active:scale-90 transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center mb-4">
                            {['S','M','T','W','T','F','S'].map((d, i) => (
                                <span key={i} className="text-[11px] font-bold text-[#8E8E93] uppercase">{d}</span>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center">
                            {renderCalendarGrid()}
                        </div>
                        <button onClick={() => setShowCalendar(false)} className="w-full mt-6 py-3.5 bg-[#F2F2F7] text-[#1C1C1E] rounded-2xl font-bold active:scale-95 transition-all">
                            Done
                        </button>
                    </div>
                </div>

                {/* CUSTOM AMOUNT BOTTOM SHEET */}
                <div className={`absolute inset-0 z-50 flex flex-col justify-end transition-all duration-300 ${showCustomModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowCustomModal(false)}></div>
                    <div className={`bg-white w-full rounded-t-[2.5rem] p-8 pb-12 shadow-2xl relative z-10 transform transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${showCustomModal ? 'translate-y-0' : 'translate-y-full'}`}>
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                        <h3 className="text-xl font-bold text-[#1C1C1E] mb-6 text-center">Add Custom Amount</h3>
                        <form onSubmit={handleCustomSubmit} className="flex flex-col gap-4">
                            <div className="relative">
                                <input 
                                    ref={customInputRef}
                                    type="number" 
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    placeholder="200"
                                    disabled={isUpdating}
                                    className="w-full bg-[#F2F2F7] rounded-2xl px-6 py-4 text-3xl font-bold text-[#1C1C1E] text-center focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all disabled:opacity-50"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[#8E8E93] font-bold text-lg">ml</span>
                            </div>
                            <button 
                                type="submit" 
                                disabled={isUpdating}
                                className={`w-full py-4 bg-[#007AFF] text-white rounded-2xl font-bold transition-all text-[15px] mt-2 ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                            >
                                {isUpdating ? 'Adding...' : 'Add Water'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* HEADER */}
                <header className="pt-12 pb-4 px-8 z-30 bg-white/70 backdrop-blur-xl border-b border-gray-100/50 sticky top-0">
                    <div className="flex justify-between items-center h-14">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1E]">
                                {currentView === 'home' ? 'Silit Tracker App' : 'Streak'}
                            </h1>
                            <p className="text-[#8E8E93] text-[12px] font-medium flex items-center gap-1.5">
                                {(user.displayName?.split(' ')[0] || 'User').substring(0, 10)}'s Tracker
                                <span onClick={handleLogout} className="text-[#007AFF] cursor-pointer hover:underline">
                                    (Sign out)
                                </span>
                            </p>
                        </div>
                        <button 
                            onClick={() => setCurrentView(prev => prev === 'home' ? 'streak' : 'home')}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${currentView === 'home' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'bg-[#F2F2F7] text-[#8E8E93]'}`}
                        >
                            {currentView === 'home' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.5C7.58172 21.5 4 17.9183 4 13.5C4 9.61058 8.87326 3.89886 11.2335 1.3412C11.6421 0.898491 12.3579 0.898491 12.7665 1.3412C15.1267 3.89886 20 9.61058 20 13.5C20 17.9183 16.4183 21.5 12 21.5Z" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            )}
                        </button>
                    </div>
                </header>

                <div className="flex-1 relative overflow-hidden">
                    
                    {/* HOME VIEW */}
                    <div className={`absolute inset-0 w-full h-full overflow-y-auto no-scrollbar flex flex-col items-center pt-8 pb-32 px-6 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${currentView === 'home' ? 'translate-x-0 opacity-100 z-10' : '-translate-x-[30%] opacity-0 z-0 pointer-events-none'}`}>
                        
                        <div className="flex flex-col items-center text-center mb-8 w-full">
                            <div className="flex items-baseline space-x-1 justify-center w-full">
                                <span className="text-[72px] font-medium tracking-[-0.05em] text-[#1C1C1E] leading-none">{currentCount}</span>
                                <span className="text-xl font-medium tracking-tight text-[#8E8E93]">/ {userData.goal} ml</span>
                            </div>
                            <span className={`font-medium mt-4 text-[13px] px-5 py-2 rounded-full transition-all duration-500 ${isTodayGoalMet ? 'bg-green-100 text-green-700' : 'bg-[#F2F2F7] text-[#8E8E93]'}`}>
                                {isTodayGoalMet ? "Daily Goal Reached! 🎉" : `${userData.goal - currentCount} ml remaining`}
                            </span>
                        </div>

                        {/* Water Bottle */}
                        <div className="relative flex justify-center items-center mb-6 w-full">
                            <div className="w-48 h-72 rounded-[3.5rem] p-2 bg-gradient-to-b from-[#F2F2F7] to-white shadow-[inset_0_2px_20px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden flex items-end">
                                <div 
                                    className="w-full bg-gradient-to-t from-[#007AFF] via-[#148EFF] to-[#5AC8FA] relative rounded-[3rem] overflow-hidden transition-all duration-[1000ms] shadow-[0_-8px_25px_rgba(0,122,255,0.3)]"
                                    style={{ height: `${currentCount > 0 ? Math.max(progress, 4) : 0}%`, opacity: currentCount === 0 ? 0 : 1 }}
                                >
                                    <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white/40 to-transparent rounded-[100%] scale-150 -translate-y-1/2"></div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-white/10"></div>
                                </div>
                                <div className="absolute top-8 bottom-8 left-5 w-4 bg-white/50 rounded-full blur-[3px] pointer-events-none"></div>
                                <div className="absolute top-16 bottom-16 right-4 w-1.5 bg-white/30 rounded-full blur-[1.5px] pointer-events-none"></div>
                            </div>
                        </div>
                    </div>

                    {/* STREAK VIEW */}
                    <div className={`absolute inset-0 w-full h-full overflow-y-auto no-scrollbar flex flex-col items-center pt-8 pb-10 px-5 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${currentView === 'streak' ? 'translate-x-0 opacity-100 z-10' : 'translate-x-[100%] opacity-0 z-0 pointer-events-none'}`}>
                        
                        <div className="bg-white w-full rounded-[2.5rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col items-center text-center mb-8 relative transition-all">
                            <button 
                                onClick={() => setShowCalendar(true)}
                                className="absolute top-5 right-5 w-10 h-10 bg-[#F2F2F7] text-[#007AFF] rounded-full flex items-center justify-center hover:bg-[#E5E5EA] active:scale-90 transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </button>

                            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-5xl mb-4 transition-all duration-700 ${isTodayGoalMet ? 'bg-[#FF9500]/10 grayscale-0 opacity-100 scale-110' : 'bg-gray-100 grayscale opacity-40 scale-100'}`}>
                                🔥
                            </div>
                            <h2 className="text-[#8E8E93] text-[13px] font-bold tracking-widest uppercase mb-1">Your Streak</h2>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-7xl font-bold tracking-tighter text-[#1C1C1E]">{streakCount}</span>
                                <span className="text-xl font-bold text-[#1C1C1E]">{streakCount === 1 ? 'Day' : 'Days'}</span>
                            </div>
                            {!isTodayGoalMet && (
                                <p className="text-[#FF9500] text-[11px] font-bold mt-2 uppercase tracking-tight">Complete today to light up! ⚡️</p>
                            )}
                        </div>

                        <div className="w-full">
                            <h3 className="text-[#1C1C1E] font-bold text-lg mb-5 ml-2">This Week</h3>
                            <div className="bg-white rounded-[2.5rem] px-4 py-6 shadow-[0_5px_25px_rgba(0,0,0,0.03)] border border-gray-100 flex justify-between items-center">
                                {weekDays.map((day, idx) => (
                                    <div key={idx} className="flex flex-col items-center space-y-3">
                                        <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center transition-all duration-700 ${day.isHit ? 'bg-gradient-to-br from-[#5AC8FA] to-[#007AFF] shadow-lg shadow-blue-200' : 'bg-[#F2F2F7]'}`}>
                                            {day.isHit && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${day.isHit ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}>{day.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="w-full mt-5 flex flex-col items-center">
                            <button 
                                onClick={handleClaimReward} 
                                disabled={isClaiming || streakCount < 7} 
                                className={`w-full bg-white rounded-[2rem] p-4 shadow-[0_5px_20px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center justify-between transition-all ${(isClaiming || streakCount < 7) ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#34C759]/10 flex items-center justify-center text-[26px]">🍵</div>
                                    <div className="text-left">
                                        <h4 className="text-[#1C1C1E] font-bold text-[15px]">
                                            {isClaiming ? 'Claiming...' : 'Claim your reward'}
                                        </h4>
                                        <p className="text-[#8E8E93] text-[12px] font-medium mt-0.5">Keep your streak to unlock</p>
                                    </div>
                                </div>
                                <div className="text-[#C7C7CC] pr-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* FLOATING DOCK */}
                <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[4rem] z-40 flex justify-center items-center gap-7 transition-all duration-500 ease-in-out ${currentView === 'home' ? 'translate-y-0 opacity-100' : 'translate-y-40 opacity-0 pointer-events-none'}`}>
                    <button 
                        onClick={() => updateWater(-200)} 
                        disabled={isUpdating}
                        className={`w-14 h-14 bg-white shadow-sm text-[#007AFF] rounded-full flex items-center justify-center transition-all ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}`}
                    >
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                    </button>
                    
                    <button 
                        onClick={() => updateWater(200)} 
                        disabled={isUpdating}
                        className={`w-[80px] h-[80px] bg-gradient-to-b from-[#5AC8FA] to-[#007AFF] text-white rounded-full shadow-xl shadow-blue-300 flex items-center justify-center transition-all ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}`}
                    >
                        <svg className="h-11 w-11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    </button>

                    <button 
                        onClick={() => setShowCustomModal(true)} 
                        disabled={isUpdating}
                        className={`w-14 h-14 bg-white shadow-sm text-[#007AFF] rounded-full flex items-center justify-center transition-all ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}`}
                    >
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                </div>
            </main>
        </div>
    );
}