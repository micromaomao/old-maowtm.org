// Mocha test file.

const maowtm = require('..');
const should = require('should');
const request = require('supertest');

const DB = "127.6.0.233", REDIS = "127.6.0.233";

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

    it('should send http protection headers', function(done) {
        var destory, testHttpHeaders;
        new maowtm({
            db: DB,
            redis: REDIS,
            callback: function (err, app, finalize) {
                destory = finalize;
                if (err) {
                    done(err);
                    return;
                }
                testHttpHeaders(app);
            },
            mockSecure: true
        });
        after(function () {
            destory.should.be.a.Function();
            destory();
        });

        testHttpHeaders = function(app) {
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
        }
    });

    it('should redirect to directory', function (done) {
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
            },
            mockSecure: true
        });
        after(function () {
            destory.should.be.a.Function();
            destory();
        });

        test = function (app) {
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

        test = function(app) {
            request(app)
                .get('/somefilename')
                .expect(302)
                .expect('Location', /^https:\/\//)
                .end(done);
        };
    });
});
