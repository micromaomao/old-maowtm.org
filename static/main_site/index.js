$(function () {
    function toRevTime(dat) {
        function bld(t){
            var ds=Math.floor(t);
            var xx=t-ds;
            if(xx===0){
                return ds;
            }else{
                //               0.xxx
                return ds+"."+(xx.toString().substr(2,1));
            }
        }
        var ct=new Date();
        var c=ct-dat;
        if(c<1000){
            return c+"ms ago";
        }
        if(c<60*1000){
            return bld(c/1000)+"s ago";
        }
        if(c<60*60*1000){
            return bld(c/1000/60)+"m ago";
        }
        if(c<24*60*60*1000){
            return bld(c/1000/60/60)+"h ago";
        }
        if(c<7*24*60*60*1000){
            return bld(c/1000/60/60/24)+"d ago";
        }
        if(c<365*24*60*60*1000){
            return bld(c/1000/60/60/24/7)+"w ago";
        }
        return bld(    c/1000/60/60/24/365)+"years ago";
    }
    $('.evt .time').each(function(n, e) {
        var e = $(e);
        var dt = new Date(e.text());
        var tl = toRevTime(dt);
        e.text(tl);
        e.mouseover(function() {
            e.text(dt.toString());
        }).mouseleave(function() {
            e.text(tl);
        });
    });
});
