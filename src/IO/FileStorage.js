const fsPromises = require('fs/promises');
const path = require('path');

const {addLeadingZero} = require('../Helpers/Date');

class FileStorage {
    /**
     * @param {String} path
     */
    constructor(path) {
        this.storagePath = path;
    }

    /**
     * @returns {Promise<Stats | string | undefined>}
     */
    createStorageDir() {
        return fsPromises.stat(this.storagePath)
            .catch(error => {
                if (error.code !== 'ENOENT') {
                    throw error;
                }

                return fsPromises.mkdir(this.storagePath, { recursive: true });
            });
    }

    /**
     * @param {Number} geoId
     * @param {Date} date
     * @return {String}
     */
    getFileNameByDate(geoId, date) {
        const month = addLeadingZero(date.getMonth() + 1);
        const day = addLeadingZero(date.getDate());

        return path.join(this.storagePath, `y${date.getFullYear()}-m${month}-d${day}_geo${geoId}.json`);
    }

    /**
     * @param {Number} geoId
     * @param {Date} date
     * @param {String} data
     * @returns {Promise<void>}
     */
    store(geoId, date, data) {
        return fsPromises.writeFile(this.getFileNameByDate(geoId, date), data);
    }
}

module.exports = FileStorage;