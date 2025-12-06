
export const round = (num, decimals = 2) => {
    return Number(Math.round(num + 'e' + decimals) + 'e-' + decimals);
};

export const percentChange = (initial, final) => {
    if (initial === 0) return 0;
    return ((final - initial) / initial) * 100;
};
