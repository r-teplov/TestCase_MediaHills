const AbstractDbRepository = require('./../AbstractDbRepository');

class CitiesRepository extends AbstractDbRepository {
    /**
     * @param {Db} db
     */
    constructor(db) {
        super('otr_map', db);
    }

    /**
     * @returns {Promise<{}[]>}
     */
    findCities() {
        return this.findAll('SELECT geoId, tvID, mh_city_id_timeshift FROM ' + this.table + ' ORDER BY geoId');
    }
}

module.exports = CitiesRepository;