const express = require('express');
const pages = require('../pages');
const lwip = require('lwip');
const qs = require('querystring');

module.exports = function (db, lock) {
    var mongoose = db;
    mongoose.Schema = require('mongoose').Schema;
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

    // These stuff "cache" images ( and their different sizes, when needed ) to database.

    /**
     * Read a image from `filePath`, and add it to the database with name `imgName`.
     * imgName is unique.
     * @param imgName string an unique name of the image.
     * @param filePath string where to find that image, absolute path needed for simplification.
     * @param callback function(err)
     */
    imageSchema.static('addImageIfNotExist', function (imgName, filePath, callback) {
        if (callback && typeof callback != "function") {
            throw new Error("Illegal callback.");
        }
        if (!callback) {
            callback = function (err) {
                if (err)
                    console.error(err);
            };
        }
        if (typeof imgName != "string" || imgName.length <= 0
           || typeof filePath != "string" || filePath.length <= 0) {
            return callback(new Error("Illegal argument."));
        }
        // Find if already exists, Ignore if so.
        image.findOne({ name: imgName }, function (err, imgFound) {
            if(err)
                callback(err);
            else if (imgFound)
                callback(null);
            else {
                lwip.open(filePath, function (err, lwipImg) {
                    if(err)
                        callback(err);
                    else {
                        var imgDoc = new image({
                            name: imgName,
                            width: lwipImg.width()
                        });
                        lwipImg.toBuffer('png', function (err, buff) {
                            if(err) {
                                callback(err);
                            } else {
                                imgDoc.set('src', buff);
                                imgDoc.save(callback);
                            }
                        });
                    }
                });
            }
        });
    });

    /**
     * Read a image from database. The nearest 50px scale will be returned. If there isn't already
     * a cached scaled image for the caller to use, one will be created.
     * @param scale integer in px.
     * @param allowEnlarge integer should I return an enlarged image if required scale is bigger
     *  than the image?
     * @param callback function(err, buffer) the function to give data to.
     */
    imageSchema.method('queryScale', function (scale, allowEnlarge, callback) {
        if (callback && typeof callback != "function") {
            throw new Error("Illegal callback.");
        }
        if (!callback) {
            callback = function (err) {
                if (err)
                    console.error(err);
            };
        }
        if (!Number.isInteger(scale) || scale <= 0)
            return callback(new Error("Illegal argument."));
        if (!allowEnlarge)
            allowEnlarge = false;
        scale = Math.ceil(scale / 50) * 50;
        if ((scale > this.width && !allowEnlarge) || scale == this.width) {
            callback(null, this.src);
            return;
        }
        var th = this;
        // Lock the image to prevent double-caching.
        lock('imageCaching\t' + th._id.toString(), function(done) {
            cachedScale.findOne({ imgId: th._id, scale: scale }, function (err, cachedDoc) {
                if(err) {
                    callback(err, null);
                    done();
                } else {
                    if(cachedDoc) {
                        callback(null, cachedDoc.data);
                        done();
                    } else {
                        createImageScale();
                    }
                }
            });
            function createImageScale() {
                cachedDoc = new cachedScale({
                    imgId: th._id,
                    scale: scale
                });
                lwip.open(th.src, 'png', function (err, img) {
                    if(err) {
                        callback(err, null);
                        done();
                    } else {
                        var scalefactor = scale / th.width;
                        img.scale(scalefactor, function (err, newImage) {
                            if(err) {
                                callback(err, null);
                                done();
                            } else {
                                newImage.toBuffer('png', function (err, buff) {
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
            scale = Infinity; // It will be set to the size of that image later.
        }
        image.findOne({ name: req.params.imgname }, function (err, img) {
            if(err)
                res.error(err);
            else if (!img) {
                next();
            } else {
                if (scale > img.width) {
                    delete req.query.width;
                    var qr = qs.stringify(req.query);
                    if(qr.length > 0) {
                        qr = "?" + qr;
                    }
                    res.redirect(302, req.path + qr);
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
    return function(req, res, next) {
        if (req.hostname == 'static.maowtm.org') {
            r_static(req, res, next);
        } else if (req.hostname == 'img.maowtm.org') {
            r_img(req, res, next);
        } else {
            next();
        }
    };
};
