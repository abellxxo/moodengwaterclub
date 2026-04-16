import React from 'react';
import { globalCss } from '../constants';

export default function SplashScreen({ type }) {
    // type === 'auth'  → mini pulse logo (first load, no layout yet)
    // type === 'loading' → full hippo splash screen (login or data fetch)

    if (type === 'auth') return (
        <div className="bg-white sm:bg-[#F2F2F7] fixed inset-0 w-full h-full flex items-center justify-center z-50">
            <style dangerouslySetInnerHTML={{ __html: globalCss }} />
            <img
                src="/hippomini.png"
                alt="Loading..."
                className="max-w-[150px] max-h-[150px] w-auto h-auto animate-pulse drop-shadow-md"
            />
        </div>
    );

    return (
        <div className="bg-white sm:bg-[#F2F2F7] fixed inset-0 w-full h-full flex items-center justify-center font-sans text-[#1C1C1E] antialiased z-50">
            <style dangerouslySetInnerHTML={{ __html: globalCss }} />
            <main className="bg-white w-full h-full sm:h-[844px] sm:max-w-[390px] sm:rounded-[3rem] flex flex-col items-center justify-center relative sm:shadow-2xl overflow-hidden">
                <div className="absolute top-[-5%] right-[-10%] w-[80vw] max-w-[400px] h-[80vw] max-h-[400px] bg-[#B8E9F3]/40 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute bottom-[10%] left-[-10%] w-[60vw] max-w-[350px] h-[60vw] max-h-[350px] bg-[#EAB0BE]/40 rounded-full blur-[80px] pointer-events-none"></div>

                <img
                    src="/hippo-splash.png"
                    alt="Loading..."
                    className="w-360 h-480 object-contain drop-shadow-xl z-10 mt-12 translate-x-18 translate-y-60"
                />
                <h2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#8E8E93] text-xl font-bold tracking-wide z-10 animate-pulse text-center whitespace-nowrap">
                    Wait a minute...
                </h2>
            </main>
        </div>
    );
}
