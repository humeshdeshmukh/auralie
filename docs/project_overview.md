# Auralie — About the Project

Auralie is an AI-driven menstrual & reproductive health assistant that helps users track cycles, log symptoms, receive personalized insights, and get timely, privacy-preserving alerts and educational guidance. It's designed to be accessible (PWA + multilingual + SMS/voice input), trustworthy (explicit consent, localizable privacy controls) and clinically sensible (model explainability + referral pathways).

## Elevator Pitch (1 line)
Auralie predicts cycles, detects red flags, and delivers personalized, privacy-first reproductive health guidance so users can manage their menstrual health confidently.

---

## Problem It Solves
- Many people lack reliable, easy-to-use cycle tracking that understands irregularities and provides actionable next steps.
- Health literacy and stigma reduce timely care-seeking.
- Wearables and manual logs generate noisy, fragmented data that's hard to interpret.

## Core Solution
- Simple logging (manual, SMS, voice, wearables) → time-series model predicts cycle & fertile windows → explainable flags & educational content → optional clinician referral or community support.
- Data minimization + encryption and clear consent for any aggregated model training.

## Target Users
- **Primary**: women and people who menstruate (adolescents to perimenopausal).
- **Secondary**: community health workers (ASHA), clinicians (referrals), researchers (consented, anonymized datasets).

## Key Features

### MVP
- Onboarding + profile (age, typical cycle length, conditions).
- Manual symptom & period logging, calendar view.
- Next-cycle and fertile window prediction.
- Simple risk flags (irregular cycles, unusually long/short cycles).
- Localized educational content and privacy controls.
- Exportable summary for doctors and SMS input for low-connectivity users.

### Advanced / Later
- Wearable sync (HR, temperature), photo-based flow estimation, voice input & NLP for symptoms.
- ML explainability UI, personalized recommendations, clinic referrals, anonymous community Q&A, model retraining pipeline.
- Multi-language voice prompts and offline-first behavior.

## Value Propositions
- Better prediction and early flagging of possible conditions (e.g., PCOS patterns) for earlier care.
- Privacy-first design that keeps sensitive data under user control.
- Accessibility: works via app, PWA, SMS, and voice to reach low-connectivity users.

## Data & Privacy (Non-negotiables)
- Encryption at rest and in transit; per-user data control (download/delete).
- Explicit opt-in for any data used for model training; ability to revoke consent.
- Minimal personally identifying information required; anonymize before aggregation.
- Clear medical disclaimers — not a replacement for clinical diagnosis.

## Recommended Tech Stack
- **Frontend**: React (PWA) + Tailwind CSS; i18n + optional voice libraries.
- **Backend**: FastAPI (Python) — easy ML integration and async performance.
- **ML**: Python (PyTorch / TensorFlow), saved & versioned with MLflow or BentoML.
- **Database**: MongoDB Atlas (document time-series-friendly) or Postgres + TimescaleDB for time-series.
- **Auth**: Auth0 or Firebase Auth; consider phone-OTP for low-barrier sign-up.
- **Storage**: AWS S3 / Supabase Storage for attachments.
- **Messaging**: Twilio for SMS, local SMS gateway options for India.
- **Hosting**: Dockerized services on AWS/GCP/Render; model endpoints in scalable containers.
- **Monitoring**: Sentry, Prometheus + Grafana.

## ML Approach (Concise)
- **Predictive model**: light LSTM/Transformer or temporal CNN on sequences of cycle lengths + symptoms.
- **Risk classifier**: tree-based or small neural net using aggregated features (BMI, cycle variance, symptoms).
- **Explainability**: SHAP or simple rule-based triggers for user-friendly explanations.

## MVP Scope and Timeline (Suggested)
- **Week 0–2**: Spec + UI mockups + auth.
- **Week 2–6**: Logging + calendar UI + basic prediction model (rule + simple ML) + export.
- **Week 6–10**: Refine model, multilingual support, SMS input, privacy & consent UI, basic analytics.

## Success Metrics
- DAU/MAU for trackers, % of users who log ≥ X days/month.
- Prediction accuracy (mean absolute error in predicted period start).
- Retention after 30 days.
- % users consenting to anonymized data for model improvements.

## Risks & Ethical Concerns
- Misclassification leading to false reassurance or unnecessary alarm — mitigate via conservative thresholds and clear guidance.
- Legal/regulatory: store health data carefully, follow local laws (India IT rules + any health data guidance).
- Bias: ensure training data diversity to avoid skewed predictions.

## Monetization Ideas (Non-invasive)
- Freemium: basic tracking free, premium advanced insights, exportable reports, clinician chat.
- Partnerships: anonymized insights for research (consented), B2B integrations with clinics or NGOs.
- Educational sponsorships (careful with ethics & transparency).

---

## Suggested Next Deliverables

(Choose one to build immediately)
1. ER diagram + data schema (Mongo/Postgres) + API spec (OpenAPI).
2. Starter code scaffold: frontend (React PWA) + backend (FastAPI) with auth + symptom logging endpoint.
3. Lightweight prediction model prototype (Python notebook) using synthetic/example data and an inference API.

---

*Last updated: October 27, 2025*
