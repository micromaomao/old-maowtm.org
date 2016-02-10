const express = require('express');
const pages = require('../pages');
const gpgKeyInfo = require('./gpgKeyInfo');
const mongoose = require('mongoose');
const fs = require('fs');
const marked = require('marked');
const querystring = require('querystring');

var activitySchema = new mongoose.Schema({
    _id: String,
    desc: String, // markdown
    date: Date,
    tags: [String],
    haveBlogContent: {type: Boolean, default: false},
    blogContent: String, // markdown
    title: {type: String, default: null},
    deleted: Boolean
});
var activityImportLogSchema = new mongoose.Schema({
    file: String,
    date: Date
});

activitySchema.static('import', function (data, callback, cd) {
    cd = cd || "";
    try {
        var activities = JSON.parse(data);
    } catch (e) {
        callback(new Error("JSON Error: " + e.toString()));
        return;
    }
    function importOne(activ, blogc, callback) {
        var date = new Date(activ.date);
        marked(activ.desc, function(err, desc) {
            if(err) {
                callback(err);
                return;
            }
            activity.findByIdAndUpdate(activ._id,
                    {desc: desc, date: date, tags: activ.tags, blogContent: blogc, title: activ.title,
                        deleted: activ.deleted || false, haveBlogContent: blogc.length > 0}, {new: true, upsert: true}, callback);
        });
    }
    function doImport(i) {
        if(i >= activities.length) {
            callback(null);
            return;
        }
        var activ = activities[i];
        if(!activ._id) {
            callback(new Error('no _id on activity #' + i));
            return;
        }
        if (activ._blogMd) {
            if(!activ.title) {
                callback(new Error('article must have a title.'));
                returnk
            }
            fs.readFile(cd + '/' + activ._blogMd, {encoding: "utf8"}, function (err, blogc) {
                if(err) {
                    callback(err);
                    return;
                }
                marked(blogc, function(err, blogc) {
                    if(err) {
                        callback(err);
                        return;
                    }
                    importOne(activ, blogc, function (err) {
                        if(err) {
                            callback(err);
                            return;
                        }
                        doImport(i + 1);
                    });
                });
            });
        } else {
            importOne(activ, "", function (err) {
                if(err) {
                    callback(err);
                    return;
                }
                doImport(i + 1);
            });
        }
    }
    doImport(0);
});
activityImportLogSchema.static('importFile', function (filepath, force, callback, cd) {
    if(typeof force == 'function') {
        cd = callback;
        callback = force;
        force = false;
    }
    cd = cd || "";
    filepath = cd + '/' + filepath;
    activityImportLog.findOne({file: filepath}, function (err, log) {
        if(err) {
            callback(err);
            return;
        }
        if(log) {
            fs.stat(filepath, function(err, stat) {
                if(err) {
                    callback(err);
                    return;
                }
                if(stat.isDirectory()) {
                    callback(null);
                    return;
                }
                var lastModified = stat.mtime;
                if(log.date < lastModified) {
                    fs.readFile(filepath, {encoding: "utf8"}, function (err, data) {
                        if(err) {
                            callback(err);
                            return;
                        }
                        activity.import(data, function(err) {
                            if(err) {
                                callback(err);
                                return;
                            }
                            log.set('date', lastModified);
                            log.save(callback);
                        }, cd);
                    });
                } else {
                    callback(null);
                }
            });
        } else {
            var log = new activityImportLog({
                file: filepath
            });
            fs.stat(filepath, function(err, stat) {
                if(err) {
                    callback(err);
                    return;
                }
                if(stat.isDirectory()) {
                    callback(null);
                    return;
                }
                var lastModified = stat.mtime;
                log.set('date', lastModified);
                fs.readFile(filepath, {encoding: "utf8"}, function(err, data) {
                    if(err) {
                        callback(err);
                        return;
                    }
                    activity.import(data, function(err) {
                        if(err) {
                            callback(err);
                            return;
                        }
                        log.save(callback);
                    }, cd);
                });
            });
        }
    });
});

var activity = mongoose.model('activity', activitySchema);
var activityImportLog = mongoose.model('activityImportLog', activityImportLogSchema);

var r_main = express.Router();
var r_www = express.Router();

function getQueries(skip, limit, count, timesign) {
    var queryNext = {};
    if (count == limit) {
        queryNext.skip = skip + count;
        queryNext.limit = limit;
        queryNext.timesign = timesign;
    } else {
        queryNext = null;
    }
    var queryPrev = {};
    if (skip > 0) {
        var nskip = Math.max(skip - limit, 0);
        if (nskip > 0)
            queryPrev.skip = nskip;
        queryPrev.limit = limit;
        queryPrev.timesign = timesign;
    } else {
        queryPrev = null;
    }
    var ret = {};
    if (queryNext) {
        ret.next = '?' + querystring.stringify(queryNext);
    }
    if (queryPrev) {
        ret.prev = '?' + querystring.stringify(queryPrev);
    }
    return ret;
}
var t32 = Math.pow(2, 32);
function baseurl(buf) {
    return buf.toString('base64').replace(/\//g, '_').replace(/\+/g, ' ').replace(/=/g, '');
}
function debaseurl(b) {
    return new Buffer(b.replace(/ /g, '+').replace(/_/g, '/'), 'base64');
}
function timesign_stringify(time) {
    var stamp = Math.floor(time.getTime() / 1000);
    var buf;
    if (stamp > t32 - 1) {
        buf = new Buffer(64 / 8);
        var ln = Math.floor(stamp / t32);
        var rn = stamp % t32;
        buf.writeUInt32BE(ln, 0);
        buf.writeUInt32BE(rn, 32 / 8);
        return baseurl(buf);
    } else {
        buf = new Buffer(32 / 8);
        buf.writeUInt32BE(stamp);
        return baseurl(buf);
    }
}
function timesign_parse(s) {
    var buf = debaseurl(s);
    var ln = buf.readUInt32BE(0);
    var rn;
    if (buf.length > 32 / 8) {
        rn = buf.readUInt32BE(32 / 8);
        return new Date((ln * t32 + rn) * 1000);
    }
    return new Date(ln * 1000);
}
function sendIndex(req, res, find, cord, format) {
    format = format || "page"
    var skip = parseInt(req.query.skip || 0);
    var limit = parseInt(req.query.limit);
    if (!(skip >= 0)) {
        res.error(403, new Error('Invaild skip.'));
        return;
    }
    if (!(limit >= 0))
        limit = 15;
    if(limit > 30)
        limit = 30;
    var timesign = req.query.timesign;
    var ts = null;
    if (typeof timesign == 'string') {
        try {
            ts = timesign_parse(timesign);
        } catch (e) {
            res.error(403, "timesign invaild.");
            return;
        }
    }
    if (ts === null) {
        ts = new Date(Math.floor(Date.now()));
        timesign = timesign_stringify(ts);
    }
    var query = Object.create(find);
    query.date = { $lt: ts };
    if (typeof req.query.format == "string") {
        format = req.query.format;
    }
    activity.find(query).select({blogContent: 0}).sort({date: -1}).skip(skip).limit(limit).exec(function (err, actis) {
        if (err) {
            res.error(err);
            return;
        }
        var queri;
        switch (format) {
            case 'html':
                res.send(pages.activ_list({activs: actis}));
                break;
            case 'json':
                res.send(actis);
                break;
            case 'page':
                queri = getQueries(skip, limit, actis.length, timesign);
                res.send(pages.index({activs: actis, nexturl: queri.next, prevurl: queri.prev, cord: cord, ts: ts}));
                break;
            default:
                res.error(501, new Error("Format not supported"));
        }
    });
}
r_www.get('/', function(req, res) {
    res.redirect(302, 'https://maowtm.org');
});
r_main.get('/', function(req, res) {
    sendIndex(req, res, {}, null);
});
r_main.get('/auth', function(req, res) {
    res.send(pages.auth());
});
r_main.get(/^\/auth\/gpg\/((\w+)\/)?$/, function(req, res, next) {
    var keyhash = req.params[1];
    if(!keyhash) {
        res.send(pages.gpg());
    } else {
        try {
            res.send(pages.gpg({key: gpgKeyInfo(keyhash)}));
        } catch (e) {
            if(e instanceof gpgKeyInfo.notFindError)
                next();
            else
                throw e;
        }
    }
});
var countdownEvents = {
    'spring-holiday': {
        'start': new Date(Date.UTC(2016, 1 - 1, 29, 16, 0, 0)),
        'end': new Date(Date.UTC(2016, 2 - 1, 18, 16, 0, 0)),
        redirects: {}
    },
    'ssl-certification-of-maowtm.org': {
        'expire': new Date('Sat Apr 16 2016 16:30:00 GMT+0800'),
        'issue': new Date('Sun Jan 17 2016 16:30:00 GMT+0800'),
        redirects: {
            'start': 'issue',
            'end': 'expire'
        }
    },
    'domain-maowtm.org': {
        'expire': new Date('Mon Oct 31 2016 20:36:04 GMT+0800'),
        'creation': new Date('Sat Oct 31 2015 20:36:04 GMT+0800'),
        redirects: {
            'start': 'creation',
            'end': 'expire'
        }
    }
};
r_main.get('/countdown/:event', function (req, res, next) {
    var event = countdownEvents[req.params.event];
    if (!event) {
        next();
        return;
    }
    var now = Date.now();
    if(event.redirects.start?now > event[event.redirects.start]:now > event.start)
        res.redirect(302, req.path + 'end');
    else
        res.redirect(302, req.path + 'start');
});
r_main.get('/countdown/:event/:subevent', function (req, res, next) {
    var event = countdownEvents[req.params.event];
    if (!event) {
        next();
        return;
    }
    if (event.redirects[req.params.subevent]) {
        res.redirect(302, '../' + event.redirects[req.params.subevent]);
        return;
    }
    var subevent = event[req.params.subevent];
    if (!subevent || typeof req.params.subevent == 'redirects') {
        next();
        return;
    }
    res.send(pages.countdown({time: subevent, subevent: req.params.subevent, event: req.params.event}));
});
r_main.get('/html-stuff/chunk-chunk/', function(req, res, next) {
    res.send(pages.htmlstuff({title: 'Chunk-chunk', src: 'https://micromaomao.github.io/Chunk-chunk/'}));
});
r_main.get('/articles/:id', function(req, res, next) {
    var id = req.params.id;
    if (typeof id != "string") {
        next();
        return;
    }
    activity.findById(id, function (err, act) {
        if (err) {
            res.error(err);
            return;
        }
        if (!act || !act.blogContent) {
            next();
            return;
        }
        res.send(pages.article({ct: act, activs: [act]}));
    });
});
r_main.get('/tag/:tagname', function (req, res, next) {
    var tagname = req.params.tagname;
    if(typeof tagname != 'string') {
        next();
        return;
    }
    sendIndex(req, res, {tags: tagname}, "Include tag: " + tagname);
});
r_main.get('/id/:id', function (req, res, next) {
    var id = req.params.id;
    activity.findById(id).select({blogContent: 0}).exec(function (err, act) {
        if(err) {
            res.error(err);
            return;
        }
        if (!act) {
            next();
            return;
        }
        res.send(pages.index({activs: [act], cord: 'id = ' + id}));
    });
});
r_main.get('/about/', function (req, res) {
    res.send(pages.about());
});

module.exports = function(req, res, next) {
    if(req.hostname == 'www.maowtm.org') {
        r_www(req, res, next);
    } else if (req.hostname == 'maowtm.org') {
        r_main(req, res, next);
    } else {
        next();
    }
};
