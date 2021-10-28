const config = require('../../configs/api');
const axios = require('axios');

class HttpStorage {
    /**
     * @param {String} data
     * @returns {Promise<{body: *, status: *} | {body: string, status: number}>}
     */
    store(data) {
        const requestConfig = {
            headers: {
                'Authorization': config.authHeader
            }
        };

        return axios.post(config.endPoint, data, requestConfig)
            .then(response => {
                return {
                    status: response.status,
                    body: response.data
                };
            })
            .catch(error => {
                const result = {
                    status: 0,
                    body: ''
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