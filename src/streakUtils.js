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

// Returns both the count and the logical start date of the current streak
export const calculateStreakDetails = (history = {}, goal = 1500, streakResetDate = null) => {
    let currentStreak = 0;
    let checkDate = new Date();
    let safety = 0;
    const today = getLogicalDateStr();
    let startDateStr = today;

    while (safety < 180) {
        safety++;
        const str = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

        if ((history[str] || 0) >= goal) {
            currentStreak++;
            startDateStr = str; // The oldest date we successfully find is the start date
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            if (str === today) {
                checkDate.setDate(checkDate.getDate() - 1);
                continue;
            }
            break;
        }
    }
    
    // If streak is 0, the start date defaults to today
    if (currentStreak === 0) {
        startDateStr = today;
    }
    
    return { count: currentStreak, startDate: startDateStr };
};
