const express = require('express');
const pages = require('../pages');
const gpgKeyInfo = require('./gpgKeyInfo');
const mongoose = require('mongoose');
const fs = require('fs');
const marked = require('marked');

var activitySchema = new mongoose.Schema({
    _id: String,
    desc: String, // markdown
    date: Date,
    tags: [String],
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
                        deleted: activ.deleted || false}, {new: true, upsert: true}, callback);
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
            debugger;
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

r_www.get('/', function(req, res) {
    res.redirect(302, 'https://maowtm.org');
});
r_main.get('/', function(req, res) {
    activity.find().sort({date: -1}).limit(10).exec(function(err, actis) {
        if(err) {
            res.error(err);
            return;
        }
        res.send(pages.index({activs: actis}));
    });
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
        'end': new Date(Date.UTC(2016, 2 - 1, 18, 16, 0, 0))
    }
};
r_main.get('/countdown/:event', function (req, res, next) {
    var event = countdownEvents[req.params.event];
    if (!event) {
        next();
        return;
    }
    var now = Date.now();
    if(now > event.start)
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
    var subevent = event[req.params.subevent];
    if (!subevent) {
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
    activity.find({tags: tagname}).sort({date: -1}).limit(15).exec(function(err, actis) {
        if(err) {
            res.error(err);
            return;
        }
        res.send(pages.index({activs: actis, cord: "include tag: " + tagname}));
    });
});
r_main.get('/as/:format', function (req, res, next) {
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
    var find;
    try {
        find = JSON.parse(req.query.find);
        if (typeof find != 'object') {
            throw new Error('Query must be an object.');
        }
    } catch (e) {
        res.error(403, e);
        return;
    }
    activity.find(find).skip(skip).limit(limit).exec(function (err, r) {
        var format = req.params.format;
        if (err) {
            res.error(err);
            return;
        }
        switch (format) {
            case 'html':
                res.send(pages.activ_list({activs: r}));
                break;
            case 'json':
                res.send(r);
                break;
            case 'page':
                res.send(pages.index({activs: r, cord: "match " + JSON.stringify(find)}));
                break;
            default:
                res.error(501, new Error("Format not supported"));
        }
    });
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
