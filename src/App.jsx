import React, { useEffect, useState, useRef } from 'react';
import { useAppState } from './AppContext';
import Confetti from 'react-confetti';
import { useMeasure } from 'react-use';
import { globalCss } from './constants';
import SplashScreen from './components/SplashScreen';
import LandingPage from './components/LandingPage';
import CalendarModal from './components/CalendarModal';
import CustomAmountSheet from './components/CustomAmountSheet';
import RewardModal from './components/RewardModal';
import HomeView from './components/HomeView';
import StreakView from './components/StreakView';
import FriendsView from './components/FriendsView';
import InvitePage from './components/InvitePage';
import WeeklyDataView from './components/WeeklyDataView';

export default function App() {
    const s = useAppState();
    const [mainRef, { width, height }] = useMeasure();
    const [showConfetti, setShowConfetti] = useState(false);
    const [confettiKey, setConfettiKey] = useState(0);
    const prevCountRef = useRef(s.currentCount);
    const isReadyForConfetti = useRef(false);

    useEffect(() => {
        if (s.dataLoaded) {
            if (isReadyForConfetti.current) {
                if (s.currentCount >= s.userData.goal && prevCountRef.current < s.userData.goal) {
                    setShowConfetti(true);
                    setConfettiKey(prev => prev + 1);
                    const tmr = setTimeout(() => setShowConfetti(false), 7000);
                    return () => clearTimeout(tmr);
                }
            } else {
                isReadyForConfetti.current = true;
            }
            prevCountRef.current = s.currentCount;
        }
    }, [s.currentCount, s.userData.goal, s.dataLoaded]);

    // ── URL-based routing ──────────────────────────────────
    const path = window.location.pathname;
    let inviteCode = null;
    const pathParts = path.split('/').filter(Boolean);
    if (pathParts[0] === 'invite' && pathParts[1]) {
        inviteCode = pathParts[1];
    }

    // Auto-navigate to friends view if URL is /friends
    useEffect(() => {
        if (path === '/friends' && s.user && s.dataLoaded) {
            s.setCurrentView('friends');
            window.history.replaceState({}, '', '/');
        }
    }, [path, s.user, s.dataLoaded]);

    // Handle /invite/[code] route — renders its own page with independent auth handling
    if (inviteCode) {
        return (
            <InvitePage
                code={inviteCode}
                user={s.user}
                authResolved={s.authResolved}
                handleLogin={s.handleLogin}
                setCurrentView={s.setCurrentView}
            />
        );
    }

    // 1. Waiting for Firebase Auth to resolve
    if (!s.authResolved) return <SplashScreen type="auth" />;

    // 2. Logging in or loading Firestore data
    if (s.isManualLoggingIn || (s.user && !s.dataLoaded)) return <SplashScreen type="loading" />;

    // 3. Not logged in → show landing
    if (!s.user) return <LandingPage toast={s.toast} handleLogin={s.handleLogin} />;

    // 4. Logged in → main app
    // Render the main app container with sliding views (Moods/Friends handled via transition inside)

    return (
        <div className="bg-[#ffffff] sm:bg-[#EAB0BE] fixed inset-0 w-full h-full flex items-center justify-center font-sans text-[#1C1C1E] selection:bg-[#B8E9F3] antialiased overflow-hidden sm:py-10">
            <style dangerouslySetInnerHTML={{ __html: globalCss }} />

            <main ref={mainRef} className="bg-[#ffffff] w-full h-full sm:h-[844px] sm:max-w-[390px] sm:rounded-[3rem] overflow-hidden flex flex-col relative sm:shadow-2xl sm:ring-1 sm:ring-[#EAB0BE]/30 mx-auto">
                {/* PREMIUM MESH GRADIENT BACKGROUND */}
                <div className="absolute top-[-5%] left-[-15%] w-[90vw] h-[90vw] bg-[#B8E9F3]/30 rounded-full blur-[120px] pointer-events-none z-0"></div>
                <div className="absolute top-[15%] right-[-20%] w-[70vw] h-[70vw] bg-[#EAB0BE]/25 rounded-full blur-[100px] pointer-events-none z-0"></div>
                <div className="absolute top-[40%] left-[10%] w-[60vw] h-[60vw] bg-[#E0BBE4]/20 rounded-full blur-[130px] pointer-events-none z-0"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[85vw] h-[85vw] bg-[#EAB0BE]/35 rounded-full blur-[120px] pointer-events-none z-0"></div>
                <div className="absolute bottom-[10%] left-[-20%] w-[75vw] h-[75vw] bg-[#B8E9F3]/30 rounded-full blur-[110px] pointer-events-none z-0"></div>
                <div className="absolute top-[25%] left-[25%] w-[40vw] h-[40vw] bg-[#FFF1E6]/40 rounded-full blur-[150px] pointer-events-none z-0"></div>

                {showConfetti && width > 0 && (
                    <div className="absolute inset-0 pointer-events-none z-[99999] flex justify-center">
                        <Confetti
                            key={confettiKey}
                            width={width}
                            height={height}
                            recycle={false}
                            numberOfPieces={800}
                            gravity={0.12}
                            initialVelocityY={35}
                            colors={['#B8E9F3', '#6ED8EA', '#EAB0BE', '#ffffff', '#FFD700', '#FF69B4']}
                        />
                    </div>
                )}

                {/* TOAST */}
                <div className={`absolute left-1/2 -translate-x-1/2 z-[60] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${s.toast.show ? 'bottom-[120px] opacity-100 scale-100' : 'bottom-16 opacity-0 scale-95 pointer-events-none'}`}>
                    <div className="bg-white px-5 py-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center gap-3">
                        <span className="text-xl">{s.toast.isSuccess ? '🍵' : '⚠️'}</span>
                        <span className="text-[13px] font-bold text-[#1C1C1E] whitespace-nowrap">{s.toast.message}</span>
                    </div>
                </div>

                {/* MODALS */}
                <CalendarModal
                    show={s.showCalendar}
                    onClose={() => s.setShowCalendar(false)}
                    calMonth={s.calMonth}
                    calYear={s.calYear}
                    userData={s.userData}
                    handlePrevMonth={s.handlePrevMonth}
                    handleNextMonth={s.handleNextMonth}
                />
                <CustomAmountSheet
                    show={s.showCustomModal}
                    onClose={() => s.setShowCustomModal(false)}
                    customAmount={s.customAmount}
                    setCustomAmount={s.setCustomAmount}
                    handleCustomSubmit={s.handleCustomSubmit}
                    isUpdating={s.isUpdating}
                    customInputRef={s.customInputRef}
                />
                <RewardModal
                    show={s.showRewardModal}
                    onClose={() => s.setShowRewardModal(false)}
                    streakCount={s.streakCount}
                    matchaClaimed={s.userData.matchaClaimed || 0}
                />

                {/* HEADER */}
                <header className="pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 z-30 bg-transparent sticky top-0 transition-all duration-500">
                    <div className="flex justify-between items-center h-14">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1E]">
                                {s.currentView === 'home' ? 'Moodeng Water'
                                    : s.currentView === 'streak' ? 'Streak'
                                    : s.currentView === 'weeklyData' ? 'Weekly Data'
                                    : 'Moods'}
                            </h1>
                            <p className="text-[#8E8E93] text-[12px] font-medium flex items-center gap-1.5">
                                {(s.user.displayName?.split(' ')[0] || 'User').substring(0, 10)}'s Tracker
                                <span onClick={s.handleLogout} className="text-[#6ED8EA] cursor-pointer hover:underline">
                                    (Sign out)
                                </span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Weekly Data — X goes back to streak */}
                            {s.currentView === 'weeklyData' ? (
                                <button
                                    onClick={() => s.setCurrentView('streak')}
                                    className="w-10 h-10 rounded-full bg-[#F2F2F7] text-[#8E8E93] flex items-center justify-center active:scale-90 transition-all"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            ) : (
                                <>
                                    {s.notifPermission !== 'granted' && (
                                        <button
                                            onClick={s.requestNotificationPermission}
                                            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 bg-[#EAB0BE]/10 text-[#EAB0BE] animate-pulse"
                                            title="Enable notifications"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                            </svg>
                                        </button>
                                    )}
                                    {/* Moods vs Add Mood button */}
                                    {s.currentView === 'friends' ? (
                                        <button
                                            onClick={() => document.dispatchEvent(new CustomEvent('showAddMoodSheet'))}
                                            className="w-10 h-10 rounded-full bg-[#4a90d9] text-white flex items-center justify-center shadow-md shadow-[#4a90d9]/30 active:scale-90 transition-all font-bold text-xl pb-1"
                                        >
                                            +
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => s.setCurrentView('friends')}
                                            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 bg-[#F2F2F7] text-[#8E8E93] hover:text-[#4a90d9]"
                                            title="Moods"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => s.setCurrentView(prev => prev === 'home' ? 'streak' : 'home')}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${s.currentView === 'home' ? 'bg-[#6ED8EA]/10 text-[#6ED8EA]' : 'bg-[#F2F2F7] text-[#8E8E93]'}`}
                                    >
                                        {s.currentView === 'home' ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 21.5C7.58172 21.5 4 17.9183 4 13.5C4 9.61058 8.87326 3.89886 11.2335 1.3412C11.6421 0.898491 12.3579 0.898491 12.7665 1.3412C15.1267 3.89886 20 9.61058 20 13.5C20 17.9183 16.4183 21.5 12 21.5Z" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* VIEWS (sliding) */}
                <div className="flex-1 relative overflow-hidden">

                    {/* HOME */}
                    <div className={`absolute inset-0 w-full h-full overflow-y-auto no-scrollbar flex flex-col items-center pt-8 pb-32 px-6 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${s.currentView === 'home' ? 'translate-x-0 opacity-100 z-10' : '-translate-x-[30%] opacity-0 z-0 pointer-events-none'}`}>
                        <HomeView
                            currentCount={s.currentCount}
                            userData={s.userData}
                            isTodayGoalMet={s.isTodayGoalMet}
                            progress={s.progress}
                            weekDays={s.weekDays}
                            streakCount={s.streakCount}
                        />
                    </div>

                    {/* STREAK */}
                    <div className={`absolute inset-0 w-full h-full overflow-y-auto no-scrollbar flex flex-col items-center pt-8 pb-10 px-6 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${s.currentView === 'streak' ? 'translate-x-0 opacity-100 z-10' : 'translate-x-[100%] opacity-0 z-0 pointer-events-none'}`}>
                        <StreakView
                            streakCount={s.streakCount}
                            isTodayGoalMet={s.isTodayGoalMet}
                            weekDays={s.weekDays}
                            isClaiming={s.isClaiming}
                            handleClaimReward={s.handleClaimReward}
                            setShowCalendar={s.setShowCalendar}
                            onShowWeeklyData={() => s.setCurrentView('weeklyData')}
                            matchaClaimed={s.userData.matchaClaimed || 0}
                        />
                    </div>

                    {/* WEEKLY DATA */}
                    <div className={`absolute inset-0 w-full h-full overflow-y-auto no-scrollbar flex flex-col items-center pt-4 pb-10 px-6 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${s.currentView === 'weeklyData' ? 'translate-x-0 opacity-100 z-10' : 'translate-x-[100%] opacity-0 z-0 pointer-events-none'}`}>
                        <WeeklyDataView
                            history={s.userData.history}
                            goal={s.userData.goal}
                        />
                    </div>

                    {/* MOODS */}
                    <div className={`absolute inset-0 w-full h-full flex flex-col transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${s.currentView === 'friends' ? 'translate-x-0 opacity-100 z-20 pointer-events-auto' : 'translate-x-[100%] opacity-0 z-0 pointer-events-none'}`}>
                        <div className="absolute inset-0 right-0 w-[40vw] max-w-[200px] h-full bg-[#EAB0BE]/10 rounded-l-full blur-[80px] pointer-events-none z-0"></div>
                        <div className="relative z-10 w-full h-full flex flex-col pt-4">
                            <FriendsView onBack={() => s.setCurrentView('home')} isVisible={s.currentView === 'friends'} />
                        </div>
                    </div>
                </div>

                {/* FLOATING DOCK */}
                <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] py-4 px-8 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[2.5rem] z-40 flex justify-between items-center transition-all duration-500 ease-in-out ${s.currentView === 'home' ? 'translate-y-0 opacity-100' : 'translate-y-40 opacity-0 pointer-events-none'}`}>
                    <button
                        onClick={() => s.updateWater(-200)}
                        disabled={s.isUpdating}
                        className={`w-14 h-14 bg-white shadow-sm text-[#6ED8EA] rounded-full flex items-center justify-center transition-all ${s.isUpdating ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}`}
                    >
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                    </button>

                    <button
                        onClick={() => s.updateWater(200)}
                        disabled={s.isUpdating}
                        className={`w-[80px] h-[80px] bg-gradient-to-b from-[#B8E9F3] to-[#6ED8EA] text-white rounded-full shadow-xl shadow-[#B8E9F3] flex items-center justify-center transition-all ${s.isUpdating ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}`}
                    >
                        <svg className="h-11 w-11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>

                    <button
                        onClick={() => s.setShowCustomModal(true)}
                        disabled={s.isUpdating}
                        className={`w-14 h-14 bg-white shadow-sm text-[#6ED8EA] rounded-full flex items-center justify-center transition-all ${s.isUpdating ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}`}
                    >
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                </div>



            </main>
        </div>
    );
}