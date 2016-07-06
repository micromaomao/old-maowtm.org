function checkSize() {
    var mobileClassRegex = /(^|\s)mobile($|\s)/;
    if (window.innerWidth < 580) {
        if (!document.body.className.match(mobileClassRegex)) {
            document.body.className += " mobile";
        }
    } else {
        document.body.className =
            document.body.className.replace(mobileClassRegex, "");
    }
}
setInterval(checkSize, 100);
checkSize();
