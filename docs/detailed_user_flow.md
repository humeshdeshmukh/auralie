# 🩸 Auralie — Detailed User Flow

**Auralie** is a comprehensive women's reproductive health assistant with four core features: Cycle Prediction, Symptom Tracking, Fertility Possibility, and Educational Guidance.

---

## 👩‍🦰 User Roles
- **Primary User**: Female user (teen, adult, mother)
- **Secondary User**: Guardian/mother (for minors)
- **System**: AI/ML engine handling predictions and insights
- **Admin**: Health educator or content moderator

---

## 🌸 1. PREDICT CYCLES (Cycle Forecasting Flow)

**Goal**: Predict upcoming period start, ovulation days, and fertile window based on past cycle logs.

### Flow Steps:
1. **User Login / Signup**
   - Auth via email, phone (OTP), or Google.
   - Optional anonymous mode for privacy.

2. **Onboarding Questionnaire**
   - Collect last 3 period start dates (if known)
   - Ask average cycle length (default: 28 days)
   - Ask for irregularities, contraceptive use, and known conditions (e.g., PCOS)

3. **Dashboard — Cycle Overview**
   - Displays next predicted cycle start (e.g., "Your next period starts in 5 days")
   - Shows calendar view with:
     - Period days (red)
     - Ovulation day (orange)
     - Fertile window (pink)
   - Option to "Track Manually" if user wants to adjust dates.

4. **ML Prediction Engine**
   - **Input**: past cycle data, lifestyle inputs (stress, sleep, etc.)
   - **Model**: Temporal LSTM or regression for next-cycle estimation.
   - **Output**: Predicted start date, duration, ovulation window.
   - Accuracy improves over time with more data.

5. **Notifications & Alerts**
   - Daily reminder: "Your cycle is expected to start in 3 days."
   - Option to export as calendar (.ics) or sync with Google Calendar.

---

## ❤ 2. TRACK SYMPTOMS (Lifestyle + Health Detection Flow)

**Goal**: Understand user's hormonal, physical, and emotional states based on inputs and optional device data.

### Flow Steps:
1. **Daily Check-in / Symptom Log**
   - Simple form: mood, pain, flow, discharge, appetite, sleep, exercise.
   - Optional: wearable data (heart rate, temperature, sleep, HRV).
   - "Quick log" button on dashboard.

2. **Lifestyle Data Collection**
   - Manual or automatic tracking via integrations (Fitbit, Google Fit, Apple Health).
   - System asks: "Did you experience cramps or fatigue today?"

3. **System Processing**
   - Data normalization → model computes symptom patterns.
   - Detects anomalies: e.g., "You've had high cramps for 3 days."

4. **Insight Generation**
   - "Your stress levels are affecting cycle regularity."
   - "Mood patterns suggest luteal phase symptoms."

5. **Symptom Timeline**
   - Visual chart (line graph) of symptoms over time.
   - Tags symptoms by cycle phase (follicular, ovulation, luteal, menstruation).

6. **AI-Driven Advice**
   - Suggests: hydration, rest, or medical consult.
   - Generates weekly "Lifestyle Health Score."

---

## 🌼 3. CHANCES (Fertility & Pregnancy Possibility Flow)

**Goal**: Predict chances of fertility or pregnancy based on cycles + symptoms + lifestyle.

### Flow Steps:
1. **Input Layer**
   - Uses predicted cycle data + logged symptoms (basal temp, cervical mucus, libido).
   - Optional hormonal data (if user tracks manually or via device).

2. **Fertility Engine (AI Layer)**
   - **ML Model**: Bayesian or logistic regression combining cycle + hormone + lifestyle metrics.
   - **Output**:
     - Fertile window probability (%)
     - Conception chance range (low/medium/high)
     - Irregularities (e.g., "Late ovulation detected")

3. **UI Display**
   - Dashboard shows: "You're in your fertile window — 32% chance of conception."
   - Calendar highlights fertile days with green gradient.

4. **Education + Privacy**
   - Clear disclaimer: "Predictions are indicative, not diagnostic."
   - User control over whether this info is stored or deleted monthly.

5. **Optional**
   - Suggests related health content: "Understanding Ovulation Timing"
   - Option to share summary with doctor (PDF export).

---

## 📚 4. KNOWLEDGE ON TIPS (Education & Awareness Flow)

**Goal**: Educate young girls and mothers about menstrual health, hygiene, and body awareness.

### Flow Steps:
1. **Knowledge Hub (Interactive Section)**
   - Categorized topics:
     - Menstrual Hygiene
     - Nutrition & Lifestyle
     - PCOS & Disorders
     - Fertility Myths
     - Mother–Daughter Conversations

2. **UI Features**
   - Article cards + illustrations.
   - Quick "Did you know?" facts.
   - Voice mode (for low-literacy users).

3. **Personalized Recommendations**
   - Based on age, symptoms, and cycle regularity:
     - "Tips for easing cramps"
     - "Diet that helps with hormonal balance"

4. **Community Section**
   - Anonymous Q&A forum ("Ask Auralie")
   - Verified educators and gynecologists can answer.
   - Moderation system filters harmful/false content.

5. **Progress Tracking**
   - Quiz-based learning (earn badges like "Cycle Smart", "Wellness Aware")
   - Optional certificates for awareness modules.

---

## 🔄 Interconnected Data Flow (End-to-End)

```
[Cycle Logs] → [Cycle Predictor] →
     ↓
[Symptom Tracker] → [Fertility Engine] →
     ↓
[Insights Generator] → [Knowledge/Tips Module]
```

- Cycle predictions influence symptom context (e.g., luteal vs follicular).
- Symptom & lifestyle data refine fertility probability.
- Combined insights generate tailored educational content.

---

## ⚙ Backend Logic Summary

| Module | Data Source | Algorithm | Output |
|--------|-------------|-----------|--------|
| Predict Cycles | User-entered periods | LSTM / Regression | Start date, duration |
| Track Symptoms | Manual + wearable | Classification + anomaly detection | Phase, stress, irregularities |
| Fertility Possibility | Combined dataset | Bayesian / Logistic | Probability score |
| Knowledge & Tips | Static + personalized rules | NLP tagging | Curated articles |

---

## 🧠 Tech Stack (Ideal Implementation)

| Layer | Technology |
|-------|------------|
| Frontend | React + Tailwind CSS + Recharts (for graphs) |
| Backend | FastAPI (Python) |
| Database | MongoDB Atlas (for logs) + PostgreSQL (for structured data) |
| ML Engine | TensorFlow/PyTorch served via FastAPI |
| Auth | Firebase Auth / Auth0 |
| Storage | AWS S3 / Supabase |
| SMS / Notifications | Twilio + OneSignal |
| Hosting | Render / AWS EC2 |
| Analytics | Google Analytics / Plausible |

---

## 🧩 User Journey Summary

### 🔹 First-time user
1. Signs up → adds period history → sees predictions
2. Logs daily symptoms → gets AI insights
3. Sees fertile window → tracks possibility
4. Reads personalized health tips → engages in community

### 🔹 Returning user
1. Checks dashboard for next period prediction
2. Adds new symptom data
3. Reviews weekly "Health Summary"
4. Reads latest menstrual wellness articles

---

*Last updated: October 27, 2025*
