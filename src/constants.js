// Global CSS injected via <style> tag for Safari safe anti-bounce and PWA feel.
// Bump the version comment here when you make changes, so devs know it was intentional.
export const globalCss = `
    /* Safari Safe Anti-Bounce */
    html, body {
        overflow: hidden;
        overscroll-behavior: none;
        background-color: #FFFFFF;
        margin: 0;
        padding: 0;
    }
    @media (min-width: 640px) {
        html, body {
            background-color: #F2F2F7;
        }
    }
    #root {
        width: 100%;
        height: 100%;
        overflow: hidden;
    }
    /* Allow internal scroll areas without the rubber-band bounce effect */
    main, .overflow-y-auto {
        touch-action: pan-y;
        overscroll-behavior-y: contain;
    }
    * { -webkit-tap-highlight-color: transparent; user-select: none; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    input[type="number"] { -moz-appearance: textfield; }

    @keyframes float1 { 0%, 100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-12px) scale(1.05); } }
    @keyframes float2 { 0%, 100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-8px) scale(1.08); } }
    @keyframes float3 { 0%, 100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-15px) scale(0.95); } }
    @keyframes fillup { 0% { height: 0%; opacity: 0; } 5% { opacity: 1; } 100% { height: 60%; opacity: 1; } }
    .bubble-1 { animation: float1 4s ease-in-out infinite; }
    .bubble-2 { animation: float2 5s ease-in-out infinite 0.8s; }
    .bubble-3 { animation: float3 3.5s ease-in-out infinite 1.5s; }
    .water-fill { animation: fillup 1.5s ease-out forwards; }
`;
