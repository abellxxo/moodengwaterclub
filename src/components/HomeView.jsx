import React from 'react';

// Character stages based on progress
const STAGES = [
    {
        min: 0, max: 25,
        img: '/photos/char1.png',
        text: "Let's get started! Your body needs water to thrive 🌱",
    },
    {
        min: 25, max: 50,
        img: '/photos/char2.png',
        text: "Nice, you're warming up! Keep the sips coming 💧",
    },
    {
        min: 50, max: 100,
        img: '/photos/char3.png',
        text: "You're doing amazing! Almost at your goal 🔥",
    },
    {
        min: 100, max: Infinity,
        img: '/photos/char4.png',
        text: "You crushed it today! Hydration champion 🏆",
    },
];

function getStage(progress) {
    for (const stage of STAGES) {
        if (progress < stage.max || stage.max === Infinity) return stage;
    }
    return STAGES[0];
}

export default function HomeView({ currentCount, userData, isTodayGoalMet, progress, weekDays, streakCount }) {
    const remaining = Math.max(0, userData.goal - currentCount);
    const stage = getStage(progress);
    const clampedProgress = Math.min(progress, 100);

    return (
        <>
            {/* RPG Card */}
            <div className="bg-white w-full rounded-[2rem] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 mb-4 relative overflow-hidden">


                {/* Main content: character + text */}
                <div className="flex items-center gap-5 mb-5">
                    {/* Character image */}
                    <div className="w-28 h-28 flex-shrink-0 rounded-2xl bg-[#F9F9FB] flex items-center justify-center overflow-hidden">
                        <img
                            src={stage.img}
                            alt="Character"
                            className="w-full h-full object-contain"
                        />
                    </div>

                    {/* Text side */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-[#1C1C1E] leading-snug mb-2">
                            {stage.text}
                        </p>
                        {!isTodayGoalMet && (
                            <p className="text-[13px] font-medium text-[#8E8E93]">
                                💧 <span className="text-[#4a90d9] font-bold">{remaining.toLocaleString()} ml</span> left to reach goal
                            </p>
                        )}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full relative">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-4 bg-[#F2F2F7] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                    width: `${currentCount > 0 ? Math.max(clampedProgress, 3) : 0}%`,
                                    background: isTodayGoalMet
                                        ? 'linear-gradient(90deg, #B8E9F3, #6ED8EA, #34C759)'
                                        : 'linear-gradient(90deg, #B8E9F3, #6ED8EA)',
                                }}
                            />
                        </div>
                        {/* 💧 fixed at right end */}
                        <span className="text-[16px] drop-shadow-sm flex-shrink-0">💧</span>
                    </div>

                    {/* Labels below progress bar */}
                    <div className="flex justify-between mt-2">
                        <span className="text-[12px] font-bold text-[#1C1C1E]">
                            {currentCount.toLocaleString()} ml done
                        </span>
                        <span className="text-[12px] font-bold text-[#8E8E93]">
                            Goal {userData.goal.toLocaleString()}ml
                        </span>
                    </div>
                </div>
            </div>

            {/* Sun-Sat Weekly Calendar */}
            <div className="w-full mb-4">
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

            {/* Streak Card */}
            <div className="w-full mb-4">
                <div className="bg-white rounded-[2rem] px-5 py-4 shadow-[0_5px_25px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-700 ${isTodayGoalMet ? 'bg-[#FF9500]/10' : 'bg-gray-100 grayscale opacity-40'}`}>
                            🔥
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">Current Streak</p>
                            <p className="text-[10px] font-medium mt-0.5" style={{ color: streakCount >= 7 ? '#EAB0BE' : '#FF9500' }}>
                                {streakCount >= 7
                                    ? '🍵 Matcha unlocked!'
                                    : `🍵 ${7 - streakCount} day${7 - streakCount !== 1 ? 's' : ''} till matcha`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold tracking-tight text-[#1C1C1E]">{streakCount}</span>
                        <span className="text-[13px] font-bold text-[#8E8E93]">{streakCount === 1 ? 'day' : 'days'}</span>
                    </div>
                </div>
            </div>
        </>
    );
}
