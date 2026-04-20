import React, { useMemo, useState } from 'react';

// Catmull-Rom to Bezier smooth curve helper
function catmullRomToBezier(points, bottomClampY) {
    if (points.length < 2) return '';
    const d = [`M ${points[0].x},${points[0].y}`];
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(i - 1, 0)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(i + 2, points.length - 1)];
        let cp1x = p1.x + (p2.x - p0.x) / 6;
        let cp1y = p1.y + (p2.y - p0.y) / 6;
        let cp2x = p2.x - (p3.x - p1.x) / 6;
        let cp2y = p2.y - (p3.y - p1.y) / 6;

        // Prevent curve from dipping below chart baseline (overshoot)
        if (bottomClampY !== undefined) {
            cp1y = Math.min(bottomClampY, cp1y);
            cp2y = Math.min(bottomClampY, cp2y);
        }

        d.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
    }
    return d.join(' ');
}

export default function WeeklyDataView({ history, goal }) {
    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Unique IDs to avoid SVG gradient ID collisions in the DOM
    const uid = 'wdv';

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

    const allZero = weekData.every(d => d.ml === 0);
    const maxVal = Math.max(...weekData.map(d => d.ml), goal || 1500, 1);

    const points = weekData.map((d, i) => ({
        x: PAD_X + (i / 6) * chartW,
        // clamp so curve never goes below chart floor
        y: allZero
            ? PAD_Y + chartH
            : Math.min(PAD_Y + chartH, Math.max(PAD_Y, PAD_Y + chartH - (d.ml / maxVal) * chartH)),
        ml: d.ml,
    }));

    const flatY = PAD_Y + chartH; // baseline y for zero state
    const linePath = allZero ? '' : catmullRomToBezier(points, flatY);

    // Area fill path (close shape at bottom)
    const areaPath = linePath
        ? linePath + ` L ${points[points.length - 1].x},${flatY} L ${points[0].x},${flatY} Z`
        : '';

    const activePoint = activeIdx !== null ? points[activeIdx] : null;

    return (
        <div className="w-full flex flex-col gap-4 pb-6">

                {/* DARK CHART CARD */}
                <div className="w-full rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-6 shadow-[0_20px_60px_rgba(30,27,58,0.25)]" style={{ background: 'linear-gradient(145deg, #1e1b3a 0%, #2d2660 100%)' }}>
                    <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest mb-1">This Week</p>
                    <p className="text-white text-[22px] font-bold mb-5">
                        {weekData.reduce((s, d) => s + d.ml, 0).toLocaleString()}
                        <span className="text-white/50 text-[14px] font-medium ml-1">ml total</span>
                    </p>

                    {/* SVG Chart */}
                    <div className="w-full relative block" style={{ touchAction: 'none', aspectRatio: '320/140' }}>
                        <svg
                            viewBox={`0 0 ${W} ${H}`}
                            className="absolute inset-0 w-full h-full"
                            preserveAspectRatio="xMidYMid meet"
                            style={{ overflow: 'visible' }}
                        >
                            <defs>
                                {/* Area fill: pink → blue → transparent (top to bottom) */}
                                <linearGradient id={`${uid}-areaGrad`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#EAB0BE" stopOpacity="0.4" />
                                    <stop offset="55%" stopColor="#B8E9F3" stopOpacity="0.18" />
                                    <stop offset="100%" stopColor="#6ED8EA" stopOpacity="0.02" />
                                </linearGradient>
                                {/* Line stroke: pink → cyan, using real chart x coords */}
                                <linearGradient id={`${uid}-lineGrad`} gradientUnits="userSpaceOnUse" x1={PAD_X} y1="0" x2={W - PAD_X} y2="0">
                                    <stop offset="0%" stopColor="#EAB0BE" />
                                    <stop offset="50%" stopColor="#B8E9F3" />
                                    <stop offset="100%" stopColor="#6ED8EA" />
                                </linearGradient>
                            </defs>

                            {/* Area fill — only when there's data */}
                            {!allZero && <path d={areaPath} fill={`url(#${uid}-areaGrad)`} />}

                            {/* Line — flat when all zero, curved when data exists */}
                            {allZero ? (
                                <line
                                    x1={PAD_X}
                                    y1={flatY}
                                    x2={W - PAD_X}
                                    y2={flatY}
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth="2"
                                    strokeDasharray="4 4"
                                />
                            ) : (
                                <path
                                    d={linePath}
                                    fill="none"
                                    stroke={`url(#${uid}-lineGrad)`}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            )}

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
                                    {/* Outer glow ring — pink tint */}
                                    <circle cx={activePoint.x} cy={activePoint.y} r="10" fill="rgba(234,176,190,0.3)" />
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
                                    <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="rgba(184,233,243,0.7)" />
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
                                className={`text-[10px] uppercase tracking-wider transition-all active:scale-90 flex-1 text-center ${i === activeIdx ? 'text-white font-bold' : 'text-white/35 font-medium'}`}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* DAILY BREAKDOWN LIST */}
                <div className="w-full">
                    <h3 className="text-[#1C1C1E] font-bold text-[15px] mb-3 ml-1">Daily Breakdown</h3>
                    <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_5px_25px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
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
    );
}
