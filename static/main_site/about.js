$(function () {
    var fixed = $('.fixed'), data = $('.data'), placeholder = $('.placeholder');
    var wscroll = $('<div style="position: absolute;"></div>');
    wscroll.css("top", "0");
    function wsstep (t) {
        window.scrollTo(0, t);
    }
    wsstep(0);
    var totallen = 10000; // Time unit used in the below code for jumpable is "px".
    require(["jumpable", "jmpcontrol", "jquery"], function (jumpable, jmpcontrol, $) {
        data.css({display: "none"});
        placeholder.css({height: totallen + "px"});
        $(window).on('mousewheel', function (evt) {
            evt.preventDefault();
            var offy = evt.originalEvent.deltaY * 5;
            wscroll.stop(true, false)
                .animate({top: Math.min(Math.max(window.scrollY + offy, 0),
                                        totallen - window.innerHeight) + "px"}, {
                duration: 200,
                step: wsstep
            });
        });
        var largebody = true;
        var tr = [null, null];
        function calcSize() {
            var wid = window.innerWidth;
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
        function jumpctrl () {
            ctrl.jumpTo((window.scrollY / (totallen - window.innerHeight)) * totallen);
        }
        $(window).on('scroll resize', function () {
            jumpctrl();
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
                    jumpctrl();
                }
            });
        });

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
                a2.css({display: 'block', position: 'absolute', left: (tr[0] + 150) + 'px',
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
        jmp.addTimeline((function () {
            var tl = new jumpable.TimeLine();
            var b1 = data.find('.b1');
            var b2 = data.find('.b2');
            b1.remove();
            b2.remove();
            fixed.append(b1);
            fixed.append(b2);
            var base = 1800;
            tl.addKeyFrame(0, function (t) {
                b1.css({display: 'none'});
                b2.css({display: 'none'});
            });
            tl.addKeyFrame(base, function (t) {
                b1.css({display: 'block', position: 'absolute', top: (tr[1] + 300 - (t / 500) * 100)
                       + 'px', left: '0', right: '0', opacity: t / 500});
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
                b2.css({display: 'block', position: 'absolute', top: (tr[1] + 300 - (t / 500) * 100)
                       + 'px', left: '0', right: '0', opacity: t / 500});
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
    });
});
