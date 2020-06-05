function adjustFontSize() {
	var elem = document.querySelector(".nbdays");
	elem.style.fontSize = Math.max(Math.min(window.innerWidth, 1000) * 0.4, 20).toString() + "px";
}
window.addEventListener("resize", function () { adjustFontSize() });
window.addEventListener("DOMContentLoaded", function () { adjustFontSize() });
