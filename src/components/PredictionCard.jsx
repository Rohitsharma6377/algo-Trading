export default function PredictionCard({ prediction }) {
  const getConfidenceColor = (confidence) => {
    const conf = parseFloat(confidence);
    if (conf >= 80) return 'text-green-600';
    if (conf >= 60) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getPredictionBadge = (pred) => {
    switch (pred) {
      case 'BUY':
        return 'bg-green-100 text-green-800';
      case 'SELL':
        return 'bg-red-100 text-red-800';
      case 'HOLD':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReliabilityIcon = (reliability) => {
    switch (reliability) {
      case 'high':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 card-hover">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">{prediction.symbol}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPredictionBadge(prediction.prediction)}`}>
          {prediction.prediction}
        </span>
      </div>

      {/* Confidence */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">Confidence</span>
          <span className={`text-lg font-bold ${getConfidenceColor(prediction.confidence)}`}>
            {prediction.confidence}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all"
            style={{ width: prediction.confidence }}
          ></div>
        </div>
      </div>

      {/* Reliability */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Reliability</span>
          <span className="text-sm font-medium">
            {getReliabilityIcon(prediction.reliability)} {prediction.reliability}
          </span>
        </div>
      </div>

      {/* Price Info */}
      {prediction.currentPrice && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Current Price</span>
            <span className="font-medium">${prediction.currentPrice}</span>
          </div>
          {prediction.suggestedAction?.targetPrice && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Target</span>
              <span className="font-medium text-green-600">
                ${prediction.suggestedAction.targetPrice}
              </span>
            </div>
          )}
          {prediction.suggestedAction?.stopLoss && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Stop Loss</span>
              <span className="font-medium text-red-600">
                ${prediction.suggestedAction.stopLoss}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Model Info */}
      {prediction.model && (
        <div className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between mb-1">
            <span>Model Accuracy</span>
            <span>{prediction.model.accuracy}</span>
          </div>
          <div className="flex justify-between">
            <span>Last Updated</span>
            <span>{new Date(prediction.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-4">
        <button className="w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
          Trade {prediction.symbol}
        </button>
      </div>
    </div>
  );
}
