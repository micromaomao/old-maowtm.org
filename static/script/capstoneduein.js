function adjustFontSize() {
	let elem = document.querySelector(".nbdays");
	elem.style.fontSize = Math.max(Math.min(window.innerWidth, 1000) * 0.4, 20).toString() + "px";
}
window.addEventListener("resize", evt => adjustFontSize());
window.addEventListener("DOMContentLoaded", evt => adjustFontSize());
