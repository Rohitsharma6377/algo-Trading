const connectDB = require('./db');
const PaperPortfolio = require('@/models/PaperPortfolio');
const Trade = require('@/models/Trade');

/**
 * Risk Manager
 * Enforces trading rules and position limits
 */

// Runtime state for daily limits
const runtimeState = {
  tradingDisabledToday: false,
  dailyPnL: 0,
  lastResetDate: new Date().toDateString(),
};

/**
 * Risk parameters from environment
 */
const getRiskParams = () => ({
  maxExposurePercent: parseFloat(process.env.MAX_EXPOSURE_PERCENT) || 10,
  maxPositions: parseInt(process.env.MAX_POSITIONS) || 5,
  perTradeMaxRiskPercent: parseFloat(process.env.PER_TRADE_MAX_RISK_PERCENT) || 1,
  dailyMaxLossPercent: parseFloat(process.env.DAILY_MAX_LOSS_PERCENT) || 5,
  tradingTimeWindow: process.env.TRADING_TIME_WINDOW || '09:15-15:30',
});

/**
 * Check if trading is allowed based on time window
 */
function isWithinTradingHours() {
  const params = getRiskParams();
  const [startTime, endTime] = params.tradingTimeWindow.split('-');

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Reset daily state if new day
 */
function checkDailyReset() {
  const today = new Date().toDateString();
  if (runtimeState.lastResetDate !== today) {
    runtimeState.tradingDisabledToday = false;
    runtimeState.dailyPnL = 0;
    runtimeState.lastResetDate = today;
    console.log('📅 Daily risk limits reset');
  }
}

/**
 * Update daily PnL and check stop
 */
async function updateDailyPnL(userId) {
  await connectDB();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTrades = await Trade.find({
    userId,
    createdAt: { $gte: today },
    status: 'closed',
  });

  const totalPnL = todayTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  runtimeState.dailyPnL = totalPnL;

  // Get initial capital (from most recent portfolio snapshot)
  const portfolio = await PaperPortfolio.findOne({ userId })
    .sort({ date: -1 })
    .lean();

  const initialCapital = portfolio ? portfolio.equity : 100000;
  const dailyLossPercent = (totalPnL / initialCapital) * 100;

  const params = getRiskParams();

  if (dailyLossPercent <= -params.dailyMaxLossPercent) {
    runtimeState.tradingDisabledToday = true;
    console.log(`🛑 Daily loss limit reached: ${dailyLossPercent.toFixed(2)}%`);
    return false;
  }

  return true;
}

/**
 * Validate order against risk rules
 * @param {Object} order - Order details
 * @param {string} userId - User ID
 * @returns {Object} - { allowed: boolean, reason: string }
 */
async function validateOrder(order, userId) {
  try {
    checkDailyReset();

    // Check if trading disabled for today
    if (runtimeState.tradingDisabledToday) {
      return {
        allowed: false,
        reason: 'Trading disabled: Daily loss limit reached',
      };
    }

    // Check trading hours
    if (!isWithinTradingHours()) {
      return {
        allowed: false,
        reason: 'Trading outside allowed time window',
      };
    }

    await connectDB();

    // Get current portfolio
    const portfolio = await PaperPortfolio.findOne({ userId })
      .sort({ date: -1 })
      .lean();

    const currentEquity = portfolio ? portfolio.equity : 100000;
    const currentCash = portfolio ? portfolio.cash : 100000;

    const params = getRiskParams();

    // Calculate order value
    const orderValue = order.quantity * order.price;

    // Check if enough cash
    if (order.side === 'BUY' && orderValue > currentCash) {
      return {
        allowed: false,
        reason: 'Insufficient cash',
      };
    }

    // Check max exposure per trade
    const maxTradeValue = (currentEquity * params.perTradeMaxRiskPercent) / 100;
    if (orderValue > maxTradeValue) {
      return {
        allowed: false,
        reason: `Order exceeds max risk per trade (${params.perTradeMaxRiskPercent}% of equity)`,
      };
    }

    // Check max positions (only for new positions)
    if (order.side === 'BUY') {
      const openPositions = await Trade.countDocuments({
        userId,
        status: 'open',
        type: order.type || 'paper',
      });

      if (openPositions >= params.maxPositions) {
        return {
          allowed: false,
          reason: `Maximum positions limit reached (${params.maxPositions})`,
        };
      }
    }

    // Check total exposure
    const openTrades = await Trade.find({
      userId,
      status: 'open',
      type: order.type || 'paper',
    }).lean();

    let totalExposure = openTrades.reduce((sum, trade) => {
      return sum + (trade.quantity * trade.entryPrice);
    }, 0);

    if (order.side === 'BUY') {
      totalExposure += orderValue;
    }

    const exposurePercent = (totalExposure / currentEquity) * 100;
    if (exposurePercent > params.maxExposurePercent) {
      return {
        allowed: false,
        reason: `Total exposure would exceed limit (${params.maxExposurePercent}%)`,
      };
    }

    // Update daily PnL check
    const canTrade = await updateDailyPnL(userId);
    if (!canTrade) {
      return {
        allowed: false,
        reason: 'Daily loss limit reached',
      };
    }

    return {
      allowed: true,
      reason: 'Order validated',
    };
  } catch (error) {
    console.error('Risk validation error:', error);
    return {
      allowed: false,
      reason: 'Risk validation failed',
    };
  }
}

/**
 * Calculate position size based on risk
 * @param {number} accountSize - Total account equity
 * @param {number} riskPercent - Risk per trade (e.g., 1%)
 * @param {number} entryPrice - Entry price
 * @param {number} stopLoss - Stop loss price
 * @returns {number} - Recommended position size
 */
function calculatePositionSize(accountSize, riskPercent, entryPrice, stopLoss) {
  const riskAmount = (accountSize * riskPercent) / 100;
  const priceRisk = Math.abs(entryPrice - stopLoss);

  if (priceRisk === 0) return 0;

  const positionSize = Math.floor(riskAmount / priceRisk);
  return positionSize;
}

/**
 * Get risk status for user
 */
async function getRiskStatus(userId) {
  await connectDB();

  const portfolio = await PaperPortfolio.findOne({ userId })
    .sort({ date: -1 })
    .lean();

  const openPositions = await Trade.countDocuments({
    userId,
    status: 'open',
  });

  const params = getRiskParams();

  return {
    tradingEnabled: !runtimeState.tradingDisabledToday && isWithinTradingHours(),
    dailyPnL: runtimeState.dailyPnL,
    openPositions,
    maxPositions: params.maxPositions,
    currentEquity: portfolio ? portfolio.equity : 100000,
    availableCash: portfolio ? portfolio.cash : 100000,
    riskParams: params,
  };
}

module.exports = {
  validateOrder,
  calculatePositionSize,
  getRiskStatus,
  isWithinTradingHours,
};
