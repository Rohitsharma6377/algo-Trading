# API Testing Examples

This file contains example curl commands to test all API endpoints.

## Prerequisites

1. Start the server: `npm run dev`
2. Seed admin user: `npm run seed-admin`
3. Login to get session token (use browser or get from cookie)

For authenticated requests, you'll need the session token from the cookie `next-auth.session-token`.

---

## Authentication

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trader@example.com",
    "password": "Trader@123",
    "name": "Test Trader"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Forgot Password
```bash
curl -X POST http://localhost:3000/api/auth/forgot \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@algotrader.com"
  }'
```

---

## Data Fetching

### Fetch Historical Data
```bash
curl -X GET "http://localhost:3000/api/fetch/RELIANCE.NS?period1=2022-01-01&period2=2024-01-01" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Fetch with default 2-year range
```bash
curl -X GET http://localhost:3000/api/fetch/TCS.NS \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

---

## Machine Learning

### Train Model (MLP)
```bash
curl -X POST http://localhost:3000/api/train/RELIANCE.NS \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modelType": "MLP",
    "epochs": 50,
    "batchSize": 32
  }'
```

### Train Model (LSTM - experimental)
```bash
curl -X POST http://localhost:3000/api/train/TCS.NS \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modelType": "LSTM",
    "epochs": 30,
    "batchSize": 16
  }'
```

### Generate Prediction
```bash
curl -X GET http://localhost:3000/api/predict/RELIANCE.NS \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

---

## Backtesting

### Run Backtest
```bash
curl -X POST http://localhost:3000/api/backtest/RELIANCE.NS \
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

### Run Backtest with Higher Confidence
```bash
curl -X POST http://localhost:3000/api/backtest/TCS.NS \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2023-06-01",
    "endDate": "2023-12-31",
    "initialCapital": 200000,
    "commissionPercent": 0.03,
    "confidenceThreshold": 0.75
  }'
```

---

## Paper Trading

### Place Buy Order
```bash
curl -X POST http://localhost:3000/api/paper/order \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "RELIANCE.NS",
    "side": "BUY",
    "quantity": 10,
    "price": 2500,
    "stopLoss": 2400,
    "takeProfit": 2700
  }'
```

### Place Sell Order
```bash
curl -X POST http://localhost:3000/api/paper/order \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "RELIANCE.NS",
    "side": "SELL",
    "quantity": 10,
    "price": 2600
  }'
```

### Get Positions
```bash
curl -X GET http://localhost:3000/api/paper/positions \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Get Trade Ledger
```bash
curl -X GET http://localhost:3000/api/paper/ledger \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Get Ledger with Pagination
```bash
curl -X GET "http://localhost:3000/api/paper/ledger?limit=20&skip=0" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Get Only Closed Trades
```bash
curl -X GET "http://localhost:3000/api/paper/ledger?status=closed" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

---

## Admin

### Seed Admin User
```bash
curl -X POST http://localhost:3000/api/admin/seed \
  -H "Content-Type: application/json"
```

---

## Complete Workflow Example

Here's a complete workflow to test the entire system:

### Step 1: Seed Admin (one-time)
```bash
npm run seed-admin
```

### Step 2: Login via browser
Navigate to http://localhost:3000/auth/login
- Email: admin@algotrader.com
- Password: Admin@12345

### Step 3: Get session token from browser cookies
Open DevTools → Application → Cookies → Copy `next-auth.session-token`

### Step 4: Fetch historical data
```bash
export SESSION_TOKEN="your-session-token-here"

curl -X GET http://localhost:3000/api/fetch/RELIANCE.NS \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN"
```

### Step 5: Train model
```bash
curl -X POST http://localhost:3000/api/train/RELIANCE.NS \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"modelType":"MLP","epochs":50}'
```

### Step 6: Get prediction
```bash
curl -X GET http://localhost:3000/api/predict/RELIANCE.NS \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN"
```

### Step 7: Run backtest
```bash
curl -X POST http://localhost:3000/api/backtest/RELIANCE.NS \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2023-01-01",
    "endDate": "2023-12-31",
    "initialCapital": 100000,
    "confidenceThreshold": 0.6
  }'
```

### Step 8: Paper trade
```bash
# Buy
curl -X POST http://localhost:3000/api/paper/order \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "RELIANCE.NS",
    "side": "BUY",
    "quantity": 5,
    "price": 2500
  }'

# Check positions
curl -X GET http://localhost:3000/api/paper/positions \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN"

# Sell
curl -X POST http://localhost:3000/api/paper/order \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "RELIANCE.NS",
    "side": "SELL",
    "quantity": 5,
    "price": 2550
  }'

# Check ledger
curl -X GET http://localhost:3000/api/paper/ledger \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN"
```

---

## Using Scripts Instead

Alternatively, you can use the provided scripts:

```bash
# Fetch data
node scripts/fetchData.js RELIANCE.NS 2022-01-01 2024-01-01

# Train model
node scripts/trainModel.js RELIANCE.NS

# Or use Makefile
make fetch SYMBOL=RELIANCE.NS
make train SYMBOL=RELIANCE.NS
```

---

## Popular Indian Stock Symbols

For testing, use these NSE symbols (append .NS):
- RELIANCE.NS - Reliance Industries
- TCS.NS - Tata Consultancy Services
- HDFCBANK.NS - HDFC Bank
- INFY.NS - Infosys
- ICICIBANK.NS - ICICI Bank
- HINDUNILVR.NS - Hindustan Unilever
- ITC.NS - ITC Limited
- SBIN.NS - State Bank of India
- BHARTIARTL.NS - Bharti Airtel
- KOTAKBANK.NS - Kotak Mahindra Bank

For US stocks, use symbols directly:
- AAPL - Apple
- GOOGL - Google
- MSFT - Microsoft
- TSLA - Tesla
- AMZN - Amazon

---

## Notes

1. **Session Token**: After login, extract the session token from cookies
2. **Data Requirements**: Need at least 300 historical bars to train a model
3. **Training Time**: Model training can take 1-5 minutes depending on data size
4. **Predictions**: Require a trained model for the symbol
5. **Backtesting**: Requires both historical data and a trained model

---

## Troubleshooting

### Error: "No trained model found"
- Run training first: `/api/train/[symbol]`

### Error: "Insufficient data"
- Fetch more historical data: `/api/fetch/[symbol]`

### Error: "Unauthorized"
- Login and get valid session token
- Check cookie is being sent correctly

### Error: "Order rejected by risk manager"
- Check risk parameters in .env
- Ensure sufficient cash for buy orders
- Check position limits

---

## WebSocket Testing

For testing Socket.IO real-time updates, use a browser client:

```javascript
// In browser console
const socket = io('http://localhost:3000', { path: '/api/socket_io' });

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('join-symbol', 'RELIANCE.NS');
});

socket.on('prediction', (data) => {
  console.log('New prediction:', data);
});
```
