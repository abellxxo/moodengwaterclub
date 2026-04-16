import React from 'react';
import { getLogicalDateStr } from '../AppContext';

export default function CalendarModal({ show, onClose, calMonth, calYear, userData, handlePrevMonth, handleNextMonth }) {
    const renderCalendarGrid = () => {
        const firstDay = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const todayStr = getLogicalDateStr();

        const blanks = Array.from({ length: firstDay }).map((_, i) => (
            <div key={`blank-${i}`}></div>
        ));

        const days = Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isHit = (userData.history[dateStr] || 0) >= userData.goal;
            const isToday = dateStr === todayStr;

            return (
                <div key={dayNum} className="flex justify-center items-center h-8">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full text-[13px] transition-all
                        ${isHit ? 'bg-[#6ED8EA] text-white shadow-md font-bold' : isToday ? 'bg-[#F2F2F7] text-[#1C1C1E] font-bold border border-gray-200' : 'text-[#1C1C1E]'}`}>
                        {dayNum}
                    </div>
                </div>
            );
        });

        return [...blanks, ...days];
    };

    return (
        <div className={`absolute inset-0 z-50 flex items-center justify-center transition-all duration-300 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`bg-white w-[90%] max-w-[340px] rounded-[2.5rem] p-6 shadow-2xl relative z-10 transform transition-all duration-300 ${show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-[#6ED8EA] hover:bg-gray-100 active:scale-90 transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="font-bold text-lg tracking-tight">
                        {new Date(calYear, calMonth).toLocaleString('default', { month: 'long' })} {calYear}
                    </h2>
                    <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-[#6ED8EA] hover:bg-gray-100 active:scale-90 transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Day labels */}
                <div className="grid grid-cols-7 gap-1 text-center mb-4">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <span key={i} className="text-[11px] font-bold text-[#8E8E93] uppercase">{d}</span>
                    ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center">
                    {renderCalendarGrid()}
                </div>

                <button onClick={onClose} className="w-full mt-6 py-3.5 bg-[#F2F2F7] text-[#1C1C1E] rounded-2xl font-bold active:scale-95 transition-all">
                    Done
                </button>
            </div>
        </div>
    );
}
