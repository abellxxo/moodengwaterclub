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
                <div className="absolute top-[-5%] right-[-10%] w-[80vw] max-w-[400px] h-[80vw] max-h-[400px] bg-[#EAB0BE]/30 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute bottom-[10%] left-[-10%] w-[60vw] max-w-[350px] h-[60vw] max-h-[350px] bg-[#B8E9F3]/30 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="z-10 w-full h-full flex flex-col items-center py-10 px-8 relative">
                    <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full mt-4">

                        {/* Hippo + Bubbles */}
                        <div className="relative flex justify-center items-center w-full h-[240px]">
                            <div className="bubble-1 absolute left-[10%] bottom-[50%] w-10 h-10 bg-gradient-to-br from-[#B8E9F3] to-[#6ED8EA] rounded-full shadow-lg shadow-[#B8E9F3]/50 flex items-center justify-center z-0">
                                <span className="text-sm">💧</span>
                            </div>
                            <div className="bubble-2 absolute right-[15%] bottom-[40%] w-6 h-6 bg-gradient-to-br from-[#EAB0BE] to-[#EBADBB] rounded-full shadow-md shadow-[#EAB0BE]/50 z-0"></div>
                            <div className="bubble-3 absolute left-[25%] bottom-[75%] w-4 h-4 bg-[#B8E9F3] rounded-full z-0"></div>
                            <div className="bubble-1 absolute right-[25%] bottom-[70%] w-3 h-3 bg-[#EAB0BE] rounded-full z-0" style={{ animationDelay: '2s' }}></div>
                            <img
                                src="/hippo-landing.webp"
                                alt="Hippo Drinking"
                                className="w-72 h-72 object-contain drop-shadow-2xl z-10"
                            />
                        </div>

                        {/* Heading */}
                        <div className="text-center mt-2">
                            <h1 className="text-[40px] font-black tracking-tighter text-[#1C1C1E] leading-[1.1] mb-2">
                                Drink your water.<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6ED8EA] to-[#EAB0BE]">Don't be a dry silit</span>
                            </h1>
                        </div>

                        {/* Stats cards */}
                        <div className="flex gap-3 w-full justify-center mt-2">
                            <div className="flex-1 bg-[#F2F2F7] rounded-[1.25rem] p-4 text-center border border-gray-100/50">
                                <p className="text-[22px] font-black text-[#6ED8EA] leading-none">1.5L</p>
                                <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider mt-2">Daily Goal</p>
                            </div>
                            <div className="flex-1 bg-[#F2F2F7] rounded-[1.25rem] p-4 text-center border border-gray-100/50">
                                <p className="text-[22px] font-black text-[#FF9500] leading-none">🔥 7</p>
                                <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider mt-2">Day Streak</p>
                            </div>
                            <div className="flex-1 bg-[#F2F2F7] rounded-[1.25rem] p-4 text-center border border-gray-100/50">
                                <p className="text-[22px] font-black text-[#EAB0BE] leading-none">🍵</p>
                                <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider mt-2">Reward</p>
                            </div>
                        </div>
                    </div>

                    {/* Login button */}
                    <div className="w-full shrink-0 pb-6 flex flex-col items-center mt-6">
                        <button
                            onClick={handleLogin}
                            className="group relative w-full py-4 bg-[#6ED8EA] hover:bg-[#4FC5D8] rounded-2xl font-bold text-white text-[15px] flex items-center justify-center gap-3 overflow-hidden transition-all active:scale-95 shadow-[0_10px_25px_rgba(110,216,234,0.4)]"
                        >
                            <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#fff" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" />
                            </svg>
                            <span className="relative z-10 tracking-wide">Continue with Google</span>
                        </button>
                        <p className="text-center text-[11px] text-[#C7C7CC] font-medium mt-4">Only for Silit &amp; Kopet</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
