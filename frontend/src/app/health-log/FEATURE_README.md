# Health Log Feature

## Overview
The Health Log feature allows users to track their health metrics, symptoms, medications, and overall well-being. It provides personalized insights using Gemini AI and stores data securely in Firebase.

## Features
- Track daily health metrics (weight, blood pressure, etc.)
- Log symptoms and their severity
- Medication tracking with reminders
- Mood and energy level tracking
- AI-powered insights and health trends
- Secure data storage with Firebase
- Responsive design with consistent color scheme

## Tech Stack
- Next.js 13+ (App Router)
- TypeScript
- Firebase (Firestore, Authentication, Storage)
- Google Gemini AI for health insights
- Tailwind CSS for styling
- React Hook Form for form handling
- Date-fns for date manipulation

## Data Models

### Health Entry
```typescript
interface HealthEntry {
  id: string;
  userId: string;
  date: string; // ISO date string
  metrics: {
    weight?: number; // kg
    bloodPressure?: {
      systolic: number;
      diastolic: number;
    };
    heartRate?: number; // bpm
    temperature?: number; // °C
  };
  symptoms: Array<{
    name: string;
    severity: number; // 1-5 scale
    notes?: string;
  }>;
  medications: Array<{
    name: string;
    dosage: string;
    time: string;
    taken: boolean;
  }>;
  mood: number; // 1-5 scale
  energyLevel: number; // 1-5 scale
  notes?: string;
  aiInsights?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
```

## Color Scheme
- Primary: `#EC4899` (Pink-500)
- Secondary: `#8B5CF6` (Purple-500)
- Accent: `#3B82F6` (Blue-500)
- Background: `#F9FAFB` (Gray-50)
- Surface: `#FFFFFF` (White)
- Text: `#111827` (Gray-900)
- Text Secondary: `#6B7280` (Gray-500)

## Environment Variables
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

## File Structure
```
src/app/health-log/
├── components/
│   ├── HealthEntryForm.tsx     # Form for adding/editing health entries
│   ├── HealthEntryList.tsx     # List view of health entries
│   ├── HealthMetrics.tsx       # Health metrics visualization
│   ├── SymptomsTracker.tsx     # Symptom tracking component
│   ├── MedicationTracker.tsx   # Medication management
│   └── HealthInsights.tsx      # AI-powered health insights
├── services/
│   ├── firebase.ts            # Firebase initialization and helpers
│   └── geminiService.ts        # Gemini AI service for health insights
├── types.ts                   # TypeScript type definitions
├── page.tsx                   # Main page component
└── FEATURE_README.md          # This file
```

## Getting Started
1. Set up Firebase project and enable Firestore, Authentication, and Storage
2. Add Firebase configuration to environment variables
3. Set up Google Gemini API and add the API key to environment variables
4. Install dependencies: `npm install firebase @google/generative-ai date-fns`
5. Run the development server: `npm run dev`

## Implementation Notes
- All data is scoped to the authenticated user
- Data is validated both client-side and server-side
- AI insights are generated asynchronously after form submission
- The UI is fully responsive and follows accessibility best practices
- Error handling is implemented for all async operations
