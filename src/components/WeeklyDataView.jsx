import React, { useMemo, useState } from 'react';

// Catmull-Rom to Bezier smooth curve helper
function catmullRomToBezier(points) {
    if (points.length < 2) return '';
    const d = [`M ${points[0].x},${points[0].y}`];
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(i - 1, 0)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(i + 2, points.length - 1)];
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        d.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
    }
    return d.join(' ');
}

export default function WeeklyDataView({ onBack, history, goal }) {
    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const weekData = useMemo(() => {
        const today = new Date();
        const sun = new Date(today);
        sun.setDate(sun.getDate() - sun.getDay()); // rewind to this week's Sunday

        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(sun);
            d.setDate(d.getDate() + i);
            const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const ml = history[str] || 0;
            return {
                label: DAY_LABELS[i], // guaranteed Sun, Mon, Tue, Wed, Thu, Fri, Sat
                ml,
                dateStr: str,
                isFuture: d > today,
            };
        });
    }, [history]);

    // Find index of highest point (or today) for default tooltip
    const peakIdx = useMemo(() => {
        let max = -1, idx = 0;
        weekData.forEach((d, i) => { if (d.ml > max) { max = d.ml; idx = i; } });
        return max === 0 ? null : idx;
    }, [weekData]);

    const [activeIdx, setActiveIdx] = useState(peakIdx);

    // SVG chart dimensions
    const W = 320, H = 140, PAD_X = 24, PAD_Y = 20;
    const chartW = W - PAD_X * 2;
    const chartH = H - PAD_Y * 2;

    const maxVal = Math.max(...weekData.map(d => d.ml), goal || 1500, 1);

    const points = weekData.map((d, i) => ({
        x: PAD_X + (i / 6) * chartW,
        y: PAD_Y + chartH - (d.ml / maxVal) * chartH,
        ml: d.ml,
    }));

    const linePath = catmullRomToBezier(points);

    // Area fill path (close shape at bottom)
    const areaPath = linePath
        + ` L ${points[points.length - 1].x},${PAD_Y + chartH} L ${points[0].x},${PAD_Y + chartH} Z`;

    const activePoint = activeIdx !== null ? points[activeIdx] : null;

    return (
        <div className="absolute inset-0 w-full h-full flex flex-col">
            {/* HEADER — independent, matches global header style */}
            <div className="pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-8 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 flex-shrink-0 flex items-center justify-between" style={{ minHeight: 'calc(env(safe-area-inset-top) + 72px)' }}>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1E]">Weekly Data</h1>
                    <p className="text-[#8E8E93] text-[12px] font-medium">This week's hydration</p>
                </div>
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-[#F2F2F7] text-[#8E8E93] flex items-center justify-center active:scale-90 transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-10 pt-2 flex flex-col gap-4">

                {/* DARK CHART CARD */}
                <div className="w-full rounded-[2.5rem] p-6 shadow-[0_20px_60px_rgba(30,27,58,0.25)]" style={{ background: 'linear-gradient(145deg, #1e1b3a 0%, #2d2660 100%)' }}>
                    <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest mb-1">This Week</p>
                    <p className="text-white text-[22px] font-bold mb-5">
                        {weekData.reduce((s, d) => s + d.ml, 0).toLocaleString()}
                        <span className="text-white/50 text-[14px] font-medium ml-1">ml total</span>
                    </p>

                    {/* SVG Chart */}
                    <div className="w-full relative" style={{ touchAction: 'none' }}>
                        <svg
                            viewBox={`0 0 ${W} ${H}`}
                            className="w-full"
                            style={{ height: H, overflow: 'visible' }}
                        >
                            <defs>
                                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6ED8EA" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#6ED8EA" stopOpacity="0.02" />
                                </linearGradient>
                            </defs>

                            {/* Area fill */}
                            <path d={areaPath} fill="url(#areaGrad)" />

                            {/* Line */}
                            <path
                                d={linePath}
                                fill="none"
                                stroke="#6ED8EA"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Goal line (subtle dashed) */}
                            {goal > 0 && (
                                <line
                                    x1={PAD_X}
                                    y1={PAD_Y + chartH - (goal / maxVal) * chartH}
                                    x2={W - PAD_X}
                                    y2={PAD_Y + chartH - (goal / maxVal) * chartH}
                                    stroke="rgba(255,255,255,0.12)"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                />
                            )}

                            {/* Touch hit targets (invisible wide columns) */}
                            {points.map((pt, i) => (
                                <rect
                                    key={i}
                                    x={pt.x - chartW / 14}
                                    y={0}
                                    width={chartW / 7}
                                    height={H}
                                    fill="transparent"
                                    className="cursor-pointer"
                                    onClick={() => setActiveIdx(i)}
                                />
                            ))}

                            {/* Active point highlight */}
                            {activePoint && (
                                <>
                                    {/* Vertical guide */}
                                    <line
                                        x1={activePoint.x}
                                        y1={PAD_Y}
                                        x2={activePoint.x}
                                        y2={PAD_Y + chartH}
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth="1"
                                    />
                                    {/* Outer glow ring */}
                                    <circle cx={activePoint.x} cy={activePoint.y} r="10" fill="rgba(110,216,234,0.18)" />
                                    {/* White dot */}
                                    <circle cx={activePoint.x} cy={activePoint.y} r="5" fill="white" />

                                    {/* Tooltip pill — clamp so it doesn't go off-edge */}
                                    {(() => {
                                        const tipW = 68, tipH = 24, tipX = Math.min(Math.max(activePoint.x - tipW / 2, PAD_X - 8), W - PAD_X - tipW + 8);
                                        const tipY = activePoint.y - tipH - 12;
                                        return (
                                            <g>
                                                <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="12" fill="#FFF9C4" />
                                                <text
                                                    x={tipX + tipW / 2}
                                                    y={tipY + tipH / 2 + 4.5}
                                                    textAnchor="middle"
                                                    fontSize="11"
                                                    fontWeight="700"
                                                    fill="#7A6500"
                                                >
                                                    {weekData[activeIdx].ml.toLocaleString()}ml
                                                </text>
                                            </g>
                                        );
                                    })()}
                                </>
                            )}

                            {/* Inert dots for each data point */}
                            {points.map((pt, i) => (
                                pt.ml > 0 && i !== activeIdx ? (
                                    <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="rgba(110,216,234,0.6)" />
                                ) : null
                            ))}
                        </svg>
                    </div>

                    {/* X-axis labels */}
                    <div className="flex justify-between px-[4px] mt-3">
                        {weekData.map((d, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveIdx(i)}
                                className={`text-[10px] uppercase tracking-wider transition-all active:scale-90 ${i === activeIdx ? 'text-white font-bold' : 'text-white/35 font-medium'}`}
                                style={{ minWidth: 32 }}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* DAILY BREAKDOWN LIST */}
                <div className="w-full">
                    <h3 className="text-[#1C1C1E] font-bold text-[15px] mb-3 ml-1">Daily Breakdown</h3>
                    <div className="bg-white rounded-[2rem] shadow-[0_5px_25px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                        {weekData.map((d, i) => {
                            const pct = Math.min((d.ml / (goal || 1500)) * 100, 100);
                            const isToday = d.dateStr === new Date().toLocaleDateString('en-CA');
                            return (
                                <div
                                    key={i}
                                    className={`flex items-center gap-4 px-5 py-3.5 ${i < weekData.length - 1 ? 'border-b border-gray-50' : ''} ${isToday ? 'bg-[#6ED8EA]/5' : ''}`}
                                >
                                    <span className={`text-[11px] font-bold uppercase tracking-wider w-9 ${isToday ? 'text-[#6ED8EA]' : 'text-[#8E8E93]'}`}>{d.label}</span>
                                    <div className="flex-1 h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${pct}%`,
                                                background: pct >= 100
                                                    ? 'linear-gradient(90deg, #B8E9F3, #6ED8EA)'
                                                    : 'linear-gradient(90deg, #e0f4f8, #B8E9F3)'
                                            }}
                                        />
                                    </div>
                                    <span className={`text-[12px] font-bold w-16 text-right ${d.ml >= (goal || 1500) ? 'text-[#6ED8EA]' : 'text-[#1C1C1E]'}`}>
                                        {d.ml > 0 ? `${d.ml.toLocaleString()}ml` : '—'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
