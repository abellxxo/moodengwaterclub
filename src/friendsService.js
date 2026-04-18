// Friends feature — all Firestore operations for groups, invites, profiles, and friend data loading.

import {
    doc, getDoc, setDoc, collection, query,
    where, getDocs, arrayUnion, Timestamp
} from 'firebase/firestore';
import { db, APP_ID } from './firebase';
import { getLogicalDateStr, calculateStreak } from './streakUtils';

// ── Deterministic avatar gradient from UID ─────────────────
const FRIEND_GRADIENTS = [
    ['#F093FB', '#F5576C'],
    ['#43E97B', '#38F9D7'],
    ['#FA709A', '#FEE140'],
    ['#A18CD1', '#FBC2EB'],
    ['#FF9A9E', '#FECFEF'],
    ['#667EEA', '#764BA2'],
    ['#F6D365', '#FDA085'],
    ['#89F7FE', '#66A6FF'],
];

export const getGradientForUid = (uid) => {
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
        hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    }
    return FRIEND_GRADIENTS[Math.abs(hash) % FRIEND_GRADIENTS.length];
};

// ── Random code generator ──────────────────────────────────
const generateCode = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// ── Profile ────────────────────────────────────────────────

export const ensureProfile = async (user) => {
    if (!user) return null;
    const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'profile');
    const snap = await getDoc(profileRef);
    if (!snap.exists()) {
        const username = user.email?.split('@')[0] || 'user';
        const profileData = { username, uid: user.uid };
        await setDoc(profileRef, profileData);
        return profileData;
    }
    return snap.data();
};

// ── Groups ─────────────────────────────────────────────────

export const getUserGroup = async (uid) => {
    const groupsRef = collection(db, 'artifacts', APP_ID, 'groups');
    const q = query(groupsRef, where('members', 'array-contains', uid));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const groupDoc = snap.docs[0];
    return { id: groupDoc.id, ...groupDoc.data() };
};

export const createGroup = async (uid) => {
    const groupId = generateCode(12);
    const groupRef = doc(db, 'artifacts', APP_ID, 'groups', groupId);
    const groupData = {
        members: [uid],
        createdBy: uid,
        createdAt: Timestamp.now(),
    };
    await setDoc(groupRef, groupData);
    return { id: groupId, ...groupData };
};

// ── Invites ────────────────────────────────────────────────

export const createInvite = async (uid, groupId) => {
    const code = generateCode(8);
    const inviteRef = doc(db, 'artifacts', APP_ID, 'invites', code);
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000);
    await setDoc(inviteRef, {
        groupId,
        createdBy: uid,
        createdAt: now,
        expiresAt,
    });
    return code;
};

export const getInvite = async (code) => {
    const inviteRef = doc(db, 'artifacts', APP_ID, 'invites', code);
    const snap = await getDoc(inviteRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
};

export const acceptInvite = async (code, uid) => {
    const invite = await getInvite(code);
    if (!invite) throw new Error('Invite not found');

    // Check expiry
    const now = Date.now();
    const expiresAt = invite.expiresAt?.toMillis?.() || invite.expiresAt;
    if (now > expiresAt) throw new Error('Invite has expired');

    // Check group exists
    const groupRef = doc(db, 'artifacts', APP_ID, 'groups', invite.groupId);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) throw new Error('Group not found');

    // Already a member? Skip write.
    const groupData = groupSnap.data();
    if (groupData.members.includes(uid)) {
        return invite.groupId;
    }

    // Add to group
    await setDoc(groupRef, { members: arrayUnion(uid) }, { merge: true });

    // Also ensure the accepting user's group reference is created
    // (the user might not have had a group before)
    return invite.groupId;
};

// ── Friend Data Loading ────────────────────────────────────

export const getFriendProfile = async (uid) => {
    const profileRef = doc(db, 'artifacts', APP_ID, 'users', uid, 'data', 'profile');
    const snap = await getDoc(profileRef);
    return snap.exists() ? snap.data() : null;
};

export const getFriendTracker = async (uid) => {
    const trackerRef = doc(db, 'artifacts', APP_ID, 'users', uid, 'data', 'tracker');
    const snap = await getDoc(trackerRef);
    return snap.exists() ? snap.data() : null;
};

export const loadFriendsData = async (groupMembers, selfUid) => {
    const friendUids = groupMembers.filter(uid => uid !== selfUid);
    const today = getLogicalDateStr();

    const friends = await Promise.all(friendUids.map(async (uid) => {
        const [profile, tracker] = await Promise.all([
            getFriendProfile(uid),
            getFriendTracker(uid),
        ]);

        const goal = tracker?.goal || 1500;
        const current = tracker?.history?.[today] || 0;
        const history = tracker?.history || {};
        const streakResetDate = tracker?.streakResetDate || null;

        const streak = calculateStreak(history, goal, streakResetDate);
        const username = profile?.username || 'Unknown';
        const gradient = getGradientForUid(uid);

        return {
            id: uid,
            name: username,
            initials: username.substring(0, 2).toUpperCase(),
            gradient,
            goal,
            current,
            streak,
            uid,
        };
    }));

    return friends;
};

// ── Invite Flow (combined: ensure group + create invite) ───

export const generateInviteLink = async (uid) => {
    // Get or create the user's group
    let group = await getUserGroup(uid);
    if (!group) {
        group = await createGroup(uid);
    }

    // Create an invite code for this group
    const code = await createInvite(uid, group.id);
    return {
        code,
        link: `https://moodengwaterclub.vercel.app/invite/${code}`,
        groupId: group.id,
    };
};
