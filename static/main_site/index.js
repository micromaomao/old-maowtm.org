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
});
