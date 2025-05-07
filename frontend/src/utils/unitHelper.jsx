export function formatNumber(number) {
    if (number === null || number === undefined) {
        return null;
    }
    if (Math.abs(number) >= 1000000000000) {
        return (number / 1000000000000).toFixed(2) + 'T';
    } else if (Math.abs(number) >= 1000000000) {
        return (number / 1000000000).toFixed(2) + 'B';
    } else if (Math.abs(number) >= 1000000) {
        return (number / 1000000).toFixed(2) + 'M';
    } else if (Math.abs(number) >= 1000) {
        return (number / 1000).toFixed(2) + 'K';
    } else if (number < 0) {
        return number.toFixed(2);
    } else {
        return number.toFixed(3);
    }
}

export function formatSmallTransactions(number) {
    const roundedNumber = parseFloat(number).toFixed(2);
    return roundedNumber.toLocaleString();
}