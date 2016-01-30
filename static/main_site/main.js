window.fontneeded = [];
$(function() {
    var fn = window.fontneeded;
    for(var i = 0; i < fn.length; i ++) {
        // Async css loading
        var linkElement = $('<link rel="stylesheet">');
        linkElement.attr('href', 'https://fonts.googleapis.com' + fn[i]);
        $('head').append(linkElement);
    }
    function resp() {
        if($(window).width() < 800) {
            $('body').removeClass('large');
            $('body').addClass('small');
        } else {
            $('body').removeClass('small');
            $('body').addClass('large');
        }
    }
    $(window).on('resize', resp);
    resp();
});
