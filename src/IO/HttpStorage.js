const config = require('../../configs/api');
const axios = require('axios');

class HttpStorage {
    /**
     * @param {String} data
     * @returns {Promise<{status: Number, body: String, duration: Number}>}
     */
    store(data) {
        const requestConfig = {
            headers: {
                'Authorization': config.authHeader
            }
        };

        const timeFrom = new Date();

        return axios.post(config.endPoint, data, requestConfig)
            .then(response => {
                const timeEnd = new Date();

                return {
                    status: response.status,
                    body: response.data,
                    duration: (timeEnd.getTime() - timeFrom.getTime()) / 1000
                };
            })
            .catch(error => {
                const timeEnd = new Date();

                const result = {
                    status: 0,
                    body: '',
                    duration: (timeEnd.getTime() - timeFrom.getTime()) / 1000
                };

                if (error.response) {
                    result.status = error.response.status;
                    result.body = error.response.body || '';
                }

                return result;
            });
    }
}

module.exports = HttpStorage;