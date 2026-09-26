import { RetentionService } from '../src/modules/retention/retention.service';
import { defaultRiskScoreConfig } from '../src/config/risk-score.config';

describe('RetentionService - Rules-Based Member Churn Risk Scoring Engine', () => {
  let retentionService: RetentionService;

  beforeEach(() => {
    retentionService = new RetentionService(null as any);
  });

  it('should categorize a highly active, paid-up member as LOW risk', () => {
    // Member checked in 1 day ago, 4 visits this week vs 4.0 rolling avg, payment active, no broken streak
    const result = retentionService.calculateRiskScore(
      1, // daysSinceLastCheckIn
      4, // weeklyVisitsCurrent
      4.0, // fourWeekRollingAvg
      false, // isPaymentOverdue
      false, // isRecentlyBrokenStreak
      defaultRiskScoreConfig,
    );

    expect(result.score).toBeLessThan(40);
    expect(result.level).toBe('LOW');
    expect(result.daysInactiveScore).toBe(0);
    expect(result.frequencyDropScore).toBe(0);
    expect(result.paymentOverdueScore).toBe(0);
    expect(result.brokenStreakScore).toBe(0);
  });

  it('should categorize a member with moderate inactivity or payment overdue as MEDIUM risk', () => {
    // Member checked in 6 days ago (moderate inactivity), visits dropped from 3 to 1, payment overdue
    const result = retentionService.calculateRiskScore(
      6, // daysSinceLastCheckIn
      1, // weeklyVisitsCurrent
      3.0, // fourWeekRollingAvg (67% drop -> severe)
      true, // isPaymentOverdue
      false, // isRecentlyBrokenStreak
      defaultRiskScoreConfig,
    );

    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThan(70);
    expect(result.level).toBe('MEDIUM');
  });

  it('should categorize a severely disengaged member as HIGH risk', () => {
    // Inactive for 22 days (> 21 critical threshold), 0 visits (100% drop), payment overdue, recently broken streak
    const result = retentionService.calculateRiskScore(
      22, // daysSinceLastCheckIn (>= 21 critical threshold)
      0, // weeklyVisitsCurrent
      3.5, // fourWeekRollingAvg (100% drop)
      true, // isPaymentOverdue
      true, // isRecentlyBrokenStreak
      defaultRiskScoreConfig,
    );

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.level).toBe('HIGH');
    expect(result.daysInactiveScore).toBe(100);
    expect(result.frequencyDropScore).toBe(100);
    expect(result.paymentOverdueScore).toBe(100);
    expect(result.brokenStreakScore).toBe(100);
  });

  it('should correctly respect custom configurable weights and thresholds', () => {
    const customConfig = {
      ...defaultRiskScoreConfig,
      weights: {
        daysSinceLastCheckIn: 0.5,
        frequencyDrop: 0.2,
        paymentOverdue: 0.2,
        recentlyBrokenStreak: 0.1,
      },
    };

    const result = retentionService.calculateRiskScore(
      22, // critical days inactive (100 pts * 0.5 = 50 pts)
      0,
      0,
      false,
      false,
      customConfig,
    );

    // 50 (from days) + 60*0.2 (from zero avg fallback) = 62
    expect(result.score).toBeGreaterThanOrEqual(50);
  });
});
