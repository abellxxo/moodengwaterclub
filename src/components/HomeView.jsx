import React from 'react';

export default function HomeView({ currentCount, userData, isTodayGoalMet, progress }) {
    return (
        <>
            {/* Counter */}
            <div className="flex flex-col items-center text-center mb-8 w-full">
                <div className="flex items-baseline space-x-1 justify-center w-full">
                    <span className="text-[72px] font-medium tracking-[-0.05em] text-[#1C1C1E] leading-none">{currentCount}</span>
                    <span className="text-xl font-medium tracking-tight text-[#8E8E93]">/ {userData.goal} ml</span>
                </div>
                <span className={`font-medium mt-4 text-[13px] px-5 py-2 rounded-full transition-all duration-500 ${isTodayGoalMet ? 'bg-[#EAB0BE]/30 text-[#B98C97]' : 'bg-[#F2F2F7] text-[#8E8E93]'}`}>
                    {isTodayGoalMet ? 'Daily Goal Reached! 🎉' : `${userData.goal - currentCount} ml remaining`}
                </span>
            </div>

            {/* Water Bottle */}
            <div className="relative flex justify-center items-center mb-6 w-full">
                <div className="w-48 h-72 rounded-[3.5rem] p-2 bg-gradient-to-b from-[#F2F2F7] to-white shadow-[inset_0_2px_20px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden flex items-end">
                    {/* Water fill — keeps original blue gradient per design */}
                    <div
                        className="w-full bg-gradient-to-t from-[#007AFF] via-[#148EFF] to-[#5AC8FA] relative rounded-[3rem] overflow-hidden transition-all duration-[1000ms] ease-out shadow-[0_-8px_25px_rgba(0,122,255,0.3)]"
                        style={{ height: `${currentCount > 0 ? Math.max(progress, 4) : 0}%`, opacity: currentCount === 0 ? 0 : 1 }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white/40 to-transparent rounded-[100%] scale-150 -translate-y-1/2"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-white/10"></div>
                    </div>
                    {/* Glass highlights */}
                    <div className="absolute top-8 bottom-8 left-5 w-4 bg-white/50 rounded-full blur-[3px] pointer-events-none"></div>
                    <div className="absolute top-16 bottom-16 right-4 w-1.5 bg-white/30 rounded-full blur-[1.5px] pointer-events-none"></div>
                </div>
            </div>
        </>
    );
}
