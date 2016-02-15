$(function () {
    var fixed = $('.fixed'), data = $('.data'), placeholder = $('.placeholder');
    var wscroll = $('<div style="position: absolute;"></div>');
    wscroll.css("top", "0");
    function wsstep (t) {
        window.scrollTo(0, t);
    }
    wsstep(0);
    var totallen = 30000; // Time unit used in the below code for jumpable is "px".
    require(["jumpable", "jmpcontrol", "jquery"], function (jumpable, jmpcontrol, $) {
        data.css({display: "none"});
        placeholder.css({height: totallen + "px"});
        $(window).on('mousewheel', function (evt) {
            evt.preventDefault();
            var offy = evt.originalEvent.deltaY * 5;
            wscroll.stop(true, false)
                .animate({top: Math.min(Math.max(window.scrollY + offy, 0),
                                        totallen - $(window).height()) + "px"}, {
                duration: 200,
                step: wsstep
            });
        });
        var largebody = true;
        var tr = [null, null];
        function calcSize() {
            var wid = $(window).width();
            if (wid < 800)
                largebody = false;
            else
                largebody = true;
            if (largebody)
                tr = [25, 60];
            else
                tr = [10, 20];
        }
        $(window).on('resize', calcSize);
        calcSize();
        var jmp = new jumpable.Jumpable();
        var ctrl = new jmpcontrol.Control(jmp, totallen);
        ctrl.jumpTo(0);
        function getJumpTime () {
            return (window.scrollY / (totallen - $(window).height())) * totallen;
        }
        function getWindowScroll (jumpTime) {
            // wolfram: (y / (l - h)) * l = j solve for y
            //  -> y = j-(h j)/l and l!=0 and h!=l
            return jumpTime - ( $(window).height() * jumpTime ) / totallen;
        }
        $(window).on('scroll resize', function () {
            ctrl.jumpTo(getJumpTime());
            if (wscroll.queue().length > 0)
                return;
            wscroll.css({top: window.scrollY + "px"});
        });
        var lastlarge = largebody;
        $(window).on('resize', function () {
            requestAnimationFrame(function () {
                if (lastlarge != largebody) {
                    lastlarge = largebody;
                    ctrl.jumpTo(0);
                    ctrl.jumpTo(getJumpTime());
                }
            });
        });

        function hashChange() {
            var nv = parseInt(window.location.hash.substr(1));
            var ts = getWindowScroll(nv);
            window.scrollTo(0, ts);
        }
        hashChange();
        $(window).on('hashchange', hashChange);
        jmp.addTimeline((function () {
            var tl = new jumpable.TimeLine();
            var jt = 0;
            tl.addKeyFrame(0, function (t) {
                jt = t;
            });
            var lastjt = jt;
            setInterval(function () {
                if (lastjt == jt) {
                    return;
                } else {
                    lastjt = jt;
                }
                window.location.replace('#' + Math.round(jt));
            }, 600);
            return tl;
        })());

        var backgroundColor_tl = new jumpable.TimeLine();
        backgroundColor_tl.addKeyFrame(0, function (t) {
            if (t === 0)
                fixed.css({'background-color': '#000000'});
        });
        jmp.addTimeline(backgroundColor_tl);
        // a0
        jmp.addTimeline((function () {
            var tl = new jumpable.TimeLine();
            var a0 = data.find('.a0');
            a0.remove();
            fixed.append(a0);
            tl.addKeyFrame(0, function (t) {
                a0.css({opacity: 1 - (t / 1500), top: (60 - (t / 1500) * 20) + '%'});
                if (t == 1500) {
                    a0.css({display: 'none'});
                } else {
                    a0.css({display: 'block'});
                }
            });
            tl.addKeyFrame(1500, function (t) {});
            return tl;
        })());
        // a1, a2
        jmp.addTimeline((function () {
            var tl = new jumpable.TimeLine();
            var a1 = data.find('.a1');
            var a2 = data.find('.a2');
            a1.remove();
            a2.remove();
            fixed.append(a1);
            fixed.append(a2);
            var a1line = $('<div class="line"></div>');
            a1.append(a1line);
            tl.addKeyFrame(0, function (t) {
                a1.css({display: 'block', position: 'absolute', left: tr[0] + 'px',
                       top: ((tr[1] + 100) - (t / 300) * 100) + 'px', opacity: t / 300});
                a1line.css({width: "0px"});
                a2.css({display: 'none'});
            });
            tl.addKeyFrame(300, function (t) {});
            tl.addKeyFrame(400, function (t) {
                a1line.css({width: ((t / 600) * 85) + "%"});
            });
            tl.addKeyFrame(1000, function (t) {});
            tl.addKeyFrame(1300, function (t) {
                a2.css({display: (t===0?'none':'block'), position: 'absolute', left: (tr[0] + 150) + 'px',
                    top: (tr[1] + (largebody?110:100)), opacity: t / 300});
            });
            tl.addKeyFrame(1600, function (t) {});
            tl.addKeyFrame(3300, function (t) {
                a2.css({opacity: 1 - (t / 500)});
                if (t == 500) {
                    a2.css({display: 'none'});
                } else {
                    a2.css({display: 'block'});
                }
            });
            tl.addKeyFrame(3800, function (t) {});
            return tl;
        })());
        // cx
        jmp.addTimeline((function () {
            var tl = new jumpable.TimeLine();
            var c1 = data.find('.c1');
            c1.remove();
            fixed.append(c1);
            var base = 1800;
            tl.addKeyFrame(0, function (t) {
                c1.css({display: 'none'});
                c1.find('.it').css({opacity: 0, position: 'relative', top: '50px'});
            });
            tl.addKeyFrame(base, function (t) {
                if (t === 0) {
                    c1.css({display: 'none'});
                } else {
                    c1.css({display: 'block'});
                }
            });
            backgroundColor_tl.addKeyFrame(base, function (t) {
                var tp = t / 500;
                fixed.css({'background-color': 'rgb('+ parseInt(233 * tp) +', ' +
                          parseInt(30 * tp) + ', ' + parseInt(99 * tp) + ')'});
            });
            backgroundColor_tl.addKeyFrame(base + 500, function (t) {});
            tl.addKeyFrame(base + 500, function (t) {});
            var its = c1.find('.it');
            its.each(function (n, e) {
                var e = $(e);
                var base_it = base + 500 + n * 1100;
                tl.addKeyFrame(base_it, function (t) {
                    e.css({top: (70 - (t / 500) * 50) + 'px', opacity: t / 500});
                });
                tl.addKeyFrame(base_it + 500, function (t) {
                    e.css({top: (20 - (t / 500) * 20) + 'px'});
                });
                tl.addKeyFrame(base_it + 1000, function (t) {});
            });
            var bnt = base + 5000;
            var lbnt = bnt - (its.length - 1) * 200;
            var mbntn = bnt + 500;
            tl.addKeyFrame(lbnt, function (t) {
                t = lbnt + t;
                its.each(function (n, e) {
                    var start = bnt - n * 200;
                    var end = start + 500;
                    var e = $(e);
                    var at;
                    if (t <= start) {
                        at = 0;
                    } else if (t >= end) {
                        at = 500;
                    } else {
                        at = t - start;
                    }
                    e.css({top: ((at / 500) * (50 + n * 50)) + 'px', opacity: 1 - (at / 500)});
                });
            });
            tl.addKeyFrame(mbntn, function (t) {});
            tl.addKeyFrame(base + 6000, function (t) {
                if (t === 0)
                    c1.css({display: 'block'});
                else
                    c1.css({display: 'none'});
            });
            return tl;
        })());
        // bx
        jmp.addTimeline((function () {
            var tl = new jumpable.TimeLine();
            var b1 = data.find('.b1');
            var b2 = data.find('.b2');
            b1.remove();
            b2.remove();
            fixed.append(b1);
            fixed.append(b2);
            var base = 7800;
            tl.addKeyFrame(0, function (t) {
                b1.css({display: 'none'});
                b2.css({display: 'none'});
            });
            tl.addKeyFrame(base, function (t) {
                b1.css({display: (t===0?'none':'block'), position: 'absolute',
                       top: (tr[1] + 300 - (t / 500) * 100) + 'px', left: '0', right: '0', opacity: t / 500});
            });
            tl.addKeyFrame(base + 500, function (t) {
                b2.css({display: 'none'});
                b1.css({top: (tr[1] + 200 - (t / 1000) * 100) + 'px'});
            });
            tl.addKeyFrame(base + 1500, function (t) {
                b1.css({opacity: 1 - (t / 500), top: (tr[1] + 100 - (t / 500) * 100) + 'px'});
                if (t == 500) {
                    b1.css({display: 'none'});
                } else {
                    b1.css({display: 'block'});
                }
                b2.css({display: (t===0?'none':'block'), position: 'absolute',
                       top: (tr[1] + 300 - (t / 500) * 100) + 'px', left: '0',
                       right: '0', opacity: t / 500});
            });
            tl.addKeyFrame(base + 2000, function (t) {
                b2.css({top: (tr[1] + 200 - (t / 1000) * 100) + 'px'});
            });
            tl.addKeyFrame(base + 3000, function (t) {
                b2.css({opacity: 1 - (t / 500), top: (tr[1] + 100 - (t / 500) * 100) + 'px'});
                if (t == 500) {
                    b2.css({display: 'none'});
                } else {
                    b2.css({display: 'block'});
                }
            });
            tl.addKeyFrame(base + 3500, function (t) {});
            return tl;
        })());
        // dx
        jmp.addTimeline((function () {
            var tl = new jumpable.TimeLine();
            var d1 = data.find('.d1');
            d1.remove();
            fixed.append(d1);
            var its = d1.find('.it');
            var base = 10800;
            tl.addKeyFrame(0, function (t) {
                d1.css({display: 'none'});
                its.css({display: 'none'});
                its.eq(0).css({display: 'block'});
            });
            backgroundColor_tl.addKeyFrame(base, function (t) {
                var tp = t / 500;
                // 76, 175, 80
                fixed.css({'background-color': 'rgb('+ parseInt(233 - 157 * tp) +', ' +
                          parseInt(30 + 145 * tp) + ', ' + parseInt(99 - 19 * tp) + ')'});
            });
            backgroundColor_tl.addKeyFrame(base + 500, function (t) {});
            tl.addKeyFrame(base + 500, function (t) {
                d1.css({left: (50 - (t / 500) * 35) + '%', opacity: t / 500,
                       display: (t===0?'none':'block')});
            });
            tl.addKeyFrame(base + 1000, function (t) {});
            its.each(function (n, e) {
                var base_it = base + 1100 + n * 2600;
                var e = $(e);
                if (n >= 1) {
                    tl.addKeyFrame(base_it, function (t) {
                        e.css({display: (t===0?'none':'block'), top: ((1 - t / 500) * 30) + 'px',
                            opacity: t/500});
                    });
                }
                tl.addKeyFrame(base_it + 500, function (t) {
                    e.css({top: (-40 * (t / 1500)) + 'px'});
                });
                tl.addKeyFrame(base_it + 2000, function (t) {
                    e.css({display: (t===500?'none':'block'), top: (-40 - (t / 500) * 30) + 'px',
                        opacity: 1 - (t / 500)});
                });
                tl.addKeyFrame(base_it + 2500, function (t) {});
            });
            tl.addKeyFrame(base + 22200 - 10800, function (t) {
                d1.css({display: (t===0?'block':'none')});
            });
            return tl;
        })());
        // ex
        jmp.addTimeline((function () {
            var tl = new jumpable.TimeLine();
            var e1 = data.find('.e1');
            e1.remove();
            fixed.append(e1);
            var base = 22170;
            backgroundColor_tl.addKeyFrame(base, function (t) {
                // 0, 150, 136
                fixed.css({'background-color': 'rgb(' + parseInt(76 * (1 - t / 500)) + ', ' +
                          parseInt(175 - 25 * t / 500) + ', ' + parseInt(80 + 56 * t / 500) +')'});
            });
            backgroundColor_tl.addKeyFrame(base + 500, function (t) {
            });
            tl.addKeyFrame(0, function (t) {
                e1.css({display: 'none'});
            });
            var svg = e1.find('svg');
            var h1 = e1.find('h1');
            var rect = svg.find('rect');
            function relayout_svg () {
                var width = h1.width() + 50;
                var wwid = e1.width();
                var height = 80;
                svg.css({left: ( wwid / 2 - (width / 2)) + 'px', top: 0, width: width + 'px',
                    height: height + 'px'});
                var rct = svg.find('rect');
                rct.attr({
                    x: 0,
                    y: 0,
                    width: width + 'px',
                    height: height + 'px'
                });
            }
            $(window).on('resize', relayout_svg);
            tl.addKeyFrame(base, function (t) {
                e1.css({display: t===0?'none':'block'});
                if (t !== 0) {
                    relayout_svg();
                    var totLen = parseInt(rect.attr('width')) * 2 + parseInt(rect.attr('height')) * 2;
                    rect.attr({
                        'stroke-dasharray': totLen + 'px ' + totLen + 'px',
                        'stroke-dashoffset': ((1 - Math.min(t / 1500, 1)) * totLen) + 'px'
                    });
                }
                var op = Math.min(Math.max((t - 1000) / 500, 0), 1);
                h1.css({opacity: op});
            });
            tl.addKeyFrame(base + 1500, function (t) {});
            var last2kt = 500;
            function layout_2kt(t) {
                var oritop = largebody?200:170;
                if (typeof t != 'number') {
                    t = last2kt;
                }
                e1.css({top: (oritop - (t / 500) * ($(window).width()<1200?15:100)) + 'px'});
                last2kt = t;
            }
            $(window).on('resize', layout_2kt);
            tl.addKeyFrame(base + 2000, layout_2kt);
            tl.addKeyFrame(base + 2500, function (t) {});
            return tl;
        })());
    });
});
