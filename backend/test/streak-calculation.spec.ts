import { StreaksService } from '../src/modules/streaks/streaks.service';
import { addDays, subDays } from 'date-fns';

describe('StreaksService - Consecutive Check-In & Streak Calculation Logic', () => {
  let streaksService: StreaksService;

  beforeEach(() => {
    streaksService = new StreaksService(null as any);
  });

  it('should initialize streak to 1 on the very first check-in', () => {
    const today = new Date();
    const result = streaksService.calculateStreakUpdate(null, today);

    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.isIncremented).toBe(true);
    expect(result.isBroken).toBe(false);
    expect(result.isFirstVisitToday).toBe(true);
  });

  it('should NOT increment streak on multiple visits on the same calendar day', () => {
    const todayMorning = new Date(2026, 8, 26, 9, 0, 0);
    const todayEvening = new Date(2026, 8, 26, 18, 30, 0);

    const initialStreakRecord = {
      currentStreak: 5,
      longestStreak: 10,
      lastCheckInDate: todayMorning,
    };

    const result = streaksService.calculateStreakUpdate(
      initialStreakRecord,
      todayEvening,
    );

    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(10);
    expect(result.isIncremented).toBe(false);
    expect(result.isFirstVisitToday).toBe(false);
    expect(result.isBroken).toBe(false);
  });

  it('should increment streak by 1 on consecutive calendar day visits', () => {
    const yesterday = new Date(2026, 8, 25, 14, 0, 0);
    const today = new Date(2026, 8, 26, 10, 0, 0);

    const initialStreakRecord = {
      currentStreak: 7,
      longestStreak: 7,
      lastCheckInDate: yesterday,
    };

    const result = streaksService.calculateStreakUpdate(
      initialStreakRecord,
      today,
    );

    expect(result.currentStreak).toBe(8);
    expect(result.longestStreak).toBe(8);
    expect(result.isIncremented).toBe(true);
    expect(result.isBroken).toBe(false);
    expect(result.isFirstVisitToday).toBe(true);
  });

  it('should break streak and reset to 1 if gap is greater than 1 day', () => {
    const threeDaysAgo = subDays(new Date(), 3);
    const today = new Date();

    const initialStreakRecord = {
      currentStreak: 15,
      longestStreak: 20,
      lastCheckInDate: threeDaysAgo,
    };

    const result = streaksService.calculateStreakUpdate(
      initialStreakRecord,
      today,
    );

    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(20); // Longest streak preserved!
    expect(result.isBroken).toBe(true);
    expect(result.isIncremented).toBe(false);
    expect(result.isFirstVisitToday).toBe(true);
    expect(result.brokenAt).toBeDefined();
  });

  it('should correctly update longestStreak when currentStreak exceeds it', () => {
    const yesterday = subDays(new Date(), 1);
    const today = new Date();

    const initialStreakRecord = {
      currentStreak: 9,
      longestStreak: 9,
      lastCheckInDate: yesterday,
    };

    const result = streaksService.calculateStreakUpdate(
      initialStreakRecord,
      today,
    );

    expect(result.currentStreak).toBe(10);
    expect(result.longestStreak).toBe(10);
    expect(result.isIncremented).toBe(true);
  });
});
