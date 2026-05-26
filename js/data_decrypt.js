var DataDecrypt = (function() {
    var KEY = 'EngLearn2026XX';
    var _cache = {};

    function xorDecrypt(data, key) {
        var keyBytes = [];
        for (var i = 0; i < key.length; i++) keyBytes.push(key.charCodeAt(i));
        var result = new Uint8Array(data.length);
        for (var i = 0; i < data.length; i++) {
            result[i] = data[i] ^ keyBytes[i % keyBytes.length];
        }
        return result;
    }

    function fetchAndDecrypt(url, noCache) {
        if (!noCache && _cache[url]) {
            return Promise.resolve(_cache[url]);
        }
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
                return parsed;
            });
    }

    function clearCache() { _cache = {}; }

    return { fetchAndDecrypt: fetchAndDecrypt, clearCache: clearCache };
})();
