// Mocha test file.

const maowtm = require('..');
const should = require('should');
const request = require('supertest');
const lwip = require('lwip');

const DB = process.env.MONGODB, REDIS = process.env.REDIS;

try {
    DB.should.be.a.String().and.should.not.be.empty();
    REDIS.should.be.a.String().and.should.not.be.empty();
} catch (e) {
    console.log("You need to provide env MONGODB and REDIS. E.g. MONGODB=127.0.0.1 REDIS=127.0.0.1");
    process.exit(1);
}

describe('new maowtm(...)', function() {
    it('should initialize', function(done) {
        var destory;
        new maowtm({
            db: DB,
            redis: REDIS,
            callback: function (err, app, finalize) {
                destory = finalize;
                if (err) {
                    done(err);
                    return;
                }
                done();
            }
        });
        after(function () {
            destory.should.be.a.Function();
            destory();
        });
    });

    function makeErrorCallback(done, match) {
        return function (err, app, destory) {
            if (!err) {
                done(destory, new Error("No error was thrown"));
            } else {
                if (app)
                    done(destory, new Error("Error was thrown, but app is not null."));
                else {
                    err.should.be.an.Object();
                    err.message.should.match(match);
                    done(destory);
                }
            }
        };
    }

    it('should throw error when db is not open', function(done) {
        var destory;
        new maowtm({
            db: "127.255.255.255",
            redis: REDIS,
            callback: makeErrorCallback(function (d, err) {
                destory = d;
                done(err);
            }, /connect/)
        });
        after(function () {
            destory.should.be.a.Function();
            destory();
        });
    });
    it('should throw error when no SSL certificate was given', function(done) {
        var destory;
        new maowtm({
            db: DB,
            redis: REDIS,
            listen: "127.6.0.233",
            callback: makeErrorCallback(function (d, err) {
                destory = d;
                done(err);
            }, /SSL/)
        });
        after(function () {
            destory.should.be.a.Function();
            destory();
        });
    });

    it('should answer acme-challenge', function(done) {
        var testACME, destory;
        var acmeString = "stubstubstub";
        new maowtm({
            db: DB,
            redis: REDIS,
            callback: function (err, app, finalize) {
                destory = finalize;
                if (err) {
                    done(err);
                    return;
                }
                testACME(app);
            },
            acme: acmeString
        });
        after(function () {
            destory.should.be.a.Function();
            destory();
        });

        testACME = function(app) {
            request(app)
                .get('/.well-known/acme-challenge/acmehhh')
                .expect(200)
                .expect(acmeString)
                .end(done);
        };
    });
    it('should redirect http to https', function(done) {
        var destory, test;
        new maowtm({
            db: DB,
            redis: REDIS,
            callback: function (err, app, finalize) {
                destory = finalize;
                if (err) {
                    done(err);
                    return;
                }
                test(app);
            }
        });
        after(function () {
            destory.should.be.a.Function();
            destory();
        });
        var test = function(app) {
            request(app)
                .get('/somefilename')
                .expect(302)
                .expect('Location', /^https:\/\//)
                .end(done);
        }
    });
});

(function() {
    var destory, appTest;
    new maowtm({
        db: DB,
        redis: REDIS,
        callback: function (err, app, finalize) {
            destory = finalize;
            if (err) {
                throw err;
            }
            appTest(app);
        },
        mockSecure: true
    });

    function appTest(app) {
        describe('Application', function() {
            after(function() {
                destory();
            });

            debugger;
            it('should send http protection headers', function(done) {
                function setExpects(agent, next) {
                    agent.expect("Strict-Transport-Security", /max-age=\d+/);
                    agent.expect("Strict-Transport-Security", /includeSubdomains/);
                    agent.expect("Strict-Transport-Security", /preload/);
                    agent.expect("X-XSS-Protection", /1/);
                    agent.expect("X-Frame-Options", /sameorigin/);
                    agent.expect("X-Content-Type-Options", /nosniff/);
                    agent.end(function (err) {
                        switch (true) {
                            case err:
                                done(err);
                                break;
                            case next:
                                next();
                                break;
                            default:
                                done();
                                break;
                        }
                    });
                    return agent;
                }
                var req = request(app);
                var tests = {
                    root: function() {
                        setExpects(req.get('/'), tests.notfind);
                    },
                    notfind: function() {
                        setExpects(req.get('/404'));
                    }
                };
                tests.root();
            });

            it('should redirect to directory', function (done) {
                request(app)
                    .get('/404')
                    .expect(302)
                    .expect('Location', '/404/')
                    .end(function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        request(app)
                            .get('/404/')
                            .expect(404)
                            .end(done);
                    });
            });

            function notRedirected(res) {
                if (res.header.location)
                    throw new Error("Location header should not exist");
                res.status.should.not.be.exactly(302);
            }
            it('should not redirect to directory (img.maowtm.org)', function (done) {
                request(app)
                    .get('/404')
                    .set('Host', 'img.maowtm.org')
                    .expect(notRedirected)
                    .expect(404)
                    .end(function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        request(app)
                            .get('/404/')
                            .set('Host', 'img.maowtm.org')
                            .expect(notRedirected)
                            .end(done);
                    });
            });
            it('should not redirect to directory (static.maowtm.org)', function (done) {
                request(app)
                    .get('/404')
                    .set('Host', 'static.maowtm.org')
                    .expect(notRedirected)
                    .end(function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        request(app)
                            .get('/404/')
                            .set('Host', 'static.maowtm.org')
                            .expect(notRedirected)
                            .end(done);
                    });
            });
        });
    }
})();

(function() {
    var destory;
    new maowtm({
        db: DB,
        redis: REDIS,
        callback: function (err, app, finalize) {
            destory = finalize;
            if (err) {
                throw err;
            }
            imageTest(app);
        },
        mockSecure: true
    });
    after(function() {
        destory();
    });

    function imageTest(app) {
        const imageTypeMatch = /^image\/[a-z]+$/;
        function assertWidthAtLeast(res, done, widthTest, withIn) {
            try {
                res.type.should.match(imageTypeMatch);
                var ext = res.type.split('/')[1];
                ext.should.be.a.String().and.should.not.be.empty();
                lwip.open(res.body, ext, function(err, lwipImg) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var width = lwipImg.width();
                    if (width >= widthTest && width - widthTest <= withIn) {
                        done();
                    } else {
                        done(new Error("expected width to be " + widthTest + "(+" + withIn + "), but " + width + " get."));
                    }
                });
            } catch (e) {
                done(e);
            }
        }
        describe('static::image fetching', function() {
            it('should contains avatar.png', function(done) {
                request(app)
                    .get('/avatar.png')
                    .set('Host', 'img.maowtm.org')
                    .expect(200)
                    .expect("Content-Type", imageTypeMatch)
                    .end(done);
            });
            it('should return image with the width specified', function(done) {
                request(app)
                    .get('/avatar.png')
                    .set('Host', 'img.maowtm.org')
                    .query({width: 100})
                    .expect(200)
                    .expect("Content-Type", imageTypeMatch)
                    .end(function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        assertWidthAtLeast(res, done, 100, 50);
                    });
            });
            it('should redirect for width bigger than the image itself', function(done) {
                request(app)
                    .get('/avatar.png')
                    .set('Host', 'img.maowtm.org')
                    .query({width: 10000})
                    .expect(302)
                    .expect("Location", "/avatar.png")
                    .end(done);
            });
            it('should redirect for illegal width (0)', function(done) {
                request(app)
                    .get('/avatar.png')
                    .set('Host', 'img.maowtm.org')
                    .query({width: 0})
                    .expect(302)
                    .expect("Location", "/avatar.png")
                    .end(done);
            });
            it('should redirect for illegal width (negative)', function(done) {
                request(app)
                    .get('/avatar.png')
                    .set('Host', 'img.maowtm.org')
                    .query({width: -10000})
                    .expect(302)
                    .expect("Location", "/avatar.png")
                    .end(done);
            });
            it('should redirect for illegal width (not number)', function(done) {
                request(app)
                    .get('/avatar.png')
                    .set('Host', 'img.maowtm.org')
                    .query({width: "null"})
                    .expect(302)
                    .expect("Location", "/avatar.png")
                    .end(done);
            });
            it('should redirect for not integer width', function(done) {
                request(app)
                    .get('/avatar.png')
                    .set('Host', 'img.maowtm.org')
                    .query({width: 100.25})
                    .expect(302)
                    .expect("Location", "/avatar.png?width=100")
                    .end(done);
            });
            it('should redirect for illegal width (not number, preserve other arguments)', function(done) {
                request(app)
                    .get('/avatar.png')
                    .set('host', 'img.maowtm.org')
                    .query({width: "null", other: "yes"})
                    .expect(302)
                    .expect("location", "/avatar.png?other=yes")
                    .end(done);
            });
            it('should redirect for not integer width (preserve other arguments)', function(done) {
                request(app)
                    .get('/avatar.png')
                    .query({width: 100.25, other: "yes"})
                    .set('Host', 'img.maowtm.org')
                    .expect(302)
                    .expect("Location", /^\/avatar.png\?(width|other)=/)
                    .expect("Location", /width=100/)
                    .expect("Location", /other=yes/)
                    .expect("Location", /(100|yes)$/)
                    .end(done);
            });
            it('should give 404 for no existing image', function(done) {
                request(app)
                    .get('/404')
                    .set('Host', 'img.maowtm.org')
                    .expect(404)
                    .end(done);
            });
            it('should give 404 for no existing image (with width given)', function(done) {
                request(app)
                    .get('/404')
                    .query({width: 100})
                    .set('Host', 'img.maowtm.org')
                    .expect(404)
                    .end(done);
            });
        });
    }
})();
