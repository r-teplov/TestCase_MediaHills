const {db} = require('../src/Db/Db');
const CitiesRepository = require('../src/Db/Repositories/CitiesRepository');
const StatisticRepository = require('../src/Db/Repositories/StatisticRepository');
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
        return mapTvIds(cities);
    })
    .then(cities => {
        const promises = [];
        const keys = new Map();
        const result = [];

        while (initialDate.getMonth() === viewsMonth) {
            cities.forEach(({tvIds, timeShift}, geoId) => {
                promises.push(statsRepositories.get(geoId).findByDateAndTvIds(initialDate, tvIds)
                    .then(statistic => {
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

                        return statistic;
                    }));
            });

            initialDate.setTime(initialDate.getTime() + 24 * 60 * 60 * 1000);
        }

        return Promise.all([result, keys, ...promises]);
    })
    .finally(() => {
        return db.closeConnections();
    });