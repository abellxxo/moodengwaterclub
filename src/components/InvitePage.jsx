import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { acceptInvite, getInvite, ensureProfile } from '../friendsService';

export default function InvitePage({ code, user, authResolved, handleLogin, setCurrentView }) {
    const [status, setStatus] = useState('loading'); // loading | needsLogin | accepting | success | error
    const [errorMsg, setErrorMsg] = useState('');

    // Once user is available, try to accept the invite
    useEffect(() => {
        if (!authResolved) return;

        if (!user) {
            // Check if invite is valid before showing login
            getInvite(code).then(invite => {
                if (!invite) {
                    setStatus('error');
                    setErrorMsg('This invite link is invalid or doesn\'t exist.');
                } else {
                    const now = Date.now();
                    const expiresAt = invite.expiresAt?.toMillis?.() || invite.expiresAt;
                    if (now > expiresAt) {
                        setStatus('error');
                        setErrorMsg('This invite has expired. Ask your friend for a new one!');
                    } else {
                        setStatus('needsLogin');
                    }
                }
            }).catch(() => {
                setStatus('error');
                setErrorMsg('Could not verify invite. Please try again.');
            });
            return;
        }

        // User is logged in → accept invite
        setStatus('accepting');
        (async () => {
            try {
                await ensureProfile(user);
                await acceptInvite(code, user.uid);
                setStatus('success');
                // Redirect to friends after a short delay
                setTimeout(() => {
                    window.history.replaceState({}, '', '/');
                    setCurrentView('friends');
                }, 1500);
            } catch (err) {
                console.error('Accept invite error:', err);
                setStatus('error');
                setErrorMsg(err.message || 'Failed to accept invite.');
            }
        })();
    }, [authResolved, user, code]);

    return (
        <div className="bg-[#ffffff] sm:bg-[#EAB0BE] fixed inset-0 w-full h-full flex items-center justify-center font-sans text-[#1C1C1E] selection:bg-[#B8E9F3] antialiased overflow-hidden sm:py-10">
            <main className="bg-[#ffffff] w-full h-full sm:h-[844px] sm:max-w-[390px] sm:rounded-[3rem] overflow-hidden flex flex-col items-center justify-center relative sm:shadow-2xl sm:ring-1 sm:ring-[#EAB0BE]/30 mx-auto px-8">
                {/* Background blobs */}
                <div className="absolute bottom-[-5%] right-[-10%] w-[80vw] max-w-[400px] h-[80vw] max-h-[400px] bg-[#EAB0BE]/50 rounded-full blur-[80px] pointer-events-none z-0"></div>
                <div className="absolute bottom-[5%] left-[-10%] w-[60vw] max-w-[350px] h-[60vw] max-h-[350px] bg-[#B8E9F3]/50 rounded-full blur-[80px] pointer-events-none z-0"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    {status === 'loading' && (
                        <>
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7dd8d8] to-[#4a90d9] flex items-center justify-center mb-6 animate-pulse">
                                <span className="text-3xl">💧</span>
                            </div>
                            <h2 className="text-xl font-bold text-[#1C1C1E] mb-2">Checking invite…</h2>
                            <p className="text-[#8E8E93] text-[13px]">Hold on a sec</p>
                        </>
                    )}

                    {status === 'needsLogin' && (
                        <>
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7dd8d8] to-[#4a90d9] flex items-center justify-center mb-6 shadow-lg shadow-[#7dd8d8]/30">
                                <span className="text-4xl">🤝</span>
                            </div>
                            <h2 className="text-2xl font-bold text-[#1C1C1E] mb-2">You've been invited!</h2>
                            <p className="text-[#8E8E93] text-[14px] mb-8">Sign in to join the Moodeng Water Club</p>
                            <button
                                onClick={handleLogin}
                                className="w-full py-4 bg-gradient-to-r from-[#7dd8d8] to-[#4a90d9] text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-all shadow-lg shadow-[#7dd8d8]/20"
                            >
                                Sign in with Google
                            </button>
                        </>
                    )}

                    {status === 'accepting' && (
                        <>
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7dd8d8] to-[#4a90d9] flex items-center justify-center mb-6 animate-pulse">
                                <span className="text-3xl">⏳</span>
                            </div>
                            <h2 className="text-xl font-bold text-[#1C1C1E] mb-2">Joining the club…</h2>
                            <p className="text-[#8E8E93] text-[13px]">Almost there!</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-20 h-20 rounded-full bg-[#34C759]/10 flex items-center justify-center mb-6">
                                <span className="text-4xl">🎉</span>
                            </div>
                            <h2 className="text-2xl font-bold text-[#1C1C1E] mb-2">You're in!</h2>
                            <p className="text-[#8E8E93] text-[14px]">Redirecting to your friends…</p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-20 h-20 rounded-full bg-[#FF3B30]/10 flex items-center justify-center mb-6">
                                <span className="text-4xl">😢</span>
                            </div>
                            <h2 className="text-xl font-bold text-[#1C1C1E] mb-2">Oops!</h2>
                            <p className="text-[#8E8E93] text-[14px] mb-8">{errorMsg}</p>
                            <button
                                onClick={() => {
                                    window.history.replaceState({}, '', '/');
                                    window.location.reload();
                                }}
                                className="px-8 py-3 bg-[#F2F2F7] rounded-2xl font-bold text-[14px] text-[#1C1C1E] active:scale-95 transition-all"
                            >
                                Go Home
                            </button>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
