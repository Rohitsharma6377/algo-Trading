# 🚀 COMPLETE SETUP GUIDE - AI Stock Analysis

## ⚠️ IMPORTANT: Before You Start

You need to have **MongoDB running**. Here's how:

### Option 1: Start MongoDB (Windows)
```bash
# If you installed MongoDB as a service:
net start MongoDB

# Or run it manually:
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

### Option 2: Use MongoDB Atlas (Cloud - FREE)
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a free cluster
4. Get your connection string
5. Update `.env.local`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/algo-trading
   ```

---

## 📋 Step-by-Step Setup

### Step 1: Make Sure MongoDB is Running

Check if MongoDB is running:
```bash
# Try to connect
mongosh
```

If it connects, you're good! Type `exit` to quit.

If not, start MongoDB (see above).

### Step 2: Download Historical Data

Run this command to download 10 years of data for RELIANCE.NS:

```bash
npm run quick-setup
```

You should see:
```
🚀 Starting Auto-Setup...
📡 Connecting to MongoDB...
✅ Connected to database!
📥 Downloading 10 years of data for RELIANCE.NS...
✅ Downloaded 2,500 days of data
💾 Saving to database...
   Saved 100/2500 records...
   Saved 200/2500 records...
   ...
✅ Saved 2,500 records to database!
🎉 Setup complete for RELIANCE.NS!
```

### Step 3: Train the ML Model

1. **Open your browser**: http://localhost:3000/admin
2. **Login** with your admin account
3. **Click "Training"** in the sidebar
4. **Enter symbol**: `RELIANCE.NS`
5. **Click "Train Model"**
6. **Wait** for training to complete (~2-3 minutes)

You'll see:
```
Training Progress: 50/50 epochs
Accuracy: 85.67%
✅ Model trained successfully!
```

### Step 4: Use the Research Lab!

1. **Go to**: http://localhost:3000/admin/research
2. **Click "Deep Analyzer" tab**
3. **Search for**: `RELIANCE.NS`
4. **See the AI recommendation!**

You'll get:
- 🤖 ML Prediction (Buy/Hold/Sell probabilities)
- 📊 Model accuracy and confidence
- 📈 Historical performance analysis
- 📰 News sentiment analysis
- ✅ Clear BUY/HOLD/SELL recommendation

---

## 🔧 Troubleshooting

### Error: "ECONNREFUSED 127.0.0.1:27017"
**Problem**: MongoDB is not running

**Solution**:
```bash
# Windows:
net start MongoDB

# Or manually:
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

### Error: "Need at least 200 days of historical data"
**Problem**: Data wasn't downloaded

**Solution**: Run `npm run quick-setup` again

### Error: "No trained ML model available"
**Problem**: You haven't trained a model yet

**Solution**: Go to Admin → Training → Train a model for the stock

### Error: "Failed to connect to MetaMask"
**Problem**: Browser extension interference (harmless)

**Solution**: Already fixed! Just ignore it or disable MetaMask extension

---

## 📦 What Gets Installed?

When you run `npm run quick-setup`:

1. **Historical Data** (10 years):
   - Daily OHLCV (Open, High, Low, Close, Volume)
   - ~2,500 data points
   - Stored in MongoDB `ohlcvs` collection

2. **News Sentiment** (optional):
   - Recent news articles
   - Sentiment scores
   - Stored in MongoDB `newssentiments` collection

3. **ML Model** (after training):
   - Neural network weights
   - Saved in `models_tf/RELIANCE.NS/` folder
   - Metadata in MongoDB `modelmetas` collection

---

## 🎯 Quick Commands Reference

```bash
# Download data for one stock (RELIANCE.NS)
npm run quick-setup

# Download data for ALL popular stocks (takes 20-30 min)
npm run auto-setup

# Download data for a specific stock
npm run fetch-data SYMBOL.NS

# Train a model for a specific stock
npm run train-model SYMBOL.NS

# Start the development server
npm run dev
```

---

## ✅ Verification Checklist

Before using the Research Lab, make sure:

- [ ] MongoDB is running
- [ ] You ran `npm run quick-setup` successfully
- [ ] You trained a model in the Admin panel
- [ ] You can see the stock in Research Lab

---

## 🆘 Still Having Issues?

1. **Check MongoDB connection**:
   ```bash
   mongosh
   ```

2. **Check if data was saved**:
   ```bash
   mongosh
   use algo-trading
   db.ohlcvs.countDocuments({ symbol: "RELIANCE.NS" })
   # Should show ~2500
   ```

3. **Check if model was trained**:
   ```bash
   # Check if folder exists:
   dir models_tf\RELIANCE.NS
   # Should show model.json and weights.bin
   ```

---

## 🎉 Success!

Once everything is set up, you have a **fully functional AI-powered stock analysis system** that:

- ✅ Uses real machine learning models
- ✅ Analyzes 10+ years of historical data
- ✅ Processes news sentiment
- ✅ Gives accurate buy/sell recommendations
- ✅ Shows confidence scores and reasoning

**Enjoy your AI trading assistant!** 🚀📈
