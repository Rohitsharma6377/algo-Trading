
const modelCache = new Map();

export const getModel = (symbol) => {
    return modelCache.get(symbol);
};

export const setModel = (symbol, model) => {
    modelCache.set(symbol, model);
};

export const clearCache = () => {
    modelCache.clear();
};

export const hasModel = (symbol) => {
    return modelCache.has(symbol);
};
