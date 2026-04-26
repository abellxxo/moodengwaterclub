// Shared streak calculation — extracted from AppContext.jsx so it's reusable for friend data.
// The logic here is identical to the original useMemo in useAppState().

export const getLogicalDateStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const calculateStreak = (history = {}, goal = 1500, streakResetDate = null) => {
    let currentStreak = 0;
    let checkDate = new Date();
    let safety = 0;
    const today = getLogicalDateStr();

    while (safety < 180) {
        safety++;
        const str = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

        if ((history[str] || 0) >= goal) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            if (str === today) {
                checkDate.setDate(checkDate.getDate() - 1);
                continue;
            }
            break;
        }
    }
    return currentStreak;
};
