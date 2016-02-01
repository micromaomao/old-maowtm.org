$(function() {
    function toRevTime (dat) {
        function bld (t) {
            var ds = Math.floor(t);
            var xx = t-ds;
            if(xx === 0){
                return ds;
            }else{
                return ds + "." + (xx.toString().substr(2,1));
            }
        }
        var ct = new Date();
        var c = ct-dat;
        var past = true;
        if(c < 0) {
            past = false;
            c = -c;
        }
        var ago = past?'ago':'in the future';
        if(c<1000){
            return c+"ms " + ago;
        }
        if(c<60*1000){
            return bld(c/1000)+"s " + ago;
        }
        if(c<60*60*1000){
            return bld(c/1000/60)+"m " + ago;
        }
        if(c<24*60*60*1000){
            return bld(c/1000/60/60)+"h " + ago;
        }
        if(c<7*24*60*60*1000){
            return bld(c/1000/60/60/24)+"d " + ago;
        }
        if(c<365*24*60*60*1000){
            return bld(c/1000/60/60/24/7)+"w " + ago;
        }
        return bld(    c/1000/60/60/24/365)+"years " + ago;
    }
    $('.time.raw').each(function(n, e) {
        var e = $(e);
        var dt = new Date(parseInt(e.text()));
        var tl;
        var hover = false;
        setInterval(function() {
            if(hover)
                return;
            tl = toRevTime(dt);
            if(e.text() != tl)
                e.text(tl);
        }, 1500 + n*30);
        e.mouseover(function() {
            e.text(dt.toString());
            hover = true;
        }).mouseleave(function() {
            e.text(tl);
            hover = false;
        });
        e.removeClass('raw');
    });
});
