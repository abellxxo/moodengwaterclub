import React from 'react';

export default function StreakView({ streakCount, isTodayGoalMet, weekDays, isClaiming, handleClaimReward, setShowCalendar, onShowWeeklyData, matchaClaimed = 0 }) {
    const nextMilestone = 7 * (matchaClaimed + 1);
    const canClaim = streakCount >= nextMilestone;
    const daysLeft = nextMilestone - streakCount;
    return (
        <>
            {/* Streak Card */}
            <div className="bg-white w-full rounded-[2.5rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col items-center text-center relative transition-all">
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


            {/* Matcha Claimed Card */}
            <div className="w-full mt-4">
                <div className="w-full rounded-[2rem] p-5 shadow-[0_5px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9, #fff8e1)' }}>
                    {/* Decorative floating matcha emojis */}
                    <div className="absolute top-2 right-3 text-[28px] opacity-20 rotate-12">🍵</div>
                    <div className="absolute bottom-2 right-10 text-[18px] opacity-15 -rotate-6">🍃</div>

                    <div className="flex items-center gap-4">
                        <div className="text-[28px] ml-1">
                            🍵
                        </div>
                        <div className="flex-1">
                            <p className="text-[#6d8b64] text-[11px] font-bold tracking-widest uppercase">Matcha Claimed</p>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-4xl font-bold tracking-tight text-[#2e7d32]">{matchaClaimed}</span>
                                <span className="text-[13px] font-semibold text-[#4caf50]">{matchaClaimed === 1 ? 'cup' : 'cups'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Weekly Data Card */}
            <div className="w-full mt-4">
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
            <div className="w-full mt-4 flex flex-col items-center">
                <button
                    onClick={handleClaimReward}
                    disabled={isClaiming}
                    className={`w-full bg-white rounded-[2rem] p-4 shadow-[0_5px_20px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center justify-between transition-all active:scale-95 ${isClaiming ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[26px] transition-all ${canClaim ? 'bg-[#EAB0BE]/20' : 'bg-gray-100 grayscale'}`}>🍵</div>
                        <div className="text-left">
                            <h4 className="text-[#1C1C1E] font-bold text-[15px]">
                                {isClaiming ? 'Claiming...' : 'Claim your reward'}
                            </h4>
                            <p className="text-[#8E8E93] text-[12px] font-medium mt-0.5">
                                {canClaim
                                    ? 'Tap to claim your Matcha! 🎉'
                                    : `${daysLeft} more day${daysLeft !== 1 ? 's' : ''} to unlock`}
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
