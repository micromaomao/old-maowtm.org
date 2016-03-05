$(function () {
    $('.frilinks .fri').each(function (n, e) {
        e = $(e);
        var hr = e.find('a').attr('href');
        if (!hr)
            return;
        e.css({cursor: 'pointer'});
        e.click(function (e) {
            window.open(hr);
            e.preventDefault();
        });
    });
    var header = $('.header');
    var headbg = header.find('.background');
    var bhc = header.find('.big-header-content');
    var tsy = 250;
    var bhch;
    function find_bhch () {
        bhc.css({"height": ""});
        bhch = (bhc.length ? bhc.height() : 0)
        tsy = header.height();
    }
    function am () {
        requestAnimationFrame(am);
        find_bhch();
        var t = Math.min(window.scrollY / tsy, 1);
        headbg.css({opacity: 1 - t});
        if (bhch > 0) {
            bhc.css({height: (bhch * (1 - t)) + "px", opacity: 1 - t});
            bhc.css("pointer-events", (t>=0.5?"none":""));
        }
    }
    am();
});
