import React from 'react';
import { globalCss } from '../constants';

export default function LandingPage({ toast, handleLogin }) {
    return (
        <div className="bg-[#EAB0BE] sm:bg-[#EAB0BE] fixed inset-0 w-full h-full flex items-center justify-center font-sans text-[#1C1C1E] selection:bg-[#B8E9F3] antialiased overflow-hidden sm:py-10">
            <style dangerouslySetInnerHTML={{ __html: globalCss }} />

            {/* Toast (login errors only) */}
            <div className={`absolute top-10 left-1/2 -translate-x-1/2 z-[60] transition-all duration-500 ${toast.show ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <div className="bg-red-50 px-5 py-3 rounded-xl shadow-lg border border-red-200 flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <span className="text-[12px] font-bold text-red-700">{toast.message}</span>
                </div>
            </div>

            <main className="bg-gradient-to-b from-[#FDE8ED] via-[#FAF2F4] to-white w-full h-full sm:h-[844px] sm:max-w-[390px] sm:rounded-[3rem] overflow-hidden flex flex-col relative sm:shadow-2xl sm:ring-1 sm:ring-[#EAB0BE]/30 mx-auto">
                <div className="absolute top-[-5%] right-[-10%] w-[80vw] max-w-[400px] h-[80vw] max-h-[400px] bg-[#EAB0BE]/40 rounded-full blur-[80px] pointer-events-none z-0"></div>
                <div className="absolute bottom-[10%] left-[-10%] w-[60vw] max-w-[350px] h-[60vw] max-h-[350px] bg-[#B8E9F3]/30 rounded-full blur-[80px] pointer-events-none z-0"></div>

                {/* Hippo Image Gede Nempel Bawah */}
                <img
                    src="/hippo-landing.png"
                    alt="Hippo Drinking"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150%] max-w-[580px] object-cover object-bottom z-0 drop-shadow-2xl"
                />




                {/* Layout Container */}
                <div className="relative z-10 w-full h-full flex flex-col justify-between pt-16 pb-8 px-6">
                    
                    {/* TOP: Teks Heading */}
                    <div className="text-center mt-6">
                        <h1 className="text-[38px] font-black tracking-tighter text-[#1C1C1E] leading-[1.05] mb-2 drop-shadow-sm">
                            Drink your water.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6ED8EA] to-[#EAB0BE]">Don't be a dry silit</span>
                        </h1>
                    </div>

                    {/* Spacer biar bawahnya ke-push turun */}
                    <div className="flex-1"></div>

                    {/* BOTTOM: Glassmorphism layer di depan badan hippo */}
                    <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-[2.5rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex flex-col items-center">
                        
                        {/* Stats cards (putih transparan) */}
                        <div className="flex gap-2.5 w-full justify-center mb-6">
                            <div className="flex-1 bg-white/70 backdrop-blur-md rounded-2xl p-3.5 text-center shadow-[inset_0_2px_10px_rgba(255,255,255,0.5)]">
                                <p className="text-[20px] font-black text-[#6ED8EA] leading-none">1.5L</p>
                                <p className="text-[8px] font-bold text-[#8E8E93] uppercase tracking-widest mt-2">Daily Goal</p>
                            </div>
                            <div className="flex-1 bg-white/70 backdrop-blur-md rounded-2xl p-3.5 text-center shadow-[inset_0_2px_10px_rgba(255,255,255,0.5)]">
                                <p className="text-[20px] font-black text-[#FF9500] leading-none">🔥 7</p>
                                <p className="text-[8px] font-bold text-[#8E8E93] uppercase tracking-widest mt-2">Day Streak</p>
                            </div>
                            <div className="flex-1 bg-white/70 backdrop-blur-md rounded-2xl p-3.5 text-center shadow-[inset_0_2px_10px_rgba(255,255,255,0.5)]">
                                <p className="text-[20px] font-black text-[#EAB0BE] leading-none">🍵</p>
                                <p className="text-[8px] font-bold text-[#8E8E93] uppercase tracking-widest mt-2">Reward</p>
                            </div>
                        </div>

                        {/* Login button */}
                        <button
                            onClick={handleLogin}
                            className="group relative w-full py-5 bg-[#6ED8EA] hover:bg-[#4FC5D8] rounded-[1.25rem] font-bold text-white text-[17px] flex items-center justify-center gap-3 overflow-hidden transition-all active:scale-95 shadow-[0_10px_25px_rgba(110,216,234,0.4)]"
                        >
                            <svg className="w-6 h-6 relative z-10" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#fff" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" />
                            </svg>
                            <span className="relative z-10 tracking-wide mt-0.5">Continue with Google</span>
                        </button>
                    </div>

                    {/* Tagline di bawah glass card */}
                    <p className="text-center text-[10px] text-[#8E8E93]/80 font-medium mt-4">Only for Silit &amp; Kopet</p>
                </div>
            </main>
        </div>
    );
}
