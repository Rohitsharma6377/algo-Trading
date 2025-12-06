
export const formatDate = (date) => {
    return new Date(date).toLocaleString();
};

export const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
