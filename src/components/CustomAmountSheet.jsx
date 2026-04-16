import React from 'react';

export default function CustomAmountSheet({ show, onClose, customAmount, setCustomAmount, handleCustomSubmit, isUpdating, customInputRef }) {
    return (
        <div className={`absolute inset-0 z-50 flex flex-col justify-end transition-all duration-300 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`bg-white w-full rounded-t-[2.5rem] p-8 pb-12 shadow-2xl relative z-10 transform transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${show ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                <h3 className="text-xl font-bold text-[#1C1C1E] mb-6 text-center">Add Custom Amount</h3>
                <form onSubmit={handleCustomSubmit} className="flex flex-col gap-4">
                    <div className="relative">
                        <input
                            ref={customInputRef}
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            placeholder="200"
                            disabled={isUpdating}
                            className="w-full bg-[#F2F2F7] rounded-2xl px-6 py-4 text-3xl font-bold text-[#1C1C1E] text-center focus:outline-none focus:ring-2 focus:ring-[#6ED8EA]/30 transition-all disabled:opacity-50"
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[#8E8E93] font-bold text-lg">ml</span>
                    </div>
                    <button
                        type="submit"
                        disabled={isUpdating}
                        className={`w-full py-4 bg-[#6ED8EA] text-white rounded-2xl font-bold transition-all text-[15px] mt-2 ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                    >
                        {isUpdating ? 'Adding...' : 'Add Water'}
                    </button>
                </form>
            </div>
        </div>
    );
}
