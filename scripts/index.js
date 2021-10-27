const crypto = require('crypto');

const {db} = require('../src/Db/Db');
const CitiesRepository = require('../src/Db/Repositories/CitiesRepository');
const StatisticRepository = require('../src/Db/Repositories/StatisticRepository');
const {formatAsMysqlString} = require('../src/Helpers/Date');

const citiesRepository = new CitiesRepository(db);
const geoIds = [13, 21, 237];
const statisticYear = 2021;
const statisticMonth = 1;
const initialDate = new Date(statisticYear, statisticMonth);

citiesRepository.findByGeoIds(geoIds)
    .then(cities => {
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
    })
    .then(cities => {
        const promises = [];
        const keys = new Map();
        const result = [];

        cities.forEach(({tvIds, timeShift}, geoId) => {
            const statisticRepository = new StatisticRepository(initialDate.getFullYear(), initialDate.getMonth() + 1, geoId, db);

            promises.push(statisticRepository.findByDateAndTvIds(initialDate, tvIds)
                .then(statistic => {
                    statistic.forEach(({num_key, sTimeMsk, dur}) => {
                        const viewDate = new Date(sTimeMsk);
                        viewDate.setSeconds(0);

                        const hash = crypto.createHash('md5');
                        hash.update(geoId + ':' + viewDate.valueOf());
                        const key = hash.digest('hex');

                        if (!keys.has(key)) {
                            const localTime = new Date(viewDate);

                            if (timeShift > 0) {
                                localTime.setTime(localTime.getTime() + timeShift * 60 * 60 * 1000);
                            }

                            result.push({
                                geoId: geoId,
                                localTime: formatAsMysqlString(localTime),
                                timeMsk: formatAsMysqlString(viewDate),
                                mc_keys: [num_key]
                            });
                            keys.set(key, result.length - 1);
                        } else {
                            result[keys.get(key)].mc_keys.push(num_key);
                        }
                    });

                    return statistic;
                }));
        });

        return Promise.all([result, ...promises]);
    })
    .finally(() => {
        return db.closeConnections();
    });