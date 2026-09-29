# AI Retention Intelligence & Analytics Layer

## Overview
GymRetain features a privacy-preserving AI assistant and deep retention analytics modal directly accessible from the dashboard action header next to **+ Check-In Kiosk** and **At-Risk Queue**.

---

## 1. Zero-PII Privacy Architecture
Under strict GDPR and data privacy standards, **no Personally Identifiable Information (PII)** is ever sent to external inference models.
- **Never Sent**: Member names, phone numbers, email addresses, gym IDs, database PKs.
- **Only Mathematical Signals Transmitted**:
  - `missingDays` (integer, e.g. 9 days absent)
  - `currentStreak` (integer, e.g. 0 days active streak)
  - `longestStreak` (integer, e.g. 14 days peak habit)
  - `frequencyDrop` (percentage drop in weekly check-ins, e.g. 75%)
  - `planType` (e.g. `MONTHLY_STANDARD`)

---

## 2. In-Depth Retention Analytics
The analytics suite visualizes:
1. **Member Inactivity Spectrum**:
   - `1-3 Days Absent` (Healthy Habit, 59% of members)
   - `4-7 Days Absent` (Early Warning, 20% of members)
   - `8-14 Days Absent` (High Churn Window, 13% of members)
   - `15+ Days Absent` (Critical Silent Churn, 8% of members)
2. **Absence vs. Churn Sigmoid Fit Model**:
   - Step probability curve quantifying churn likelihood as absence increases.
   - Inflection point at day 8 where churn risk accelerates past 50%.
3. **Anonymized Signal Inference Simulator**:
   - Interactive sliders allowing gym operators to test scenarios and preview retention recommendations.
4. **Empathetic WhatsApp Re-Engagement Templates**:
   - High-conversion, guilt-free re-entry messages with one-click copy functionality.

---

## 3. Backend Inference Layer
- **Groq Integration**: If `GROQ_API_KEY` is present in the environment, requests are routed to Groq's `llama-3.3-70b-versatile` endpoint with strict temperature tuning (0.3).
- **Graceful Fallback**: If no Groq API key is present or the external call fails, the built-in GymRetain inference reasoning engine computes the sigmoid churn probability and generates tailored workout re-entry advice.

---

## 4. UI Compliance
- Clickable buttons feature depth shadows (`btn-shadow`).
- Supports **Foxstocks** (light theme) and **Vision** (dark theme) color palettes.
