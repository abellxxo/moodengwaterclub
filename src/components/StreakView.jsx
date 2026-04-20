import React from 'react';

export default function StreakView({ streakCount, isTodayGoalMet, weekDays, isClaiming, handleClaimReward, setShowCalendar, onShowWeeklyData }) {
    return (
        <>
            {/* Streak Card */}
            <div className="bg-white w-full rounded-[2.5rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col items-center text-center mb-8 relative transition-all">
                <button
                    onClick={() => setShowCalendar(true)}
                    className="absolute top-5 right-5 w-10 h-10 bg-[#F2F2F7] text-[#6ED8EA] rounded-full flex items-center justify-center hover:bg-[#E5E5EA] active:scale-90 transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
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

            {/* This Week */}
            <div className="w-full">
                <h3 className="text-[#1C1C1E] font-bold text-lg mb-5 ml-2">This Week</h3>
                <div className="bg-white rounded-[2.5rem] px-4 py-6 shadow-[0_5px_25px_rgba(0,0,0,0.03)] border border-gray-100 flex justify-between items-center">
                    {weekDays.map((day, idx) => (
                        <div key={idx} className="flex flex-col items-center space-y-3">
                            <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center transition-all duration-700 ${day.isHit ? 'bg-gradient-to-br from-[#B8E9F3] to-[#6ED8EA] shadow-lg shadow-[#B8E9F3]' : 'bg-[#F2F2F7]'}`}>
                                {day.isHit && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${day.isHit ? 'text-[#6ED8EA]' : 'text-[#8E8E93]'}`}>{day.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Weekly Data Card */}
            <div className="w-full mt-5">
                <button
                    onClick={onShowWeeklyData}
                    className="w-full bg-white rounded-[2rem] p-4 shadow-[0_5px_20px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center justify-between transition-all active:scale-95"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-[22px]" style={{ background: 'linear-gradient(135deg, #1e1b3a, #2d2660)' }}>
                            📊
                        </div>
                        <div className="text-left">
                            <h4 className="text-[#1C1C1E] font-bold text-[15px]">Weekly Data</h4>
                            <p className="text-[#8E8E93] text-[12px] font-medium mt-0.5">View your 7-day chart</p>
                        </div>
                    </div>
                    <div className="text-[#C7C7CC] pr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                </button>
            </div>

            {/* Claim Reward */}
            <div className="w-full mt-5 flex flex-col items-center">
                <button
                    onClick={handleClaimReward}
                    disabled={isClaiming}
                    className={`w-full bg-white rounded-[2rem] p-4 shadow-[0_5px_20px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center justify-between transition-all active:scale-95 ${isClaiming ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[26px] transition-all ${streakCount >= 7 ? 'bg-[#EAB0BE]/20' : 'bg-gray-100 grayscale'}`}>🍵</div>
                        <div className="text-left">
                            <h4 className="text-[#1C1C1E] font-bold text-[15px]">
                                {isClaiming ? 'Claiming...' : 'Claim your reward'}
                            </h4>
                            <p className="text-[#8E8E93] text-[12px] font-medium mt-0.5">
                                {streakCount >= 7
                                    ? 'Tap to claim your Matcha! 🎉'
                                    : `${7 - streakCount} more day${7 - streakCount !== 1 ? 's' : ''} to unlock`}
                            </p>
                        </div>
                    </div>
                    <div className="text-[#C7C7CC] pr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                </button>
            </div>
        </>
    );
}
