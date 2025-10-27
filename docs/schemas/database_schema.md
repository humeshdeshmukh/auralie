# 🗄️ Auralie Database Schema

## Overview
Auralie uses a hybrid database approach:
- **MongoDB Atlas** for time-series cycle logs and symptom tracking (flexible schema)
- **PostgreSQL** for structured user data and relationships

## 📊 Core Collections/Tables

### Users (PostgreSQL)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    hashed_password VARCHAR(255),
    first_name VARCHAR(100),
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    consent_given BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMP,
    timezone VARCHAR(50) DEFAULT 'UTC'
);
```

### Cycle Logs (MongoDB)
```javascript
{
    _id: ObjectId,
    user_id: UUID,
    period_start: Date,
    period_end: Date,
    cycle_length: Number, // days
    flow_intensity: Number, // 1-5 scale
    symptoms: {
        cramps: Number, // 1-5
        mood: Number, // 1-5
        energy: Number, // 1-5
        sleep_quality: Number, // 1-5
        // ... other symptoms
    },
    notes: String,
    created_at: Date,
    updated_at: Date
}
```

### Symptom Tracking (MongoDB)
```javascript
{
    _id: ObjectId,
    user_id: UUID,
    date: Date,
    symptoms: {
        physical: {
            cramps: Number,
            headache: Number,
            breast_tenderness: Number,
            bloating: Number
        },
        emotional: {
            mood: Number,
            anxiety: Number,
            irritability: Number
        },
        lifestyle: {
            sleep_hours: Number,
            exercise_minutes: Number,
            stress_level: Number
        }
    },
    notes: String,
    created_at: Date
}
```

### Predictions (MongoDB)
```javascript
{
    _id: ObjectId,
    user_id: UUID,
    prediction_type: String, // "cycle", "fertility", "symptom"
    predicted_date: Date,
    confidence_score: Number, // 0-1
    factors: {
        cycle_history: Array,
        symptoms: Array,
        lifestyle: Object
    },
    model_version: String,
    created_at: Date,
    expires_at: Date
}
```

### Educational Content (PostgreSQL)
```sql
CREATE TABLE articles (
    id UUID PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    category VARCHAR(100), -- "hygiene", "nutrition", "pcos", etc.
    tags TEXT[],
    age_group VARCHAR(50), -- "teen", "adult", "all"
    language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔗 Relationships

- **User → Cycle Logs**: One-to-many
- **User → Symptom Tracking**: One-to-many
- **User → Predictions**: One-to-many
- **Users → Articles**: Many-to-many (via user preferences)

## 🔐 Privacy Considerations

- All health data encrypted at rest
- User consent required for ML training data
- Data retention policies (7 years for health data)
- Right to deletion (GDPR compliance)
- Anonymous mode option

---

*Schema Version: 1.0*  
*Last Updated: October 27, 2025*
