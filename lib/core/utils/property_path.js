
/**
 * @param {object} obj
 * @param {string|string[]} path
 */
const getPath = (obj, path) => (Array.isArray(path) ? path.join('.') : path).split('.').reduce((o, k) => (o?.[k]), obj);

/**
 * @param {object} obj
 * @param {string|string[]} path
 * @param {any} value
 */
const setPath = (obj, path, value) => {
    const parts = (Array.isArray(path) ? path.join('.') : path).split('.');
    const lastKey = parts.pop();
    const target = parts.reduce((o, key) => {
        if (!o[key]) { o[key] = {}; }
        return o[key];
    }, obj);
    target[lastKey] = value;
};

module.exports = {
    getPath,
    setPath
};