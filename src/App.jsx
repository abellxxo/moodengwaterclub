import React from 'react';
import { useAppState } from './AppContext';
import { globalCss } from './constants';
import SplashScreen from './components/SplashScreen';
import LandingPage from './components/LandingPage';
import CalendarModal from './components/CalendarModal';
import CustomAmountSheet from './components/CustomAmountSheet';
import RewardModal from './components/RewardModal';
import HomeView from './components/HomeView';
import StreakView from './components/StreakView';

export default function App() {
    const s = useAppState();

    // 1. Waiting for Firebase Auth to resolve
    if (!s.authResolved) return <SplashScreen type="auth" />;

    // 2. Logging in or loading Firestore data
    if (s.isManualLoggingIn || (s.user && !s.dataLoaded)) return <SplashScreen type="loading" />;

    // 3. Not logged in → show landing
    if (!s.user) return <LandingPage toast={s.toast} handleLogin={s.handleLogin} />;

    // 4. Logged in → main app
    return (
        <div className="bg-[#ffffff] sm:bg-[#EAB0BE] fixed inset-0 w-full h-full flex items-center justify-center font-sans text-[#1C1C1E] selection:bg-[#B8E9F3] antialiased overflow-hidden sm:py-10">
            <style dangerouslySetInnerHTML={{ __html: globalCss }} />

            <main className="bg-[#ffffff] w-full h-full sm:h-[844px] sm:max-w-[390px] sm:rounded-[3rem] overflow-hidden flex flex-col relative sm:shadow-2xl sm:ring-1 sm:ring-[#EAB0BE]/30 mx-auto">
                <div className="absolute bottom-[-5%] right-[-10%] w-[80vw] max-w-[400px] h-[80vw] max-h-[400px] bg-[#EAB0BE]/50 rounded-full blur-[80px] pointer-events-none z-0"></div>
                <div className="absolute bottom-[5%] left-[-10%] w-[60vw] max-w-[350px] h-[60vw] max-h-[350px] bg-[#B8E9F3]/50 rounded-full blur-[80px] pointer-events-none z-0"></div>

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
                />

                {/* HEADER */}
                <header className="pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-8 z-30 bg-white/70 backdrop-blur-xl border-b border-gray-100/50 sticky top-0">
                    <div className="flex justify-between items-center h-14">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1E]">
                                {s.currentView === 'home' ? 'Silit Tracker App' : 'Streak'}
                            </h1>
                            <p className="text-[#8E8E93] text-[12px] font-medium flex items-center gap-1.5">
                                {(s.user.displayName?.split(' ')[0] || 'User').substring(0, 10)}'s Tracker
                                <span onClick={s.handleLogout} className="text-[#6ED8EA] cursor-pointer hover:underline">
                                    (Sign out)
                                </span>
                            </p>
                        </div>
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
                        />
                    </div>

                    {/* STREAK */}
                    <div className={`absolute inset-0 w-full h-full overflow-y-auto no-scrollbar flex flex-col items-center pt-8 pb-10 px-5 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${s.currentView === 'streak' ? 'translate-x-0 opacity-100 z-10' : 'translate-x-[100%] opacity-0 z-0 pointer-events-none'}`}>
                        <StreakView
                            streakCount={s.streakCount}
                            isTodayGoalMet={s.isTodayGoalMet}
                            weekDays={s.weekDays}
                            isClaiming={s.isClaiming}
                            handleClaimReward={s.handleClaimReward}
                            setShowCalendar={s.setShowCalendar}
                        />
                    </div>
                </div>

                {/* FLOATING DOCK */}
                <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[2.5rem] z-40 flex justify-center items-center gap-7 transition-all duration-500 ease-in-out ${s.currentView === 'home' ? 'translate-y-0 opacity-100' : 'translate-y-40 opacity-0 pointer-events-none'}`}>
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