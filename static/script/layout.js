function check() {
    var mobileClassRegex = /(^|\s)mobile($|\s)/;
    if (window.innerWidth < 580) {
        if (!document.body.className.match(mobileClassRegex)) {
            document.body.className += " mobile";
        }
    } else {
        document.body.className =
            document.body.className.replace(mobileClassRegex, "");
    }

    if (window.pageYOffset <= 50) {
        changeHash(null);
    } else {
        var elearr = document.querySelectorAll('[id]');
        var currentAnchor = Array.prototype.map.call(elearr, function(e) {
            return {diffTop: Math.abs(e.getBoundingClientRect().top), e: e};
        }).sort(function(a, b) {
            if (a.diffTop < b.diffTop) {
                return -1;
            } else {
                return (a.diffTop > b.diffTop ? 1 : 0);
            }
        })[0].e;
        changeHash(currentAnchor.id);
    }
}
function changeHash(hash) {
    var selfUrl = window.location.toString().replace(/#.+$/g, "");
    if (hash !== null) {
        selfUrl += "#" + hash;
    }
    window.history.replaceState({}, document.title, selfUrl);
}
if (window.location.hash && window.location.hash.length > 0) {
    var hash = window.location.hash.replace(/^#/g, "");
    var y = document.getElementById(hash).getBoundingClientRect().top;
    window.scrollBy(0, y);
}
setInterval(check, 100);
check();
