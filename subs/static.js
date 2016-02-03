const express = require('express');
const pages = require('../pages');
const mongoose = require('mongoose');
const lwip = require('lwip');
const qs = require('querystring');

var imageSchema = new mongoose.Schema({
    name: 'String',
    src: 'Buffer',
    width: 'Number'
});
var cachedScaleSchema = new mongoose.Schema({
    imgId: 'ObjectId',
    scale: 'Number',
    data: 'Buffer'
});
var lock;
imageSchema.static('addImageIfNotExist', function (imgname, filepath, callback) {
    image.findOne({ name: imgname }, function (err, igd) {
        if(err)
            callback(err, null);
        else if (igd)
            callback();
        else {
            lwip.open(filepath, function (err, img) {
                if(err)
                    callback(err, null);
                else {
                    var imgdoc = new image({
                        name: imgname,
                        width: img.width()
                    });
                    img.toBuffer('png', function (err, buff) {
                        if(err) {
                            callback(err, null);
                        } else {
                            imgdoc.set('src', buff);
                            imgdoc.save(callback);
                        }
                    });
                }
            });
        }
    });
});
imageSchema.method('queryScale', function (scale, allowEnlarge, callback) {
    scale = Math.ceil(scale / 50) * 50;
    if ((scale > this.width && !allowEnlarge) || scale == this.width) {
        callback(null, this.src);
        return;
    }
    var th = this;
    lock('imageCaching\t' + th._id.toString(), function(done) {
        cachedScale.findOne({ imgId: th._id, scale: scale }, function (err, doc) {
            if(err) {
                callback(err, null);
                done();
            } else {
                if(doc) {
                    callback(null, doc.data);
                    done();
                } else {
                    var doc = new cachedScale({
                        imgId: th._id,
                        scale: scale
                    });
                    lwip.open(th.src, 'png', function (err, img) {
                        if(err) {
                            callback(err, null);
                            done();
                        } else {
                            var sf = scale / th.width;
                            img.scale(sf, function (err, nimg) {
                                if(err) {
                                    callback(err, null);
                                    done();
                                } else {
                                    nimg.toBuffer('png', function (err, buff) {
                                        if(err) {
                                            callback(err, null);
                                            done();
                                        } else {
                                            doc.set('data', buff);
                                            doc.save(function(err) {
                                                callback(null, buff);
                                                done();
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }
        });
    });
});

var image = mongoose.model('image', imageSchema);
var cachedScale = mongoose.model('cachedScale', cachedScaleSchema);

var r_static = express.Router();
r_static.use(express.static('static'));
var r_img = express.Router({
    strict: true
});
r_img.get('/:imgname', function (req, res, next) {
    var scale = parseInt(req.query.width);
    if(req.query.width && (scale.toString() != req.query.width || scale <= 0)) {
        scale = Infinity;
    }
    image.findOne({ name: req.params.imgname }, function (err, img) {
        if(err)
            res.error(err);
        else if (!img) {
            next();
        } else {
            if (scale > img.width) {
                delete req.query.width;
                res.redirect(302, req.path + qs.stringify(req.query));
                return;
            }
            img.queryScale(scale || img.width, false, function (err, buff) {
                if(err)
                    res.error(err);
                else {
                    res.type('png');
                    res.send(buff);
                }
            });
        }
    });
});

module.exports =  function(req, res, next) {
    if (req.hostname == 'static.maowtm.org') {
        r_static(req, res, next);
    } else if (req.hostname == 'img.maowtm.org') {
        r_img(req, res, next);
    } else {
        next();
    }
};
module.exports.setLock = function (l) {
    lock = l;
    return module.exports;
};
