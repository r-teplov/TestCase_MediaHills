/**
 * @param {Number} datePart
 * @returns {String}
 */
const addLeadingZero = (datePart) => {
    return String(datePart).padStart(2, '0');
};


/**
 * @param {Date} date
 * @returns {String}
 */
formatAsMysqlString = (date) => {
    const month = addLeadingZero(date.getMonth() + 1);
    const days = addLeadingZero(date.getDate());
    const hours = addLeadingZero(date.getHours());
    const minutes = addLeadingZero(date.getMinutes());
    const seconds = addLeadingZero(date.getSeconds())

    return `${date.getFullYear()}-${month}-${days} ${hours}:${minutes}:${seconds}`;
};

module.exports = {
    addLeadingZero,
    formatAsMysqlString
};