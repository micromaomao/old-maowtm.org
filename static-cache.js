const path = require('path');
const fs = require('fs');

var cached = {};
var static_path = path.join(__dirname, "static/");
if (!static_path.match(/\/$/)) {
    static_path = static_path + "/";
}

module.exports = function(requestPath, set, done) {
    var fpath = path.join(static_path, requestPath);

    if (requestPath.match(/(^|\/)\.\.($|\/)/) || fpath.substr(0, static_path.length) != static_path) {
        return done(new Error("Path not valid."));
    }
    var fileName = fpath.substr(static_path.length);
    if (cached[fileName]) {
        done(null, cached[fileName]);
    } else {
        fs.readFile(fpath, {encoding: 'utf-8'}, function(err, data) {
            if (err) {
                return done();
            }
            set(fileName, data, function(err, processedData) {
                if (err) {
                    return done(err);
                }
                cached[fileName] = processedData;
                done(null, processedData);
            });
        });
    }
};
