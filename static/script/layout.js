function check () {
  var mobileClassRegex = /(^|\s)mobile($|\s)/
  if (window.innerWidth < 580) {
    if (!document.body.className.match(mobileClassRegex)) {
      document.body.className += ' mobile'
    }
  } else {
    document.body.className =
      document.body.className.replace(mobileClassRegex, '')
  }

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
function changeHash (hash) {
  var selfUrl = window.location.toString().replace(/#.+$/g, '')
  if (hash !== null) {
    selfUrl += '#' + hash
  }
  window.history.replaceState({}, document.title, selfUrl)
}
if (window.location.hash && window.location.hash.length > 0) {
  var hash = window.location.hash.replace(/^#/g, '')
  var y = document.getElementById(hash).getBoundingClientRect().top
  window.scrollBy(0, y)
}
setInterval(check, 100)
check()

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
