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

    var imgViewer = function (img) {
        var popup = $('<div class="imgview"></div>');
        $('body').append(popup);
        $('body').css({overflow: 'hidden'});
        this.popup = popup;
        this.closed = false;
        var closebtn = $('<div class="close">Close</div>');
        popup.append(closebtn);
        var _this = this;
        closebtn.click(function () {
            _this.close();
        });
        popup.click(function (evt) {
            if (evt.target == popup[0]) {
                _this.close();
            }
        })
        popup.css({opacity: 0});
        var cpimg = $('<img>');
        cpimg.attr('src', img.attr('src'));
        this.cpimg = cpimg;
        popup.append(cpimg);
        popup.animate({opacity: 1}, 200, function () {
            var wid = cpimg.width();
            var hei = cpimg.height();
            var cwid = popup.width();
            var chei = popup.height();
            cpimg.animate({left: (cwid / 2 - (wid / 2)) + 'px', top: (chei / 2 - (hei / 2)) + 'px'}, 200);
        });
        cpimg.mousedown(function (evt) {
            evt.preventDefault();
            _this.startDrag(evt.clientX, evt.clientY);
        });
    };
    imgViewer.prototype.close = function () {
        if (this.closed)
            return;
        this.closed = true;
        var _this = this;
        this.popup.animate({opacity: 0}, 200, function () {
            _this.popup.remove();
            $('body').css({overflow: ''});
        });
    };
    imgViewer.prototype.startDrag = function (x, y) {
        var cpimg = this.cpimg;
        if (cpimg.queue().length > 0) {
            return;
        }
        var startCord = [x, y];
        function movelist (evt) {
            evt.preventDefault();
            var dragCord = [evt.clientX - startCord[0], evt.clientY - startCord[1]];
            startCord = [evt.clientX, evt.clientY];
            cpimg.css({top: '+=' + dragCord[1] + 'px', left: '+=' + dragCord[0] + 'px'});
        }
        function uplist (evt) {
            evt.preventDefault();
            $('body').off('mousemove', movelist).off('mouseup', uplist);
        }
        $('body').mousemove(movelist).mouseup(uplist);
    };

    function bindimgs() {
        $('.content img').not('.binded').each(function (n, e) {
            var e = $(e);
            e.addClass('binded');
            e.css({cursor: 'pointer'});
            var laststs = null;
            var touchended = false;
            e.on('touchend', function (evt) {
                if (laststs !== null) {
                    clearTimeout(laststs);
                    laststs = null;
                }
                touchended = true;
                laststs = setTimeout(function (evt) {
                    touchended = false;
                    laststs = null;
                }, 100);
            });
            e.click(function () {
                if (touchended) {
                    if (laststs !== null) {
                        clearTimeout(laststs);
                        laststs = null;
                    }
                    touchended = false;
                    window.open(e.attr('src'));
                    return;
                }
                new imgViewer(e);
            });
        });
    }
    setInterval(bindimgs, 100);
});
