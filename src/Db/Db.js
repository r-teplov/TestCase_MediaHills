const config = require('../../configs/db.json');
const mysql = require('mysql2/promise');

class Db {
    /**
     * @param {String} host
     * @param {String} db
     * @param {String} user
     * @param {String} pass
     */
    constructor(host, db, user, pass) {
        this.pool = mysql.createPool({
            host: host,
            database: db,
            user: user,
            password: pass,
        });
    }

    /**
     * @param {String} query
     * @param {Array} params
     * @returns {Promise<[{}]>}
     */
    execute(query, params) {
        return this.pool.getConnection().then(connection => {
            const result = connection.query(query, params);
            connection.release();

            return result;
        }).then(result => {
            const [rows] = result;
            return rows;
        });
    }

    /**
     * @param {String} query
     * @param {Array} params
     * @returns {Promise<[{}]>}
     */
    select(query, params) {
        return this.execute(query, params).then(rows => {
            return Array.isArray(rows) ? rows : [];
        });
    }

    /**
     * @param {String} table
     * @param {Object} data
     * @returns {Promise<[{}]>}
     */
    insert(table, data) {
        const query = 'INSERT INTO ?? (??) VALUES (?)';
        const params = [table, Object.keys(data), Object.values(data)];

        return this.execute(query, params);
    }

    /**
     * @returns {Promise<void>}
     */
    closeConnections() {
        return this.pool.end();
    }
}

module.exports.db = new Db(config.host, config.db, config.user, config.pass);
