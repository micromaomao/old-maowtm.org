var stack = document.getElementsByClassName('stack')[0]
function selectErrorStack (evt) {
  evt.preventDefault()
  var range = document.createRange()
  range.selectNodeContents(stack)
  var sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
}
if (stack) {
  stack.addEventListener('mousedown', selectErrorStack)
  stack.addEventListener('touchend', selectErrorStack)
}
