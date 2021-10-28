const path = require('path');

const {db} = require('../src/Db/Db');
const CitiesRepository = require('../src/Db/Repositories/CitiesRepository');
const StatisticRepository = require('../src/Db/Repositories/StatisticRepository');
const StatisticRequestRepository = require('../src/Db/Repositories/StatisticRequestRepository');
const FileStorage = require('../src/IO/FileStorage');
const HttpStorage = require('../src/IO/HttpStorage');
const {formatAsMysqlString} = require('../src/Helpers/Date');

const geoIds = [13, 21, 237];
const viewsYear = 2021;
const viewsMonth = 1;
const initialDate = new Date(viewsYear, viewsMonth);

const citiesRepository = new CitiesRepository(db);
const statsRepositories = new Map();
geoIds.forEach(geoId => {
    statsRepositories.set(geoId, new StatisticRepository(viewsYear, viewsMonth + 1, geoId, db));
});
const requestRepository = new StatisticRequestRepository(db);
const fileStorage = new FileStorage(path.join(__dirname, '../data/files/'));
const httpStorage = new HttpStorage();

/**
 * @param {Array} cities
 * @returns {Map}
 */
const mapTvIds = cities => {
    return cities.reduce((result, city) => {
        const {geoId, tvID, mh_city_id_timeshift} = city;

        if (!result.has(geoId)) {
            result.set(geoId, {
                tvIds: [tvID],
                timeShift: mh_city_id_timeshift
            });
        } else {
            result.get(geoId).tvIds.push(tvID);
        }

        return result;
    }, new Map());
};

/**
 * @param {Number} geoId
 * @param {Number} numKey
 * @param {Number} timeShift
 * @param {Date} viewDate
 * @param {Map} keys
 * @param {Array} result
 */
const addView = (geoId, numKey, timeShift, viewDate, keys, result) => {
    const key = geoId + ':' + viewDate.getTime();

    if (!keys.has(key)) {
        const localTime = new Date(viewDate);

        if (timeShift > 0) {
            localTime.setTime(localTime.getTime() + timeShift * 60 * 60 * 1000);
        }

        result.push({
            geoId: geoId,
            timeLocal: formatAsMysqlString(localTime),
            timeMsk: formatAsMysqlString(viewDate),
            mc_keys: [numKey]
        });
        keys.set(key, result.length - 1);
    } else {
        result[keys.get(key)].mc_keys.push(numKey);
    }
};

citiesRepository.findByGeoIds(geoIds)
    .then(cities => {
        return fileStorage.createStorageDir()
            .then(() => {
                return mapTvIds(cities);
            });
    })
    .then(cities => {
        const promises = [];

        while (initialDate.getMonth() === viewsMonth) {
            cities.forEach(({tvIds, timeShift}, geoId) => {
                const currentDate = new Date(initialDate);

                promises.push(statsRepositories.get(geoId).findByDateAndTvIds(currentDate, tvIds)
                    .then(statistic => {
                        const keys = new Map();
                        const result = [];

                        statistic.forEach(({num_key, sTimeMsk, dur}) => {
                            const viewDate = new Date(sTimeMsk);
                            viewDate.setSeconds(0);

                            addView(geoId, num_key, timeShift, viewDate, keys, result);
                            dur = dur > 60 ? dur - 60 : 0;

                            while (dur % 60 > 0) {
                                viewDate.setTime(viewDate.getTime() + 60 * 1000);
                                addView(geoId, num_key, timeShift, viewDate, keys, result);
                                dur -= 60;
                            }
                        });

                        return result;
                    })
                    .then(result => {
                        const json = JSON.stringify(result);

                        return fileStorage.store(geoId, currentDate, json)
                            .then(() => httpStorage.store(json))
                            .then(requestParam => {
                                return requestRepository.save(requestParam);
                            });
                    }));
            });

            initialDate.setTime(initialDate.getTime() + 24 * 60 * 60 * 1000);
        }

        return Promise.all(promises);
    })
    .finally(() => {
        return db.closeConnections();
    });