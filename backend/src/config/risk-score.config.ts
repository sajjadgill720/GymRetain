/**
 * Configuration for Member Churn Risk Scoring Engine (Phase 1: Rules-Based).
 *
 * Scoring Formula:
 * Total Score = (DaysSinceLastCheckInScore * weight)
 *             + (FrequencyDropScore * weight)
 *             + (PaymentOverdueScore * weight)
 *             + (RecentlyBrokenStreakScore * weight)
 *
 * Normalized score: 0 to 100
 * Low Risk:    0  - 39
 * Medium Risk: 40 - 69
 * High Risk:   70 - 100
 */

export interface RiskScoreWeights {
  daysSinceLastCheckIn: number; // e.g. 0.35 (35%)
  frequencyDrop: number;        // e.g. 0.35 (35%)
  paymentOverdue: number;       // e.g. 0.15 (15%)
  recentlyBrokenStreak: number; // e.g. 0.15 (15%)
}

export interface RiskThresholds {
  daysInactive: {
    low: number;      // <= 3 days -> 0 pts
    moderate: number; // 4 - 7 days -> 50 pts
    high: number;     // 8 - 14 days -> 80 pts
    critical: number; // > 14 days -> 100 pts
  };
  frequencyDropPercentage: {
    moderate: number; // >= 30% drop -> 50 pts
    severe: number;   // >= 60% drop -> 80 pts
    complete: number; // 100% drop (0 visits) -> 100 pts
  };
  brokenStreakDaysWindow: number; // Broken within past 7 days -> triggers penalty
  buckets: {
    mediumThreshold: number; // Score >= 40 is Medium Risk
    highThreshold: number;   // Score >= 70 is High Risk
  };
}

export interface RiskScoreConfig {
  weights: RiskScoreWeights;
  thresholds: RiskThresholds;
}

export const defaultRiskScoreConfig: RiskScoreConfig = {
  weights: {
    daysSinceLastCheckIn: 0.35,
    frequencyDrop: 0.35,
    paymentOverdue: 0.15,
    recentlyBrokenStreak: 0.15,
  },
  thresholds: {
    daysInactive: {
      low: 3,
      moderate: 7,
      high: 14,
      critical: 21,
    },
    frequencyDropPercentage: {
      moderate: 30, // 30% drop vs 4-week average
      severe: 60,   // 60% drop vs 4-week average
      complete: 100, // 0 visits this week when average was > 0
    },
    brokenStreakDaysWindow: 7, // Streak broken in last 7 days
    buckets: {
      mediumThreshold: 40,
      highThreshold: 70,
    },
  },
};
