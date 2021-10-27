const AbstractDbRepository = require('../AbstractDbRepository');
const {addLeadingZero, formatAsMysqlString} = require('../../Helpers/Date');

class StatisticRepository extends AbstractDbRepository {
    /**
     * @param {Number} year
     * @param {Number} month
     * @param {Number} city
     * @param {Db} db
     */
    constructor(year, month, city, db) {
        const monthStr = addLeadingZero(month);
        const tableName = `stat_y${year}m${monthStr}_geo${city}`;

        super(tableName, db);
    }

    /**
     * @param {Date} date
     * @param {Number[]} tvIds
     * @returns {Promise<{}[]>}
     */
    findByDateAndTvIds(date, tvIds) {
        const params = [];
        const tvIdsCondition = tvIds.map(() => { return '?'; }).join();

        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        params.push(formatAsMysqlString(date));

        date.setHours(23);
        date.setMinutes(59);
        date.setSeconds(59);
        params.push(formatAsMysqlString(date));

        params.push(...tvIds);

        return this.findAll(
            'SELECT b.num_key, a.sTimeMsk, a.dur ' +
            'FROM ' + this.table + ' a ' +
            'JOIN num_keys b ON b.num = a.num ' +
            'WHERE 1 AND a.sTimeMsk BETWEEN ? AND ? AND a.tvId IN (' + tvIdsCondition + ')',
            params
        );
    }
}

module.exports = StatisticRepository;