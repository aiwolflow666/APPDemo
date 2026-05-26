var DataDecrypt = (function() {
    var KEY = 'EngLearn2026XX';
    var _cache = {};
    var _idbCache = null;

    function xorDecrypt(data, key) {
        var keyBytes = [];
        for (var i = 0; i < key.length; i++) keyBytes.push(key.charCodeAt(i));
        var result = new Uint8Array(data.length);
        for (var i = 0; i < data.length; i++) {
            result[i] = data[i] ^ keyBytes[i % keyBytes.length];
        }
        return result;
    }

    function openIDB() {
        if (_idbCache) return Promise.resolve(_idbCache);
        return new Promise(function(resolve, reject) {
            var req = indexedDB.open('DataDecryptCache', 1);
            req.onupgradeneeded = function(e) {
                e.target.result.createObjectStore('cache');
            };
            req.onsuccess = function(e) {
                _idbCache = e.target.result;
                resolve(_idbCache);
            };
            req.onerror = function(e) { reject(e.target.error); };
        });
    }

    function getFromIDB(url) {
        return openIDB().then(function(db) {
            return new Promise(function(resolve) {
                try {
                    var tx = db.transaction('cache', 'readonly');
                    var store = tx.objectStore('cache');
                    var req = store.get(url);
                    req.onsuccess = function() {
                        var val = req.result;
                        resolve(val ? val.data : null);
                    };
                    req.onerror = function() { resolve(null); };
                } catch(e) { resolve(null); }
            });
        });
    }

    function saveToIDB(url, data) {
        return openIDB().then(function(db) {
            return new Promise(function(resolve) {
                try {
                    var tx = db.transaction('cache', 'readwrite');
                    tx.objectStore('cache').put({ data: data }, url);
                    tx.oncomplete = function() { resolve(); };
                    tx.onerror = function() { resolve(); };
                } catch(e) { resolve(); }
            });
        });
    }

    function fetchAndDecrypt(url, noCache) {
        if (!noCache && _cache[url]) {
            return Promise.resolve(_cache[url]);
        }
        if (noCache) {
            return _fetchDecrypt(url);
        }
        return getFromIDB(url).then(function(cached) {
            if (cached) {
                _cache[url] = cached;
                return cached;
            }
            return _fetchDecrypt(url);
        });
    }

    function _fetchDecrypt(url) {
        return fetch(url + '?t=' + Date.now())
            .then(function(r) { return r.arrayBuffer(); })
            .then(function(buf) {
                var raw = atob(new Uint8Array(buf).reduce(function(s, b) { return s + String.fromCharCode(b); }, ''));
                var bytes = new Uint8Array(raw.length);
                for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
                var decrypted = xorDecrypt(bytes, KEY);
                var text = new TextDecoder().decode(decrypted);
                var parsed = JSON.parse(text);
                _cache[url] = parsed;
                saveToIDB(url, parsed);
                return parsed;
            });
    }

    function clearCache() {
        _cache = {};
        return openIDB().then(function(db) {
            return new Promise(function(resolve) {
                try {
                    var tx = db.transaction('cache', 'readwrite');
                    tx.objectStore('cache').clear();
                    tx.oncomplete = function() { resolve(); };
                    tx.onerror = function() { resolve(); };
                } catch(e) { resolve(); }
            });
        });
    }

    return { fetchAndDecrypt: fetchAndDecrypt, clearCache: clearCache };
})();
