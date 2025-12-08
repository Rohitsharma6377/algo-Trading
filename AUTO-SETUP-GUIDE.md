# 🤖 AI Stock Analysis - Auto Setup Guide

## Quick Start (Automatic Setup)

Run this ONE command to set up everything automatically:

```bash
npm run auto-setup
```

This will:
1. ✅ Download 10 years of historical data for 10 popular Indian stocks
2. ✅ Fetch news sentiment data
3. ✅ Train ML models for each stock
4. ✅ Save everything to your database

**Stocks that will be set up:**
- RELIANCE.NS (Reliance Industries)
- TCS.NS (Tata Consultancy Services)
- INFY.NS (Infosys)
- HDFCBANK.NS (HDFC Bank)
- ICICIBANK.NS (ICICI Bank)
- SBIN.NS (State Bank of India)
- TATASTEEL.NS (Tata Steel)
- TATAMOTORS.NS (Tata Motors)
- WIPRO.NS (Wipro)
- ITC.NS (ITC Limited)

## What Happens During Setup?

### Step 1: Download Historical Data (10 years)
```
📥 Downloading 10 years of data for RELIANCE.NS...
✅ Downloaded 2,500 days of data
💾 Saved 2,500 records to database
```

### Step 2: Fetch News Sentiment
```
📰 Fetching news for RELIANCE.NS...
💾 Saved 100 news items
```

### Step 3: Train ML Model
```
🤖 Training ML model for RELIANCE.NS...
📊 Prepared 2,479 training samples
Epoch 10: loss=0.4523 acc=0.7234
Epoch 20: loss=0.3891 acc=0.7856
Epoch 30: loss=0.3245 acc=0.8123
Epoch 40: loss=0.2987 acc=0.8345
Epoch 50: loss=0.2756 acc=0.8567
✅ Model trained successfully!
   Accuracy: 85.67%
   Val Accuracy: 82.34%
```

## After Setup

Once complete, you can:

1. **Go to Research Lab**
   ```
   http://localhost:3000/admin/research
   ```

2. **Search for any stock** (e.g., "RELIANCE.NS")

3. **Get AI-powered recommendations** with:
   - Buy/Hold/Sell prediction from ML model
   - Confidence scores
   - Historical performance analysis
   - News sentiment analysis
   - Comprehensive reasoning

## Manual Setup (If Needed)

If you want to add a specific stock manually:

```bash
# 1. Download data
npm run fetch-data SYMBOL.NS

# 2. Train model
npm run train-model SYMBOL.NS
```

## Troubleshooting

### "Insufficient data" error
- The auto-setup will skip stocks with less than 200 days of data
- Try running again later or use a different stock

### Database connection error
- Make sure MongoDB is running
- Check your `.env.local` file has `MONGODB_URI`

### Model training fails
- Ensure you have enough RAM (at least 4GB free)
- Try training one stock at a time instead of all at once

## Time Required

- **Per Stock**: ~2-3 minutes
- **All 10 Stocks**: ~20-30 minutes

## System Requirements

- Node.js 18+
- MongoDB running
- 4GB+ free RAM
- Internet connection (for downloading data)

---

**Ready to start?** Just run:
```bash
npm run auto-setup
```

Then visit the Research Lab and start analyzing stocks! 🚀
