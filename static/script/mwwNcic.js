(function () {
  var bShowHint = document.querySelector('.shownexthint')
  var bShowSolution = document.querySelector('.showsolution')
  var hints = Array.from(document.querySelectorAll('.hints li'))
  var solutionElements = document.querySelectorAll('.hiddensolution')
  function showAll () {
    var i
    for (i = 0; i < solutionElements.length; i++) {
      solutionElements[i].classList.remove('hiddensolution')
    }
    for (i = 0; i < hints.length; i++) {
      hints[i].classList.remove('hidden')
    }
    hints = []
    document.querySelector('.buttons').style.display = 'none'
  }
  bShowSolution.addEventListener('click', showAll)
  function showNextHint () {
    if (hints.length > 0) {
      var h = hints.splice(0, 1)[0]
      h.classList.remove('hidden')
    }
    if (hints.length === 0) {
      bShowHint.style.display = 'none'
    }
  }
  bShowHint.addEventListener('click', showNextHint)

  showNextHint() // Show first hint
})()
