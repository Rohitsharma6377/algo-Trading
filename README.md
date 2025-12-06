# AlgoTrader - Advanced Algorithmic Trading Platform

[![CI](https://github.com/yourusername/algo-trader-next/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/algo-trader-next/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**⚠️ IMPORTANT DISCLAIMER ⚠️**

This is an **EDUCATIONAL PROJECT** for learning algorithmic trading concepts, machine learning, and full-stack development. 

**DO NOT USE THIS SYSTEM FOR LIVE TRADING WITHOUT:**
- Thorough understanding of financial markets and risks
- Extensive backtesting and validation
- Proper risk management controls
- Compliance with local regulations
- Professional financial advice
- Understanding that **YOU CAN LOSE ALL YOUR MONEY**

The developers are not responsible for any financial losses incurred.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### Core Functionality
- 🤖 **ML-Powered Predictions**: TensorFlow.js models (MLP/LSTM) for price movement prediction
- 📊 **Technical Indicators**: SMA, RSI, MACD, Bollinger Bands, ATR, OBV, and more
- 🔬 **Backtesting Engine**: Test strategies on historical data with detailed metrics
- 📝 **Paper Trading**: Risk-free practice trading with simulated portfolio
- 💼 **Portfolio Management**: Track positions, P&L, and equity curve
- 📈 **Real-time Updates**: Socket.IO for live predictions and trade notifications

### Security & Access Control
- 🔐 **Authentication**: NextAuth with email/password and Google OAuth
- 👥 **Role-Based Access**: Admin and trader roles with different permissions
- 🛡️ **Risk Management**: Position limits, exposure controls, daily loss stops
- 📋 **Audit Logging**: Complete trail of all actions and trades

### Trading Infrastructure
- 🏦 **Broker Adapters**: Skeleton implementations for Zerodha and Upstox (stub mode)
- ⚡ **Live Trading Safety**: Multiple safety layers requiring explicit admin confirmation
- 🎯 **Smart Order Routing**: Risk-validated order execution
- 📊 **Market Data**: Yahoo Finance integration for historical OHLCV data

### Admin Panel
- 👨‍💼 **User Management**: Manage users, roles, and permissions
- 🤖 **Model Management**: View, train, and deploy ML models
- 📈 **System Monitoring**: Audit logs, trading statistics, and health checks
- ⚙️ **Configuration**: Manage risk parameters and system settings

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with Pages Router
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **Recharts** - Charting library for data visualization
- **Socket.IO Client** - Real-time communication

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB + Mongoose** - Database and ODM
- **NextAuth** - Authentication
- **Socket.IO** - WebSocket server
- **Winston** - Logging

### Machine Learning
- **TensorFlow.js (tfjs-node)** - ML model training and inference
- **technicalindicators** - Technical analysis indicators

### Data & Trading
- **yahoo-finance2** - Market data fetching
- **bcrypt** - Password hashing
- **Joi** - Input validation

### DevOps
- **Docker & Docker Compose** - Containerization
- **GitHub Actions** - CI/CD
- **Jest** - Testing framework

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │   Portfolio  │  │  Backtest    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│              Socket.IO Client (Real-time Updates)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js API Routes)            │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │ Auth │  │ Data │  │  ML  │  │Trade │  │Admin │         │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘         │
│                    Socket.IO Server                          │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌──────────────┐  ┌─────────────┐  ┌────────────┐
    │   MongoDB    │  │  TF Models  │  │   Yahoo    │
    │   Database   │  │   Storage   │  │  Finance   │
    └──────────────┘  └─────────────┘  └────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Broker Adapters  │
                    │ (Zerodha/Upstox) │
                    │   [STUB MODE]    │
                    └──────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** 7+ ([Download](https://www.mongodb.com/try/download/community) or use MongoDB Atlas)
- **Git** ([Download](https://git-scm.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/algo-trader-next.git
   cd algo-trader-next
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `MONGODB_URI` - Your MongoDB connection string
   - `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
   - `NEXTAUTH_URL` - Your application URL (http://localhost:3000 for local)

4. **Start MongoDB** (if running locally)
   ```bash
   # On macOS/Linux
   mongod --dbpath /path/to/data/db

   # Or use Docker
   docker run -d -p 27017:27017 mongo:7
   ```

5. **Seed admin user**
   ```bash
   npm run seed-admin
   ```
   
   Default credentials:
   - Email: `admin@algotrader.com`
   - Password: `Admin@12345`
   
   **⚠️ CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!**

6. **Run development server**
   ```bash
   npm run dev
   ```

7. **Open browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🔧 Environment Variables

See `.env.example` for all available options. Key variables:

### Required
```bash
MONGODB_URI=mongodb://localhost:27017/algotrader
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### Optional
```bash
# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Risk Management
MAX_EXPOSURE_PERCENT=10
MAX_POSITIONS=5
PER_TRADE_MAX_RISK_PERCENT=1
DAILY_MAX_LOSS_PERCENT=5

# Live Trading (⚠️ DANGEROUS - see warnings)
LIVE_TRADING=false
ALLOW_REAL_TRADES=NO

# Broker API Keys (DO NOT commit to git!)
ZERODHA_API_KEY=
ZERODHA_API_SECRET=
UPSTOX_API_KEY=
UPSTOX_API_SECRET=
```

---

## 📖 Usage Guide

### 1. Fetch Historical Data

```bash
# Using script
node scripts/fetchData.js RELIANCE.NS 2022-01-01 2024-01-01

# Or via API
curl -X GET "http://localhost:3000/api/fetch/RELIANCE.NS?period1=2022-01-01&period2=2024-01-01" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### 2. Train ML Model

```bash
# Using script
node scripts/trainModel.js RELIANCE.NS

# Or via API
curl -X POST "http://localhost:3000/api/train/RELIANCE.NS" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"modelType":"MLP","epochs":50}'
```

### 3. Generate Prediction

```bash
curl -X GET "http://localhost:3000/api/predict/RELIANCE.NS" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### 4. Run Backtest

```bash
curl -X POST "http://localhost:3000/api/backtest/RELIANCE.NS" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2023-01-01",
    "endDate": "2023-12-31",
    "initialCapital": 100000,
    "commissionPercent": 0.05,
    "confidenceThreshold": 0.6
  }'
```

### 5. Paper Trading

```bash
# Place order
curl -X POST "http://localhost:3000/api/paper/order" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "RELIANCE.NS",
    "side": "BUY",
    "quantity": 10,
    "price": 2500
  }'

# Get positions
curl -X GET "http://localhost:3000/api/paper/positions" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Get ledger
curl -X GET "http://localhost:3000/api/paper/ledger" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

---

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (via NextAuth)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot` - Request password reset
- `POST /api/auth/reset` - Reset password with token

### Data & ML
- `GET /api/fetch/[symbol]` - Fetch and store historical data
- `POST /api/train/[symbol]` - Train ML model
- `GET /api/predict/[symbol]` - Generate prediction

### Trading
- `POST /api/backtest/[symbol]` - Run backtest
- `POST /api/paper/order` - Execute paper trade
- `GET /api/paper/positions` - Get paper positions
- `GET /api/paper/ledger` - Get trade history

### Admin
- `POST /api/admin/seed` - Seed admin user
- Additional admin endpoints in `/pages/api/admin/`

---

## 🚢 Deployment

### Option 1: Docker Compose (Recommended for Development)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Vercel + MongoDB Atlas (Production)

1. **Create MongoDB Atlas cluster** ([Atlas](https://www.mongodb.com/cloud/atlas))

2. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Configure environment variables** in Vercel dashboard

4. **Note on TensorFlow.js**: 
   - `tfjs-node` may not work on serverless (Vercel)
   - Consider using `@tensorflow/tfjs` (browser version) for predictions
   - Or deploy ML training to a separate Node server (Railway/Render)

### Option 3: VPS with PM2

```bash
# On your VPS
git clone <repo>
cd algo-trader-next
npm install
npm run build

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "algotrader" -- start

# Setup auto-restart
pm2 startup
pm2 save
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage
```

---

## ⚠️ Live Trading Setup (Advanced - NOT Recommended)

**WARNING: Live trading involves real money and significant risk of loss.**

If you absolutely must enable live trading:

1. **Understand the risks** - You can lose all your capital
2. **Backtest extensively** - Minimum 6 months of profitable backtests
3. **Start with minimal capital** - Only risk what you can afford to lose
4. **Understand compliance** - Ensure you comply with SEBI and local regulations

### Steps to Enable:

1. **Get broker API credentials**
   - Zerodha: https://kite.trade/
   - Upstox: https://upstox.com/developer/

2. **Configure environment**
   ```bash
   LIVE_TRADING=true
   ALLOW_REAL_TRADES=YES
   ZERODHA_API_KEY=your-key
   ZERODHA_API_SECRET=your-secret
   ```

3. **Replace stub implementations**
   - Edit `lib/brokerAdapters/zerodha.js`
   - Install official SDKs: `npm install kiteconnect`
   - Implement actual API calls (currently commented out)

4. **Admin confirmation required**
   - Live orders require admin to call `/api/admin/confirm-trade`
   - This sets a time-limited token
   - Only then will orders forward to broker

5. **Test in broker sandbox first**

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- TensorFlow.js team for ML capabilities
- Yahoo Finance for market data
- Next.js team for the amazing framework
- Open source community

---

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review code comments

---

## 🎓 Educational Resources

- [Algorithmic Trading Basics](https://www.investopedia.com/articles/active-trading/101014/basics-algorithmic-trading-concepts-and-examples.asp)
- [Machine Learning for Trading](https://www.coursera.org/learn/machine-learning-trading)
- [Technical Analysis](https://www.investopedia.com/terms/t/technicalanalysis.asp)
- [Risk Management](https://www.investopedia.com/articles/trading/09/risk-management.asp)

---

**Remember: Past performance does not guarantee future results. Always trade responsibly.**
