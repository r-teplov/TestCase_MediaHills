const AbstractDbRepository = require('./../AbstractDbRepository');

class CitiesRepository extends AbstractDbRepository {
    /**
     * @param {Db} db
     */
    constructor(db) {
        super('otr_map', db);
    }

    /**
     * @param {Number[]} geoIds
     * @returns {Promise<{}[]>}
     */
    findByGeoIds(geoIds) {
        return this.findAll(
            'SELECT geoId, tvID, mh_city_id_timeshift ' +
            'FROM ' + this.table + ' ' +
            'WHERE geoId IN (' + geoIds.map(() => { return '?'; }).join() + ')' +
            'ORDER BY geoId',
            geoIds);
    }
}

module.exports = CitiesRepository;