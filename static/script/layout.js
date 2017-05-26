// Check moblie and apply layout.
function checkLayout () {
  var mobileClassRegex = /(^|\s)mobile($|\s)/
  if (window.innerWidth < 580) {
    if (!document.body.className.match(mobileClassRegex)) {
      document.body.className += ' mobile'
    }
  } else {
    document.body.className =
      document.body.className.replace(mobileClassRegex, '')
  }
}
// Auto set #xxx on scroll
function checkHash () {
  if (window.pageYOffset <= 50) {
    changeHash(null)
  } else {
    var elearr = document.querySelectorAll('[id]')
    if (elearr.length > 0) {
      var currentAnchor = Array.prototype.map.call(elearr, function (e) {
        return {diffTop: Math.abs(e.getBoundingClientRect().top), e: e}
      }).reduce(function (prev, curr) {
        if (prev.diffTop < curr.diffTop) {
          return prev
        } else {
          return curr
        }
      }).e
      changeHash(currentAnchor.id)
    }
  }
}
var lastHash = null
function changeHash (hash) {
  if (hash === lastHash) {
    return
  }
  lastHash = hash
  var selfUrl = window.location.toString().replace(/#.+$/g, '')
  if (hash !== null) {
    selfUrl += '#' + hash
  }
  window.history.replaceState({}, document.title, selfUrl)
}
document.addEventListener('DOMContentLoaded', function (evt) {
  if (window.location.hash && window.location.hash.length > 0) {
    var hash = window.location.hash.replace(/^#/g, '')
    var ele = document.getElementById(hash)
    if (ele) {
      var y = ele.getBoundingClientRect().top
      window.scrollBy(0, y)
      setTimeout(function () {
        var y = ele.getBoundingClientRect().top
        window.scrollBy(0, y)
      }, 100)
    }
  }
})
var checkInterval = setInterval(function () {
  checkLayout()
  if (!window.noHashChange) {
    checkHash()
  }
}, 100)
checkLayout()

// Allow navigating
window.addEventListener('beforeunload', function () {
  clearInterval(checkInterval)
})

var shakes = document.querySelectorAll('.shake')
function shake () {
  function randomPos () {
    return Math.floor(Math.random() * 4 - 2) + 'px'
  }
  Array.prototype.forEach.call(shakes, function (e) {
    e.style.transform = 'translate(' + randomPos() + ', ' + randomPos() + ')'
  })
  if (shakes.length > 0) {
    window.requestAnimationFrame(shake)
  }
}
shake()

// .selectonclick
function selectEventTarget (e) {
  if (e.target.className.match(/(^|\s)selectonclick(\s|$)/)) {
    var selection = window.getSelection()
    let range = document.createRange()
    range.selectNodeContents(e.target)
    selection.removeAllRanges()
    selection.addRange(range)
  }
}
document.addEventListener('mousedown', selectEventTarget)
document.addEventListener('click', selectEventTarget)
document.addEventListener('touchstart', selectEventTarget)
document.addEventListener('touchend', selectEventTarget)
