window.codeQuestionHandler = function (codename, que, setSubmitHandler) {
  if (codename === 'sample_helpfulness' || codename === 'mathy_ms_helpfulness') {
    var ans = $('<div class="ans" />')
    que.append(ans)

    var naSelect = $('<input type="checkbox">')
    naSelect.attr('id', que.attr('id') + 'na')
    ans.append(naSelect)
    naSelect.prop('checked', false)

    var naSelectLabel = $('<label>我不学文科</label>')
    if (codename === 'mathy_ms_helpfulness') naSelectLabel.text('我不学理科')
    naSelectLabel.attr('for', naSelect.attr('id'))
    ans.append(naSelectLabel)

    ans.append($('<br>'))

    var rangeBar = $('<input type="range" min="0" max="1" step="any" value="0">')
    rangeBar.css({
      width: '100%',
      borderTop: 'solid 1px #aaa',
      margin: '0'
    })
    ans.append(rangeBar)

    var rangeBarLabel = $('<div style="display: flex; flex-direction: row; justify-content: space-between;"><div>没有一点帮助</div><div style="color: #888">拖动滑条</div><div>非常有帮助</div></div>').css({fontSize: '0.8rem'})
    ans.append(rangeBarLabel)

    var additionalText = $('<textarea placeholder="可选补充说明"></textarea>')
    ans.append(additionalText)

    var nomathaswell = $('<div><del>数学也不学？</del>如果你之前学了数学 但下学期不学 请说下这会对当时的你有多少帮助呗…</div>')

    naSelect.on('change', function (evt) {
      setTimeout(function () {
        var dis = naSelect.prop('checked')
        rangeBar.prop('disabled', dis)
        if (dis) {
          rangeBar.css({opacity: '0.5'})
          rangeBarLabel.css({opacity: '0.5'})
          if (codename === 'mathy_ms_helpfulness') {
            naSelectLabel.after(nomathaswell)
          }
        } else {
          rangeBar.css({opacity: '1'})
          rangeBarLabel.css({opacity: '1'})
          nomathaswell.remove()
        }
      }, 1)
    })
    setSubmitHandler(function () {
      var rsp = {}
      if (naSelect.prop('checked')) {
        rsp.value = null
      } else {
        rsp.value = parseFloat(rangeBar.val())
      }
      rsp.text = additionalText.val()
      return rsp
    })
  }
}
