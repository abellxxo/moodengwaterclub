import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppState } from '../AppContext';
import { auth } from '../firebase';
import {
    getUserGroup, subscribeFriendsData, generateInviteLink, getGradientForUid
} from '../friendsService';
import SplashScreen from './SplashScreen';

// ── Fallback mock data (used if Firestore returns empty, for local testing) ──
const MOCK_FRIENDS = [
    {
        id: 'f1', name: 'Sophia', initials: 'SP',
        gradient: ['#F093FB', '#F5576C'],
        goal: 1500, current: 1500, streak: 12,
    },
    {
        id: 'f2', name: 'Marcus', initials: 'MC',
        gradient: ['#43E97B', '#38F9D7'],
        goal: 2000, current: 1340, streak: 5,
    },
    {
        id: 'f3', name: 'Hana', initials: 'HN',
        gradient: ['#FA709A', '#FEE140'],
        goal: 1500, current: 620, streak: 2,
    },
];

const REMIND_MESSAGES = [
    { emoji: '💧', text: "Hey, have you drunk water today?" },
    { emoji: '🥤', text: "Your bottle's looking thirsty rn!" },
    { emoji: '🚨', text: "HYDRATE OR DIEDRATE bestie" },
];

// ── Small water bottle for friend cards ────────────────────
function MiniBottle({ progress }) {
    const fill = progress > 0 ? Math.max(progress, 5) : 0;
    return (
        <div className="w-32 h-48 rounded-[2.5rem] p-1.5 bg-gradient-to-b from-[#F2F2F7] to-white shadow-[inset_0_2px_16px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden flex items-end">
            <div
                className="w-full bg-gradient-to-t from-[#007AFF] via-[#148EFF] to-[#5AC8FA] relative rounded-[2rem] overflow-hidden transition-all duration-[1000ms] ease-out shadow-[0_-6px_20px_rgba(0,122,255,0.3)]"
                style={{ height: `${fill}%`, opacity: fill === 0 ? 0 : 1 }}
            >
                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white/40 to-transparent rounded-[100%] scale-150 -translate-y-1/2"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-white/10"></div>
            </div>
            {/* Glass highlights */}
            <div className="absolute top-6 bottom-6 left-4 w-3 bg-white/50 rounded-full blur-[3px] pointer-events-none"></div>
            <div className="absolute top-12 bottom-12 right-3 w-1 bg-white/30 rounded-full blur-[1.5px] pointer-events-none"></div>
        </div>
    );
}

// ── Status Pill ────────────────────────────────────────────
function StatusPill({ progress, goalMet }) {
    if (goalMet) {
        return (
            <span className="text-[12px] font-semibold px-4 py-1.5 rounded-full bg-[#34C759]/15 text-[#248A3D]">
                Daily Goal Reached! 🎉
            </span>
        );
    }
    if (progress >= 60) {
        return (
            <span className="text-[12px] font-semibold px-4 py-1.5 rounded-full bg-[#007AFF]/10 text-[#0055CC]">
                Almost there! 💪
            </span>
        );
    }
    return (
        <span className="text-[12px] font-semibold px-4 py-1.5 rounded-full bg-[#FFD60A]/15 text-[#8B6914]">
            Keep drinking! 💧
        </span>
    );
}

// ── Add Friend Sheet ───────────────────────────────────────
function AddFriendSheet({ show, onClose, user }) {
    const [copied, setCopied] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (show && user) {
            setCopied(false);
            setGenerating(true);
            generateInviteLink(user.uid)
                .then(({ link }) => {
                    setInviteLink(link);
                    setGenerating(false);
                })
                .catch(err => {
                    console.error('Failed to generate invite:', err);
                    setInviteLink('Error generating link');
                    setGenerating(false);
                });
        }
    }, [show, user]);

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink).catch(() => {});
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
            onClose();
        }, 1500);
    };

    return (
        <div className={`absolute inset-0 z-50 flex flex-col justify-end transition-all duration-300 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`bg-white w-full rounded-t-[2.5rem] p-8 pb-12 shadow-2xl relative z-10 transform transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${show ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                <h3 className="text-xl font-bold text-[#1C1C1E] mb-1 text-center">Add a Mood 💧</h3>
                <p className="text-[#8E8E93] text-[13px] font-medium text-center mb-6">Share this link — they'll join instantly</p>

                {/* Invite link box */}
                <div className="bg-[#F2F2F7] rounded-2xl px-5 py-4 mb-5 min-h-[52px] flex items-center justify-center">
                    {generating ? (
                        <p className="text-[13px] text-[#8E8E93] text-center animate-pulse">Generating link…</p>
                    ) : (
                        <p className="text-[13px] font-mono text-[#1C1C1E] text-center break-all select-all">{inviteLink}</p>
                    )}
                </div>

                {/* Copy button */}
                <button
                    onClick={handleCopy}
                    disabled={generating}
                    className={`w-full py-4 rounded-2xl font-bold text-[15px] transition-all duration-300 ${
                        copied
                            ? 'bg-[#34C759] text-white'
                            : generating
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-[#7dd8d8] to-[#4a90d9] text-white active:scale-[0.98]'
                    }`}
                >
                    {copied ? 'Copied! ✓' : generating ? 'Please wait…' : 'Copy Link'}
                </button>
            </div>
        </div>
    );
}

// ── Remind Sheet ───────────────────────────────────────────
function RemindSheet({ show, onClose, friend, onSent, user }) {
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (show) {
            setSelectedIdx(0);
            setSending(false);
        }
    }, [show]);

    const handleSend = async () => {
        if (!friend || !user) return;
        setSending(true);

        try {
            // Get the current user's ID token for auth
            const idToken = await user.getIdToken();

            const res = await fetch('/api/remind', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    targetUid: friend.uid || friend.id,
                    message: `${REMIND_MESSAGES[selectedIdx].emoji} ${REMIND_MESSAGES[selectedIdx].text}`,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error('Remind API error:', errData);
            }
        } catch (err) {
            console.error('Failed to send reminder:', err);
        }

        // Always mark as sent (UX: don't let API failures block the UI)
        onSent(friend?.id);
        setTimeout(() => onClose(), 600);
    };

    if (!friend) return null;

    const gradient = friend.gradient || ['#8E8E93', '#8E8E93'];

    return (
        <div className={`absolute inset-0 z-50 flex flex-col justify-end transition-all duration-300 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`bg-white w-full rounded-t-[2.5rem] p-8 pb-12 shadow-2xl relative z-10 transform transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${show ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>

                {/* Friend avatar + name */}
                <div className="flex items-center gap-3 mb-4 justify-center">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
                    >
                        {friend.initials}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#1C1C1E]">Remind {friend.name} 💧</h3>
                        <p className="text-[#8E8E93] text-[12px] font-medium">Pick a message to send:</p>
                    </div>
                </div>

                {/* Message options */}
                <div className="flex flex-col gap-2.5 mb-6">
                    {REMIND_MESSAGES.map((msg, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedIdx(idx)}
                            className={`w-full text-left px-5 py-3.5 rounded-2xl border-2 transition-all duration-200 ${
                                selectedIdx === idx
                                    ? 'border-[#4a90d9] bg-[#4a90d9]/5'
                                    : 'border-gray-100 bg-[#F9F9FB] hover:border-gray-200'
                            }`}
                        >
                            <span className="text-[14px] font-medium text-[#1C1C1E]">
                                {msg.emoji} {msg.text}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Send button */}
                <button
                    onClick={handleSend}
                    disabled={sending}
                    className={`w-full py-4 rounded-2xl font-bold text-[15px] transition-all duration-300 ${
                        sending
                            ? 'bg-[#34C759] text-white'
                            : 'bg-gradient-to-r from-[#7dd8d8] to-[#4a90d9] text-white active:scale-[0.98]'
                    }`}
                >
                    {sending ? 'Sent! ✓' : 'Send Reminder 🔔'}
                </button>
            </div>
        </div>
    );
}

// ── Empty State ────────────────────────────────────────────
function EmptyState({ onAdd }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-24 h-24 rounded-full bg-[#F2F2F7] flex items-center justify-center mb-6">
                <span className="text-5xl">👀</span>
            </div>
            <h2 className="text-xl font-bold text-[#1C1C1E] mb-2">No moods yet</h2>
            <p className="text-[#8E8E93] text-[14px] mb-8">
                Add moods so you can track each other's hydration journey together!
            </p>
            <button
                onClick={onAdd}
                className="px-8 py-4 bg-gradient-to-r from-[#7dd8d8] to-[#4a90d9] text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-all shadow-lg shadow-[#7dd8d8]/20"
            >
                + Add a Mood
            </button>
        </div>
    );
}

// ── Main FriendsView ───────────────────────────────────────
export default function FriendsView({ onBack }) {
    const s = useAppState();
    const user = s.user;

    const [activeIdx, setActiveIdx] = useState(0);
    const [showAddSheet, setShowAddSheet] = useState(false);
    const [showRemindSheet, setShowRemindSheet] = useState(false);
    const [remindTarget, setRemindTarget] = useState(null);
    const [sentReminders, setSentReminders] = useState({});

    // Firestore-loaded friends
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [useMock, setUseMock] = useState(false);
    const unsubRef = useRef(null);

    // ── Load friends from Firestore ────────────────────────
    const loadFriends = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        if (unsubRef.current) {
            unsubRef.current();
            unsubRef.current = null;
        }

        try {
            const group = await getUserGroup(user.uid);
            if (!group || !group.members || group.members.length <= 1) {
                // No group or alone in group
                setFriends([]);
                setUseMock(false);
                setLoading(false);
                return;
            }
            
            const unsubscribe = await subscribeFriendsData(group.members, user.uid, (friendsData) => {
                if (friendsData.length > 0) {
                    setFriends(friendsData);
                    setUseMock(false);
                } else {
                    setFriends([]);
                    setUseMock(false);
                }
                setLoading(false);
            });
            unsubRef.current = unsubscribe;

        } catch (err) {
            console.error('Error loading friends:', err);
            // Fallback to mock data for local testing
            setFriends(MOCK_FRIENDS);
            setUseMock(true);
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadFriends();
        
        return () => {
            if (unsubRef.current) {
                unsubRef.current();
                unsubRef.current = null;
            }
        };
    }, [loadFriends]);

    useEffect(() => {
        const handleShowAdd = () => setShowAddSheet(true);
        document.addEventListener('showAddMoodSheet', handleShowAdd);
        return () => document.removeEventListener('showAddMoodSheet', handleShowAdd);
    }, []);

    // Refresh friends when add sheet closes (user may have created a group)
    const handleAddSheetClose = () => {
        setShowAddSheet(false);
    };

    // ── Swipe / Drag handling ──────────────────────────────
    const containerRef = useRef(null);
    const dragStartX = useRef(0);
    const dragDelta = useRef(0);
    const isDragging = useRef(false);
    const [dragOffset, setDragOffset] = useState(0);

    const displayFriends = friends;

    const goTo = useCallback((idx) => {
        const clamped = Math.max(0, Math.min(displayFriends.length - 1, idx));
        setActiveIdx(clamped);
        setDragOffset(0);
    }, [displayFriends.length]);

    const handleDragStart = (clientX) => {
        isDragging.current = true;
        dragStartX.current = clientX;
        dragDelta.current = 0;
    };

    const handleDragMove = (clientX) => {
        if (!isDragging.current) return;
        dragDelta.current = clientX - dragStartX.current;
        setDragOffset(dragDelta.current);
    };

    const handleDragEnd = () => {
        if (!isDragging.current) return;
        isDragging.current = false;
        const threshold = 60;
        if (dragDelta.current < -threshold) {
            goTo(activeIdx + 1);
        } else if (dragDelta.current > threshold) {
            goTo(activeIdx - 1);
        } else {
            setDragOffset(0);
        }
    };

    // Touch events
    const onTouchStart = (e) => handleDragStart(e.touches[0].clientX);
    const onTouchMove = (e) => handleDragMove(e.touches[0].clientX);
    const onTouchEnd = () => handleDragEnd();

    // Mouse events
    const onMouseDown = (e) => { e.preventDefault(); handleDragStart(e.clientX); };
    const onMouseMove = (e) => { if (isDragging.current) handleDragMove(e.clientX); };
    const onMouseUp = () => handleDragEnd();
    const onMouseLeave = () => { if (isDragging.current) handleDragEnd(); };

    // ── Remind handling ────────────────────────────────────
    const handleRemindClick = (friend) => {
        setRemindTarget(friend);
        setShowRemindSheet(true);
    };

    const handleReminderSent = (friendId) => {
        setSentReminders(prev => ({ ...prev, [friendId]: true }));
    };

    // ── Loading state ──────────────────────────────────────
    if (loading) {
        return <SplashScreen type="auth" />;
    }

    return (
        <>
            {/* Empty state or Carousel */}
            {displayFriends.length === 0 ? (
                <EmptyState onAdd={() => setShowAddSheet(true)} />
            ) : (
                <div className="flex-1 relative overflow-hidden">
                    <div
                        ref={containerRef}
                        className="w-full h-full relative cursor-grab active:cursor-grabbing select-none touch-pan-y"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                        onMouseDown={onMouseDown}
                        onMouseMove={onMouseMove}
                        onMouseUp={onMouseUp}
                        onMouseLeave={onMouseLeave}
                    >
                        {displayFriends.map((friend, idx) => {
                            const isActive = idx === activeIdx;
                            const progress = Math.min((friend.current / friend.goal) * 100, 100);
                            const goalMet = friend.current >= friend.goal;
                            const reminderSent = sentReminders[friend.id];
                            const gradient = friend.gradient || getGradientForUid(friend.id);

                            let cardOpacity = 0;
                            let cardScale = 0.95;
                            let translateX = 0;

                            if (isActive) {
                                cardOpacity = 1;
                                cardScale = 1;
                                translateX = dragOffset * 0.3;
                            }

                            return (
                                <div
                                    key={friend.id}
                                    className="absolute inset-0 w-full h-full flex flex-col items-center justify-start pt-6 pb-16 px-6 overflow-y-auto no-scrollbar"
                                    style={{
                                        opacity: cardOpacity,
                                        transform: `scale(${cardScale}) translateX(${translateX}px)`,
                                        transition: isDragging.current ? 'none' : 'all 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                        pointerEvents: isActive ? 'auto' : 'none',
                                        zIndex: isActive ? 10 : 0,
                                    }}
                                >
                                    {/* Avatar */}
                                    <div
                                        className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4"
                                        style={{
                                            background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                                            boxShadow: `0 8px 24px ${gradient[0]}40`,
                                        }}
                                    >
                                        {friend.initials}
                                    </div>

                                    {/* Name */}
                                    <h2 className="text-2xl font-bold text-[#1C1C1E] mb-1">{friend.name}</h2>

                                    {/* Streak */}
                                    <p className="text-[#8E8E93] text-[13px] font-medium mb-5">
                                        🔥 {friend.streak} day streak
                                    </p>

                                    {/* Water Count */}
                                    <div className="flex items-baseline space-x-1 justify-center mb-5">
                                        <span className="text-[56px] font-medium tracking-[-0.05em] text-[#1C1C1E] leading-none">
                                            {friend.current.toLocaleString()}
                                        </span>
                                        <span className="text-lg font-medium tracking-tight text-[#8E8E93]">
                                            / {friend.goal.toLocaleString()} ml
                                        </span>
                                    </div>

                                    {/* Water Bottle */}
                                    <div className="relative flex justify-center items-center mb-5">
                                        <MiniBottle progress={progress} />
                                    </div>

                                    {/* Status Pill */}
                                    <div className="mb-5">
                                        <StatusPill progress={progress} goalMet={goalMet} />
                                    </div>

                                    {/* Remind Button */}
                                    {goalMet ? (
                                        <button
                                            disabled
                                            className="px-6 py-3 rounded-full border-2 border-[#34C759]/30 text-[#34C759] text-[13px] font-bold opacity-80 cursor-default"
                                        >
                                            ✅ Already crushed it!
                                        </button>
                                    ) : reminderSent ? (
                                        <button
                                            disabled
                                            className="px-6 py-3 rounded-full border-2 border-[#4a90d9]/30 text-[#4a90d9] text-[13px] font-bold cursor-default"
                                        >
                                            ✓ Reminder sent!
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleRemindClick(friend)}
                                            className="px-6 py-3 rounded-full border-2 border-gray-200 text-[#1C1C1E] text-[13px] font-bold hover:border-[#4a90d9] hover:text-[#4a90d9] active:scale-95 transition-all"
                                        >
                                            🔔 Remind to drink
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Dot Indicators */}
                    <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2 z-20">
                        {displayFriends.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => goTo(idx)}
                                className={`rounded-full transition-all duration-300 ${
                                    idx === activeIdx
                                        ? 'w-6 h-2.5 bg-gradient-to-r from-[#7dd8d8] to-[#4a90d9]'
                                        : 'w-2.5 h-2.5 bg-[#D1D1D6] hover:bg-[#AEAEB2]'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Bottom Sheets */}
            <AddFriendSheet show={showAddSheet} onClose={handleAddSheetClose} user={user} />
            <RemindSheet
                show={showRemindSheet}
                onClose={() => setShowRemindSheet(false)}
                friend={remindTarget}
                onSent={handleReminderSent}
                user={user}
            />
        </>
    );
}
