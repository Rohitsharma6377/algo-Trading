const { calculateIndicators, extractFeatures, generateLabels, normalizeFeatures } = require('../lib/indicators');

describe('Indicators', () => {
  const mockOHLCV = Array.from({ length: 250 }, (_, i) => ({
    date: new Date(Date.now() - (250 - i) * 24 * 60 * 60 * 1000),
    open: 100 + Math.random() * 10,
    high: 110 + Math.random() * 10,
    low: 95 + Math.random() * 10,
    close: 105 + Math.random() * 10,
    volume: 1000000 + Math.random() * 100000,
  }));

  test('calculateIndicators should return all indicators', () => {
    const indicators = calculateIndicators(mockOHLCV);

    expect(indicators).toHaveProperty('sma20');
    expect(indicators).toHaveProperty('sma50');
    expect(indicators).toHaveProperty('sma200');
    expect(indicators).toHaveProperty('rsi14');
    expect(indicators).toHaveProperty('macd');
    expect(indicators).toHaveProperty('bollingerBands');
    expect(indicators).toHaveProperty('atr');

    expect(Array.isArray(indicators.sma20)).toBe(true);
    expect(indicators.sma20.length).toBeGreaterThan(0);
  });

  test('extractFeatures should return feature vector', () => {
    const indicators = calculateIndicators(mockOHLCV);
    const features = extractFeatures(mockOHLCV, indicators, 220);

    expect(Array.isArray(features)).toBe(true);
    expect(features.length).toBe(16); // Expected number of features
    expect(features.every(f => typeof f === 'number')).toBe(true);
  });

  test('generateLabels should return label array', () => {
    const labels = generateLabels(mockOHLCV);

    expect(Array.isArray(labels)).toBe(true);
    expect(labels.length).toBe(mockOHLCV.length);
    expect(labels.every(l => [0, 1, 2].includes(l))).toBe(true);
  });

  test('normalizeFeatures should scale features between 0 and 1', () => {
    const features = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];

    const { normalized, scaler } = normalizeFeatures(features);

    expect(normalized.length).toBe(features.length);
    expect(scaler).toHaveProperty('mins');
    expect(scaler).toHaveProperty('maxs');

    normalized.forEach(row => {
      row.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      });
    });
  });
});
