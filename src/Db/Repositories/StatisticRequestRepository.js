const AbstractDbRepository = require('../AbstractDbRepository');

class StatisticRequestRepository extends AbstractDbRepository {
    /**
     * @param {Db} db
     */
    constructor(db) {
        super('stat_request', db);
    }

    /**
     * @param {Object} data
     * @returns {Promise<{}[]>}
     */
    save(data) {
        return this.db.insert(this.table, data);
    }
}

module.exports = StatisticRequestRepository;