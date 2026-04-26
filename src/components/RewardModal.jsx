import React from 'react';

export default function RewardModal({ show, onClose, streakCount, matchaClaimed = 0 }) {
    const nextMilestone = 7 * (matchaClaimed + 1);
    const daysLeft = nextMilestone - streakCount;
    // Progress within current 7-day cycle
    const cycleProgress = streakCount - (matchaClaimed * 7);
    const cycleDays = Math.max(0, Math.min(cycleProgress, 7));

    return (
        <div className={`absolute inset-0 z-50 flex items-end justify-center transition-all duration-300 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`bg-white w-full rounded-t-[2.5rem] p-8 pb-12 shadow-2xl relative z-10 transform transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${show ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>

                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-5xl mb-4 grayscale">
                        🍵
                    </div>
                    <h3 className="text-[#1C1C1E] text-xl font-black mb-1">Not yet, Sayang!</h3>
                    <p className="text-[#8E8E93] text-[13px] font-medium mb-6">
                        You need <span className="text-[#6ED8EA] font-bold">{daysLeft} more day{daysLeft !== 1 ? 's' : ''}</span> to unlock your Matcha reward 🔒
                    </p>

                    {/* Progress bar */}
                    <div className="w-full mb-2">
                        <div className="flex justify-between text-[11px] font-bold text-[#8E8E93] mb-2">
                            <span>Streak Progress</span>
                            <span>{cycleDays}/7 days</span>
                        </div>
                        <div className="w-full h-3 bg-[#F2F2F7] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#B8E9F3] to-[#6ED8EA] rounded-full transition-all duration-700"
                                style={{ width: `${(cycleDays / 7) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Day dots */}
                    <div className="flex gap-2 mt-3 mb-6">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                                    i < cycleDays
                                        ? 'bg-gradient-to-br from-[#B8E9F3] to-[#6ED8EA] text-white shadow-md'
                                        : 'bg-[#F2F2F7] text-[#C7C7CC]'
                                }`}
                            >
                                {i < cycleDays ? '✓' : i + 1}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-[#6ED8EA] text-white rounded-2xl font-bold text-[15px] active:scale-95 transition-all"
                    >
                        Let's keep going! 💪
                    </button>
                </div>
            </div>
        </div>
    );
}
