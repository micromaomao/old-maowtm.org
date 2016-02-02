$(function() {
    var requestAnimationFrame = window.requestAnimationFrame || function(x) {
        setTimeout(x, 50);
    };
    var dest = window.dest;
    var countdownBox = $('<div class="countdownBox"></div>');
    var countdownBoxpr = $('<div class="pr"></div>');
    countdownBoxpr.append(countdownBox);
    $('.error').after(countdownBoxpr).remove();
    $.fn.extend({
        changeText: function(text) {
            if(this.text() != text)
                this.text(text);
        }
    });
    var d = $('<span class="number day"></span>');
    var h = $('<span class="number hour"></span>');
    var m = $('<span class="number minute"></span>');
    var sc = $('<span class="number second"></span>');
    var s = $('<span></span>');
    var sline = $('<div class="sline"></div>');
    countdownBox.append(d);
    countdownBox.append(h);
    countdownBox.append(m);
    countdownBox.append(sc);
    sc.append(s);
    sc.append(sline);
    var desttime = $('<div class="desttime"></div>');
    desttime.text('which is ' + dest.toString());
    countdownBoxpr.before(desttime);
    var oneday = 1000*60*60*24;
    var onehour = oneday / 24;
    var oneminute = onehour / 60;
    var onesecond = oneminute / 60;
    function easeIn(x, e) {
        return Math.pow(x, e || 3);
    }
    function easeOut(x, e) {
        return 1 - Math.pow(1 - x, e || 3);
    }
    function num2digstr(x) {
        if(x < 10) {
            return "0" + x;
        } else {
            return x.toString();
        }
    }
    function ptc () {
        var now = Date.now();
        var past = false;
        if(dest < now) {
            past = true;
            if($('.pasted').length == 0) {
                d.before($('<div class="pasted">The destination time has passed:</div>'));
            }
        }
        var diff = Math.abs(dest - now);
        var days = Math.floor(diff / oneday);
        var dayrem = diff % oneday;
        d.changeText(days + 'd');
        var hours = Math.floor(dayrem / onehour);
        var hourrem = dayrem % onehour;
        h.changeText(num2digstr(hours) + 'h');
        var minutes = Math.floor(hourrem / oneminute);
        var minuterem = hourrem % oneminute;
        m.changeText(num2digstr(minutes) + 'm');
        var seconds = Math.floor(minuterem / onesecond);
        var secondrem = minuterem % onesecond;
        s.changeText(num2digstr(seconds) + 's');
        sline.css({width: Math.floor(easeIn(1 - secondrem / onesecond) * 100) + '%', left: Math.floor(easeOut(secondrem / onesecond) * 50) + '%',
                    opacity: easeOut(secondrem / onesecond, 12)});
        requestAnimationFrame(ptc);
    }
    ptc();

    var share = $('<div class="share"></div>');
    var sharepr = $('<div class="pr"></div>');
    sharepr.append(share);
    countdownBoxpr.after(sharepr);
    var link = $('<div class="link">Link: </div>');
    share.append(link);
    var ah = $('<a class="ah"></a>');
    ah.text(window.location.toString());
    ah.attr('href', window.location.toString());
    link.append(ah);
});
