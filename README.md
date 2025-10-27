# 🩸 Auralie - AI-Driven Menstrual & Reproductive Health Assistant

Auralie is an AI-driven menstrual & reproductive health assistant that helps users track cycles, log symptoms, receive personalized insights, and get timely, privacy-preserving alerts and educational guidance.

## 🚀 Fresh Setup Complete!

### ✅ **Latest Tech Stack**

#### **Frontend - Next.js 14**
- **Framework**: Next.js 14 with App Router (Latest)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Linting**: ESLint with Next.js configuration
- **Features**: App Router, Server Components, Image Optimization

#### **Backend - FastAPI**
- **Framework**: FastAPI with modern async patterns
- **Database**: PostgreSQL + MongoDB hybrid architecture
- **Authentication**: JWT with bcrypt password hashing
- **API**: RESTful with automatic OpenAPI documentation
- **Structure**: Modern Python package organization

## 📁 **Project Structure**

```
auralie/
├── frontend/                 # Next.js 14 (Latest Template)
│   ├── app/                 # App Router (Next.js 14)
│   ├── public/              # Static assets
│   ├── src/                 # Source code
│   ├── next.config.js       # Next.js configuration
│   ├── tailwind.config.js   # Tailwind CSS
│   └── package.json         # Dependencies
├── backend/                  # FastAPI (Modern Structure)
│   ├── app/                 # Main application package
│   ├── routers/             # API route handlers
│   ├── main.py             # FastAPI application
│   └── requirements.txt     # Python dependencies
└── README.md               # Project documentation
```

## 🏃‍♀️ **Quick Start**

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Visit: http://localhost:3000
```

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env

# Start development server
python main.py
# API docs: http://localhost:8000/api/docs
```

## 🎨 **Modern Features**

### **Frontend (Next.js 14)**
- ✅ **App Router**: Latest Next.js routing system
- ✅ **Server Components**: Improved performance
- ✅ **TypeScript**: Full type safety
- ✅ **Tailwind CSS**: Utility-first styling
- ✅ **ESLint**: Code quality assurance

### **Backend (FastAPI)**
- ✅ **Async/Await**: Modern Python async patterns
- ✅ **Pydantic Models**: Data validation and serialization
- ✅ **SQLAlchemy 2.0**: Latest ORM features
- ✅ **MongoDB Integration**: Time-series data support
- ✅ **OpenAPI Auto-docs**: Interactive API documentation

## 🔧 **Configuration**

### **Environment Variables**

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_AUTH_DOMAIN=localhost
NODE_ENV=development
```

**Backend** (`.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/auralie
MONGODB_URL=mongodb://localhost:27017/auralie
SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:3000
```

## 📚 **API Endpoints**

### **Available Routes:**
- **Authentication**: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`
- **Users**: `/api/users/me` (profile management)
- **Cycle Tracking**: `/api/cycles` (menstrual cycle logging)
- **Health Check**: `/health`, `/api`

### **Interactive Documentation:**
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## 🚧 **Next Steps**

1. **Frontend Customization**:
   - Add your landing page design
   - Configure color scheme and branding
   - Set up authentication flow

2. **Backend Development**:
   - Complete database models
   - Implement business logic
   - Add ML prediction endpoints

3. **Integration**:
   - Connect frontend to backend APIs
   - Set up authentication flow
   - Add real-time features

## 🌟 **Modern Architecture Benefits**

- **🚀 Performance**: Next.js 14 with Server Components
- **🔒 Security**: JWT authentication with secure password hashing
- **📱 Responsive**: Mobile-first design with Tailwind CSS
- **🔄 Real-time**: WebSocket ready for live updates
- **📊 Scalable**: PostgreSQL + MongoDB for different data types
- **🧪 Testable**: Proper separation of concerns

## 🎯 **Ready for Development**

Your project now uses the **latest templates and best practices**:

- **Frontend**: Fresh Next.js 14 with modern tooling
- **Backend**: Clean FastAPI structure with proper async patterns
- **Database**: Ready for both relational and document data
- **Authentication**: Secure JWT implementation
- **Documentation**: Auto-generated API documentation

**Start building your amazing menstrual health assistant today!** 🚀✨

## 🌟 Project Status

**🚧 Currently in Active Development**

### ✅ Completed
- [x] **Project Structure** - Organized frontend/backend/database folders
- [x] **Frontend Setup** - Next.js 14 + TypeScript + Tailwind CSS
- [x] **Landing Page** - Beautiful, responsive marketing site
- [x] **User Authentication** - Registration and login pages
- [x] **API Specification** - Comprehensive OpenAPI documentation
- [x] **Backend Structure** - FastAPI with authentication system
- [x] **Database Design** - PostgreSQL + MongoDB hybrid architecture
- [x] **PWA Ready** - Service worker and manifest configuration

### 🚧 In Progress
- [ ] Backend API implementation
- [ ] Database integration
- [ ] ML prediction services
- [ ] Frontend-backend integration

### 📋 Next Steps
- [ ] Complete backend API endpoints
- [ ] Connect frontend to backend APIs
- [ ] Implement cycle prediction algorithms
- [ ] Add comprehensive testing

## 🏗️ Architecture

### Tech Stack

#### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks + Context API
- **Forms**: React Hook Form with Zod validation
- **PWA**: Next.js PWA plugin

#### Backend
- **Framework**: FastAPI with automatic OpenAPI docs
- **Language**: Python 3.9+
- **Database**: PostgreSQL (users, articles) + MongoDB (time-series)
- **ORM**: SQLAlchemy + Motor
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Pydantic models

#### Database
- **PostgreSQL**: Structured user data and educational content
- **MongoDB**: Time-series cycle logs and symptom tracking
- **Migration**: Alembic for PostgreSQL schema management

## 📁 Project Structure

```
auralie/
├── frontend/                 # Next.js React frontend
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/           # Next.js pages and API routes
│   │   ├── types/           # TypeScript type definitions
│   │   ├── lib/             # Utility functions
│   │   └── styles/         # Global styles
│   ├── public/              # Static assets (PWA manifest, icons)
│   └── package.json
├── backend/                 # FastAPI backend
│   ├── routers/             # API route handlers
│   ├── models.py            # Pydantic models
│   ├── database.py          # Database configuration
│   ├── auth.py              # Authentication utilities
│   ├── config.py            # Configuration management
│   ├── main.py              # FastAPI application
│   └── requirements.txt
├── database/                # Database migrations and schemas
├── docs/                    # Project documentation
│   ├── project_overview.md  # Complete project description
│   ├── detailed_user_flow.md # User flow documentation
│   ├── api-specs/           # OpenAPI specifications
│   └── schemas/             # Database schema documentation
└── README.md               # This file
```

## 🚀 Quick Start

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Edit .env.local with your API URL

# Start development server
npm run dev
# Open http://localhost:3000
```

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your database URLs

# Initialize database
python -c "from database import init_db; init_db()"

# Start development server
python main.py
# Open http://localhost:8000
# API docs: http://localhost:8000/api/docs
```

## 🌟 Key Features

### Core Features
- **🔮 Cycle Prediction** - AI-powered next period and ovulation predictions
- **📊 Symptom Tracking** - Daily mood, physical, and lifestyle logging
- **🎯 Fertility Insights** - Conception probability and fertile window tracking
- **📚 Educational Content** - Personalized menstrual health education

### Technical Features
- **🔐 Privacy First** - End-to-end encryption and user consent
- **📱 PWA Ready** - Works offline with service worker
- **🌍 Accessible** - Multi-language support and screen reader friendly
- **⚡ Real-time** - Live predictions and notifications
- **🔄 Sync** - Cross-device data synchronization

## 📱 User Experience

### Landing Page
- Hero section with clear value proposition
- Feature showcase with visual demonstrations
- Trust indicators and social proof
- Clear call-to-action buttons

### Authentication Flow
- Simple email/password registration
- Social login options (Google, Apple)
- Comprehensive form validation
- Privacy policy and terms acceptance

### Dashboard (Coming Soon)
- Cycle calendar with predictions
- Symptom tracking interface
- Fertility insights dashboard
- Educational content recommendations

## 🔒 Privacy & Security

### Data Protection
- **Encryption**: All health data encrypted at rest and in transit
- **Consent**: Explicit user consent for all data processing
- **Control**: Users can download, delete, or export their data
- **Anonymization**: ML training data is anonymized

### Compliance
- **GDPR Ready**: Right to deletion and data portability
- **HIPAA Considerations**: Health data security best practices
- **Local Laws**: Designed to comply with regional regulations

## 🧠 AI & Machine Learning

### Prediction Models
- **Cycle Prediction**: LSTM/Transformer for cycle forecasting
- **Symptom Analysis**: Pattern recognition and anomaly detection
- **Fertility Scoring**: Bayesian inference for conception probability
- **Content Recommendation**: Personalized educational content

### Model Management
- **MLflow Integration**: Experiment tracking and model versioning
- **Model Explainability**: SHAP values for prediction explanations
- **Continuous Learning**: Model retraining with new data
- **Bias Mitigation**: Diverse training data and fairness metrics

## 📊 Analytics & Insights

### User Metrics
- **Engagement**: Daily/weekly active users
- **Retention**: 30-day retention rates
- **Accuracy**: Prediction accuracy over time
- **Satisfaction**: User feedback and ratings

### Health Insights
- **Pattern Recognition**: Identify irregular cycles and symptoms
- **Trend Analysis**: Long-term health pattern tracking
- **Early Warning**: Flag potential health concerns
- **Educational Impact**: Measure learning outcomes

## 🌍 Accessibility & Inclusion

### Universal Design
- **Screen Readers**: Full WCAG 2.1 AA compliance
- **Keyboard Navigation**: Complete keyboard accessibility
- **Color Contrast**: High contrast ratios for readability
- **Font Scaling**: Responsive typography

### Cultural Sensitivity
- **Multi-language**: Support for major languages
- **Cultural Adaptation**: Content adapted for different regions
- **Age Appropriate**: Content for teens, adults, and seniors
- **Inclusive Language**: Gender-neutral and inclusive terminology

## 🚀 Deployment

### Development
- **Frontend**: `npm run dev` (localhost:3000)
- **Backend**: `python main.py` (localhost:8000)
- **Database**: PostgreSQL + MongoDB locally

### Production
- **Frontend**: Vercel or Netlify deployment
- **Backend**: Docker containers on AWS/GCP
- **Database**: Managed PostgreSQL (RDS) + MongoDB Atlas
- **CDN**: CloudFlare for global performance

## 📈 Success Metrics

### User Engagement
- **DAU/MAU**: Daily and monthly active users
- **Session Duration**: Average time spent in app
- **Feature Usage**: Most popular features and tools
- **Retention**: User retention after 30, 90, 365 days

### Health Outcomes
- **Prediction Accuracy**: Mean absolute error in cycle predictions
- **Early Detection**: Time to identify health concerns
- **Education**: Knowledge improvement scores
- **Care Seeking**: Increased doctor visits for menstrual health

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Set up development environment (see Quick Start)
4. Make your changes and add tests
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **Python**: PEP 8 style guidelines
- **Testing**: Unit tests for all new features
- **Documentation**: Update README and API docs

#### **Color Scheme:**
- **Primary**: Pink tones (#ec4899) - representing menstrual health and femininity
- **Secondary**: Slate grays (#64748b) - professional and trustworthy
- **Accent**: Gold tones (#eab308) - energy and positivity
- **Success**: Green tones (#22c55e) - validation and success
- **Warning**: Orange tones (#f59e0b) - attention and alerts

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Health Experts**: Gynecologists and reproductive health specialists
- **Open Source**: FastAPI, Next.js, and the broader open source community
- **Users**: Women and menstruating individuals who inspire this work

## 📞 Contact

- **Project**: [GitHub Issues](https://github.com/your-org/auralie/issues)
- **Email**: hello@auralie.health
- **Discord**: [Join our community](https://discord.gg/auralie)

---

**Built with ❤️ for women's reproductive health**

*Last updated: October 27, 2025*
