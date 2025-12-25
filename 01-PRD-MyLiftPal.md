# Product Requirements Document (PRD)

**Product Name:** MyLiftPal  
**Version:** 1.0  
**Author:** Product Team  
**Last Updated:** December 2024  
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Objectives](#3-goals--objectives)
4. [Target Users](#4-target-users)
5. [User Stories](#5-user-stories)
6. [Feature Requirements](#6-feature-requirements)
7. [Release Phases](#7-release-phases)
8. [Success Metrics](#8-success-metrics)
9. [Out of Scope](#9-out-of-scope)
10. [Assumptions & Dependencies](#10-assumptions--dependencies)
11. [Risks & Mitigations](#11-risks--mitigations)

---

## 1. Executive Summary

MyLiftPal is a Progressive Web Application (PWA) designed for tracking hypertrophy-focused weight training. The application enables users to plan periodized training cycles (training blocks), log workouts with detailed set/rep/weight data, and monitor weekly training volume per muscle group to optimize muscle growth.

The app differentiates from existing solutions (primarily RP Hypertrophy) by providing:
- Transparent weekly volume tracking with visual indicators
- Time estimation that accounts for progressive overload across a training block
- Offline-first capability for reliable gym use
- User-extensible exercise library with equipment aliasing

**Target Launch:** Q2 2025  
**Initial Users:** Private beta (5-10 users)  
**Commercial Intent:** Non-commercial / Personal use

---

## 2. Problem Statement

### Current State

Intermediate and advanced lifters following hypertrophy-focused periodization programs face several challenges with existing workout tracking solutions:

1. **Volume Blindness:** Current apps allow users to program workouts by day (e.g., "Push Day") without visibility into total weekly volume per muscle group. Users can inadvertently undertrain or overtrain specific muscles.

2. **Time Unpredictability:** Progressive overload programs add sets each week, causing workout duration to increase significantly (often 40-80% longer by week 6). Users are surprised by time requirements and forced to cut workouts short.

3. **Offline Unreliability:** Gym environments often have poor cellular connectivity. Web-based training apps (like RP Hypertrophy) require internet access, causing frustration and data loss.

4. **Exercise Library Friction:** Gym equipment names vary by manufacturer. When a user's gym has a "Hammer Strength Iso-Lateral Row" but the app only lists "Machine Row," users must manually create custom exercises without any historical data.

5. **Black Box Progression:** Apps recommend weights and reps without explaining the reasoning, making it difficult for users to learn and trust the system.

### Desired State

A training app that provides:
- Real-time visibility into weekly muscle volume with clear optimal ranges
- Accurate time projections for every week of a training block
- Reliable offline functionality for gym use
- Flexible exercise matching that accommodates equipment variations
- Transparent progression logic that educates users

---

## 3. Goals & Objectives

### Primary Goals

| Goal | Description | Measurement |
|------|-------------|-------------|
| **G1** | Enable users to track weekly volume per muscle group | Users can view sets/muscle/week during planning and logging |
| **G2** | Provide accurate workout time estimation | Estimates within 15% of actual duration |
| **G3** | Support offline workout logging | Users can complete full workouts without connectivity |
| **G4** | Reduce exercise setup friction | Users can find/add exercises in <30 seconds |

### Secondary Goals

| Goal | Description | Measurement |
|------|-------------|-------------|
| **G5** | Enable voice-based set logging | Hands-free logging with >90% accuracy |
| **G6** | Support historical data import via photo | OCR extraction with >80% field accuracy |
| **G7** | Explain progression recommendations | Every recommendation includes reasoning text |

### Business Objectives

- Validate product-market fit with small user group
- Iterate based on real-world gym usage feedback
- Build foundation for potential future commercial release

---

## 4. Target Users

### Primary Persona: "The Informed Lifter"

**Demographics:**
- Age: 25-45
- Gender: Any
- Training experience: 2+ years of consistent resistance training
- Knowledge level: Understands periodization, progressive overload, volume concepts

**Behaviors:**
- Follows structured training programs (PPL, Upper/Lower, etc.)
- Tracks workouts digitally or on paper
- Researches training methodology (watches fitness YouTube, reads articles)
- Values efficiency and data-driven decisions

**Pain Points:**
- Spends mental energy calculating if volume is sufficient
- Workouts run long unexpectedly
- Loses workout data due to app connectivity issues
- Manually recreates exercises when switching gyms

**Goals:**
- Maximize muscle growth efficiently
- Stay within time constraints
- Trust that programming is optimal
- Focus on execution, not planning

### Secondary Persona: "The Coached Athlete"

**Demographics:**
- Age: 20-35
- Works with a trainer or coach who prescribes workouts
- May use paper logs during sessions

**Behaviors:**
- Receives workout prescriptions externally
- Needs to digitize handwritten logs post-session
- Wants historical data for coach review

**Relevant Features:**
- Photo-to-data import
- Data export capabilities

---

## 5. User Stories

### Epic 1: Training Block Planning

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-1.1 | As a user, I want to create a new training block so that I can plan my training block | P0 | User can name training block, set duration (4-6 weeks), and save |
| US-1.2 | As a user, I want to add workout days to my training block so that I can define my weekly split | P0 | User can add 1-7 days per week, name each day |
| US-1.3 | As a user, I want to add exercises to each workout day so that I can build my program | P0 | User can search/select exercises, set starting sets, rep range |
| US-1.4 | As a user, I want to see weekly volume per muscle group while planning so that I can ensure balanced programming | P0 | Volume indicators update in real-time as exercises are added |
| US-1.5 | As a user, I want to see time estimates for Week 1 and final week so that I can plan around my schedule | P1 | Time shown in minutes for first and last week |
| US-1.6 | As a user, I want to be warned if my final week exceeds my time budget so that I can adjust before starting | P1 | Warning displayed when estimate > budget |
| US-1.7 | As a user, I want to set a time budget per workout day so that I can constrain my planning | P2 | Optional minutes field per day |
| US-1.8 | As a user, I want to duplicate an existing training block so that I can iterate on past programs | P2 | Copy creates new training block with same structure |

### Epic 2: Workout Logging

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-2.1 | As a user, I want to see today's scheduled workout so that I know what to do | P0 | Home screen shows current workout with exercises |
| US-2.2 | As a user, I want to log weight and reps for each set so that I can track my performance | P0 | Input fields for weight/reps, completion toggle |
| US-2.3 | As a user, I want to see what I did last session for each exercise so that I can gauge progression | P0 | Previous session data displayed above inputs |
| US-2.4 | As a user, I want to see recommended weight/reps so that I know what to target | P1 | Recommendation pre-filled or displayed |
| US-2.5 | As a user, I want to add sets beyond the prescribed amount so that I can adjust on the fly | P1 | "Add Set" button available |
| US-2.6 | As a user, I want to provide feedback after each exercise (pump rating) so that the app can adjust future volume | P1 | Optional pump rating after completing exercise sets |
| US-2.7 | As a user, I want to complete my workout and provide overall feedback so that I can inform next session | P1 | Completion flow with pump/soreness/workload ratings |
| US-2.8 | As a user, I want to see current weekly volume during my workout so that I know my running totals | P0 | Compact volume bar at top of workout screen |

### Epic 3: Exercise Library

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-3.1 | As a user, I want to browse all exercises so that I can discover options | P0 | Scrollable list with all exercises |
| US-3.2 | As a user, I want to search exercises by name so that I can quickly find what I need | P0 | Search input filters results in real-time |
| US-3.3 | As a user, I want to filter exercises by equipment type so that I can see what's available with my setup | P1 | Filter chips for equipment types |
| US-3.4 | As a user, I want to filter exercises by muscle group so that I can find exercises for specific muscles | P1 | Filter chips for muscle groups |
| US-3.5 | As a user, I want to add custom exercises so that I can track movements not in the library | P1 | Form to create exercise with muscle mappings |
| US-3.6 | As a user, I want my custom exercises to be private so that they don't affect other users | P1 | Custom exercises only visible to creator |
| US-3.7 | As a user, I want to see exercise video links so that I can review proper form | P2 | Video icon links to YouTube when available |

### Epic 4: Offline Support

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-4.1 | As a user, I want to download today's workout for offline use so that I can log at the gym without signal | P1 | "Download Today" button caches workout data |
| US-4.2 | As a user, I want to log sets while offline so that I don't lose my data | P1 | Sets saved locally, sync when online |
| US-4.3 | As a user, I want to see an offline indicator so that I know my connection status | P1 | Visual indicator when offline |
| US-4.4 | As a user, I want my offline data to sync automatically when I reconnect so that I don't have to do anything manually | P1 | Background sync on reconnection |

### Epic 5: Voice Logging

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-5.1 | As a user, I want to log sets by voice so that I can keep my hands free | P2 | Mic button, "85 for 12" logs set |
| US-5.2 | As a user, I want to ask what I did last time so that I can decide on today's weight | P3 | "What did I do last time?" returns spoken response |
| US-5.3 | As a user, I want voice confirmation of logged sets so that I know it worked | P2 | App speaks back "Logged 85 pounds for 12 reps" |

### Epic 6: Photo Import

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-6.1 | As a user, I want to take a photo of my handwritten workout log so that I can digitize it | P3 | Camera capture or photo upload |
| US-6.2 | As a user, I want the app to extract exercises, weights, and reps from the photo so that I don't have to type everything | P3 | OCR extracts data into editable fields |
| US-6.3 | As a user, I want to review and correct extracted data before saving so that I can fix any errors | P3 | Editable preview with save/cancel |

---

## 6. Feature Requirements

### 6.1 Volume Tracking (Priority: P0)

**Description:**  
Calculate and display weekly training volume (sets) per muscle group, accounting for both primary and secondary muscle contributions.

**Functional Requirements:**

| ID | Requirement |
|----|-------------|
| FR-1.1 | System shall calculate direct sets (exercise primary muscle) |
| FR-1.2 | System shall calculate indirect sets (secondary muscles × contribution weight) |
| FR-1.3 | System shall sum direct + indirect for total effective sets |
| FR-1.4 | System shall compare totals against volume landmarks (MV, MEV, MAV, MRV) |
| FR-1.5 | System shall display color-coded status: green (optimal), yellow (caution), red (problem) |
| FR-1.6 | System shall update volume calculations in real-time during planning |
| FR-1.7 | System shall display compact volume summary during workout logging |

**Volume Landmark Definitions:**
- MV (Maintenance Volume): Minimum to maintain gains
- MEV (Minimum Effective Volume): Minimum for growth
- MAV (Maximum Adaptive Volume): Optimal range ceiling
- MRV (Maximum Recoverable Volume): Upper limit before overtraining

### 6.2 Time Estimation (Priority: P1)

**Description:**  
Project workout duration for each week of a training block, accounting for set progression.

**Functional Requirements:**

| ID | Requirement |
|----|-------------|
| FR-2.1 | System shall calculate sets per exercise per week based on base_sets + (progression × week) |
| FR-2.2 | System shall calculate time as: sets × (work_seconds + rest_seconds) |
| FR-2.3 | System shall reduce rest time for superset-grouped exercises |
| FR-2.4 | System shall display Week 1 and final week estimates during planning |
| FR-2.5 | System shall warn when final week exceeds time budget |
| FR-2.6 | System shall use user's default rest time setting (default: 90 seconds) |

### 6.3 Progression Algorithm (Priority: P1)

**Description:**  
Recommend weight, reps, and sets for each session based on previous performance.

**Functional Requirements:**

| ID | Requirement |
|----|-------------|
| FR-3.1 | If user hit rep ceiling on ≥60% of sets → increase weight by equipment increment |
| FR-3.2 | If within rep range → target +1 rep from previous average |
| FR-3.3 | If below rep range → maintain weight, target rep floor |
| FR-3.4 | RIR target shall decrease each week (Week 1: 4 RIR → Week N-1: 1 RIR) |
| FR-3.5 | Deload week shall reduce weight by 15% and sets by 50% |
| FR-3.6 | Sets shall adjust based on user feedback (workload rating) |

### 6.4 Offline Support (Priority: P1)

**Description:**  
Enable workout logging without internet connectivity.

**Functional Requirements:**

| ID | Requirement |
|----|-------------|
| FR-4.1 | User shall be able to cache today's workout with one tap |
| FR-4.2 | Cached data shall include: workout structure, exercise details, last 4 sessions per exercise |
| FR-4.3 | Logged sets shall persist to local storage when offline |
| FR-4.4 | System shall queue offline changes for sync |
| FR-4.5 | System shall sync automatically when connection restored |
| FR-4.6 | System shall display offline indicator in UI |

---

## 7. Release Phases

### Phase 1: MVP (Weeks 1-4)
- User authentication
- Training Block creation and management
- Exercise library (core set + custom)
- Basic workout logging
- Manual progression (no recommendations)

### Phase 2: Intelligence (Weeks 5-6)
- Volume calculation engine
- Volume indicators in UI
- Progression recommendations
- Previous session display

### Phase 3: Time & Offline (Weeks 7-8)
- Time estimation
- "Download Today" offline mode
- Sync queue
- PWA installation

### Phase 4: Voice & Polish (Weeks 9+)
- Voice logging
- Photo import (OCR)
- Progression reasoning display
- Performance optimization
- User theme customization

---

## 8. Success Metrics

### Engagement Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Weekly active users | 80% of registered | Users logging ≥1 workout/week |
| Workout completion rate | >90% | Completed / Started workouts |
| Training Block completion rate | >60% | Users finishing full training block |

### Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time estimate accuracy | Within 15% | Actual vs estimated duration |
| Offline sync success | >99% | Synced sets / Total offline sets |
| Voice recognition accuracy | >90% | Correct parses / Total voice inputs |

### Satisfaction Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| User satisfaction (NPS) | >50 | Survey after 4 weeks |
| Feature usefulness rating | >4/5 | Per-feature survey |

---

## 9. Out of Scope

The following are explicitly **not** included in v1.0:

| Item | Rationale |
|------|-----------|
| Diet/nutrition tracking | Separate domain, adds complexity |
| Social features (sharing, leaderboards) | Not needed for personal use |
| Wearable integrations | Requires additional platform work |
| Video recording of lifts | Storage and privacy concerns |
| AI-generated workout programs | Focus on user-defined programs first |
| Multi-language support | English only for MVP |
| Apple Watch / WearOS app | PWA only for v1 |

---

## 10. Assumptions & Dependencies

### Assumptions

1. Users have basic understanding of hypertrophy training concepts
2. Users will primarily access the app on mobile devices
3. Gyms have intermittent (not zero) connectivity
4. Users are willing to provide feedback (pump, soreness ratings)
5. Core exercise library of ~50 exercises is sufficient for launch

### Dependencies

| Dependency | Type | Risk Level |
|------------|------|------------|
| Supabase availability | External service | Low |
| Web Speech API browser support | Platform | Medium |
| Tesseract.js OCR accuracy | Library | Medium |
| Vercel hosting | External service | Low |

---

## 11. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Offline sync conflicts | Medium | Medium | Last-write-wins with conflict log |
| Voice recognition fails in noisy gym | High | Low | Always allow manual fallback |
| OCR accuracy insufficient | Medium | Low | Require user confirmation, feature is P3 |
| Volume calculations confuse users | Low | Medium | Provide tooltip explanations |
| Time estimates inaccurate | Medium | Medium | Allow user calibration of rest times |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Training Block | A training block typically lasting 4-6 weeks |
| Volume | Total number of sets performed for a muscle group |
| MV | Maintenance Volume - minimum sets to maintain muscle |
| MEV | Minimum Effective Volume - minimum sets for growth |
| MAV | Maximum Adaptive Volume - optimal range for growth |
| MRV | Maximum Recoverable Volume - maximum before overtraining |
| RIR | Reps in Reserve - how many reps you could have done |
| Progressive Overload | Gradually increasing training stimulus over time |
| Deload | Planned reduction in training volume/intensity for recovery |

---

## Appendix B: Competitive Analysis

| Feature | RP Hypertrophy | Strong | Hevy | MyLiftPal |
|---------|---------------|--------|------|----------|
| Periodization | ✅ | ❌ | ❌ | ✅ |
| Volume tracking | ❌ | ❌ | Partial | ✅ |
| Time estimation | ❌ | ❌ | ❌ | ✅ |
| Offline mode | ❌ | ✅ | ✅ | ✅ |
| Voice logging | ❌ | ❌ | ❌ | ✅ |
| Photo import | ❌ | ❌ | ❌ | ✅ |
| Custom exercises | ✅ | ✅ | ✅ | ✅ |
| Price | $35/mo | Free/Premium | Free/Premium | Free |

---

*End of Product Requirements Document*
