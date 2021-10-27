const {db} = require('./Db');

class AbstractDbRepository {
    /**
     *
     * @param {String} table
     * @param {Db} db
     */
    constructor(table, db) {
        this.table = table;
        this.db = db;
    }

    /**
     * @param {String} query
     * @param {Array} params
     * @returns {Promise<{}[]>}
     */
    findAll(query, params= []) {
        return this.db.select(query, params);
    }
}

module.exports = AbstractDbRepository;