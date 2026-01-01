# Plan: Demo Data Seeding

This plan outlines the creation of a script to populate a demo user account with realistic training history. This data is essential for beta testing features like Progression Recommendations, Volume Tracking, and (future) Charts.

## 1. Script Architecture

- **File:** `scripts/seed-demo-data.ts`
- **Execution:** `npx tsx scripts/seed-demo-data.ts`
- **Dependencies:** `@supabase/supabase-js`, `dotenv` (to load env vars locally)

## 2. Target Data Profiles (Personas)

The script will generate data for **3 distinct users** to test different app states (Empty/New, Standard, Heavy/Advanced) and verify Row Level Security (RLS).

### A. The Beginner (`beginner@myliftpal.com`)
*Tests the "New User" experience and simple full-body programming.*
- **Password:** `demo1234`
- **Profile:** Beginner, Goal: General Fitness
- **History:** None (Clean slate).
- **Active Block:** "Starter Full Body"
  - **Split:** 3 days/week (A/B alternating)
  - **Current:** Week 1, Day 1 just completed.
  - **Exercises:** Goblet Squats, Push-ups, Lat Pulldowns.

### B. The Intermediate (`intermediate@myliftpal.com`)
*Tests the core "Hypertrophy" loop, progression, and volume tracking.*
- **Password:** `demo1234`
- **Profile:** Intermediate, Goal: Hypertrophy
- **History:** 1 Completed Block ("Foundation Upper/Lower" - 4 weeks).
- **Active Block:** "Hypertrophy Push/Pull"
  - **Split:** 4 days/week
  - **Current:** Week 2.
  - **Progression:** +5 lbs/week linear increase in history.

### C. The Advanced (`advanced@myliftpal.com`)
*Tests performance with large datasets and high volume.*
- **Password:** `demo1234`
- **Profile:** Advanced, Goal: Powerbuilding
- **History:** 3 Completed Blocks (12 weeks of data).
- **Active Block:** "5-Day Body Part Split"
  - **Split:** Chest, Back, Legs, Shoulders, Arms
  - **Current:** Week 3.
  - **Data characteristics:** Heavy weights, accurate RIR logging, high set counts.

## 3. Implementation Logic

1.  **Init:** Load environment variables.
2.  **User Loop:** Iterate through the 3 personas defined above.
3.  **Auth/User Creation:**
    - Check if user exists.
    - If not, create using Supabase Admin API (requires `SERVICE_ROLE_KEY`) OR standard signup.
    - *Note:* Using `SERVICE_ROLE_KEY` is preferred for seeding scripts to bypass email verification if possible, or we just manually create them once.
4.  **Data Generation (Per User):**
    - **Beginner:** Create 1 active block, log 1 session.
    - **Intermediate:** Create 1 past block (generate 16 sessions), 1 active block.
    - **Advanced:** Create 3 past blocks (generate ~48 sessions), 1 active block.
5.  **Session Generator Function:**
    - Accepts `blockId`, `days`, `weeks`, `startWeight`, `progressionFactor`.
    - Generates realistic log entries.
6.  **Output:** Print login credentials and summary for each user.

## 4. Execution Steps

1.  Create `scripts/seed-demo-data.ts`.
2.  Implement the logic above.
3.  Run the script.
4.  Verify in the app that "Previous Session" data appears when logging a workout.
