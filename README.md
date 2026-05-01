# ⚡ Electra AI Engine

> Advanced Election Simulator & Education Engine — powered by Google Gemini AI

## 🏗️ Architecture

```
electra-ai-engine/
├── server/
│   ├── index.js                 # Express server with security middleware
│   ├── engine/
│   │   ├── constants.js         # Scoring tables & weights
│   │   ├── simulator.js         # Core election simulation engine
│   │   ├── feedback.js          # AI feedback & analysis generator
│   │   └── mentor.js            # Education knowledge base
│   ├── middleware/
│   │   ├── validator.js         # Input validation middleware
│   │   └── sanitizer.js         # XSS/injection sanitization
│   └── services/
│       └── geminiService.js     # Google Gemini API integration
├── public/
│   ├── index.html               # Accessible, semantic SPA
│   ├── css/index.css            # Premium design system
│   └── js/app.js               # Frontend application
├── tests/
│   ├── simulator.test.js        # Simulation engine tests (25+ cases)
│   ├── api.test.js              # API endpoint tests (25+ cases)
│   ├── feedback.test.js         # Feedback engine tests
│   └── mentor.test.js           # Mentor engine tests
├── .env.example                 # Environment template
└── package.json
```

## 🚀 Quick Start

```bash
npm install
cp .env.example .env
# Add your GEMINI_API_KEY to .env (optional — fallback mode available)
npm run dev
```

Visit `http://localhost:3000`

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check & Gemini status |
| POST | `/api/simulate` | Run election simulation |
| POST | `/api/smart-advice` | AI-powered strategic advice (Gemini) |
| POST | `/api/mentor` | Educational Q&A |
| POST | `/api/analyze-strategy` | Quick strategy analysis |

## 🧪 Testing

```bash
npm test
```

## 🔒 Security Features

- Helmet.js security headers (CSP, HSTS, XSS Protection)
- CORS with configurable origins
- Express rate limiting (100 req/15min)
- Input validation middleware
- XSS sanitization on all inputs
- Request body size limit (10kb)

## ♿ Accessibility

- WCAG 2.1 AA compliant
- ARIA roles, labels, and live regions
- Keyboard navigation with arrow key support
- Skip navigation link
- Focus indicators on all interactive elements
- `prefers-reduced-motion` support
- `prefers-contrast: high` support
- Screen reader optimized

## 🤖 Google Services

- **Google Gemini 2.0 Flash** for AI-powered smart advice
- **Gemini Mentor AI** for enhanced educational responses
- Graceful fallback when API key is not configured

## 📋 Scoring System

| Score | Weight | Based On |
|-------|--------|----------|
| Popularity (0-100) | 40% | Promise relevance, audience fit, region alignment |
| Trust (0-100) | 30% | Promise feasibility, focus, budget credibility |
| Reach (0-100) | 30% | Strategy-region fit, budget, coalition support |
# Electra
