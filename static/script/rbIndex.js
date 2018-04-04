;(function () {
  var charLeft = document.getElementsByClassName('charleft')[0]
  var inputBox = document.getElementsByClassName('inputArea')[0]
  var submit = document.getElementsByClassName('submit')[0]
  var submitting = document.getElementsByClassName('submitting')[0]
  function calculateCharleft () {
    var left = 255 - inputBox.value.length
    charLeft.innerText = left + ' character left.'
    if (left <= 0) {
      charLeft.className = 'charleft red'
    } else {
      charLeft.className = 'charleft'
    }
  }
  inputBox.addEventListener('change', calculateCharleft)
  inputBox.addEventListener('keypress', calculateCharleft)
  setInterval(calculateCharleft, 200)

  submit.addEventListener('click', function () {
    submit.style.display = 'none'
    submitting.style.display = 'inline'
    submitting.innerText = 'Submitting...'

    submitStuff(function (errmsg) {
      if (!errmsg) {
        submitting.style.display = ''
        window.location.reload()
        return
      }
      submit.style.display = ''
      submitting.innerText = errmsg
    })
  })

  function submitStuff (callback) {
    var sendTo = submit.dataset.to
    var content = inputBox.value || inputBox.innerText
    var xhr = new window.XMLHttpRequest()
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        var ok = xhr.status === 200
        if (ok) {
          callback()
        } else {
          callback(xhr.responseText || 'undefined')
        }
      }
    }
    xhr.open('POST', '//rb.maowtm.org/pm/' + encodeURIComponent(sendTo))
    xhr.setRequestHeader('Content-type', 'text/plain')
    xhr.send(content)
  }
})()
