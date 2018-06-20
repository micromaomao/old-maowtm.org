(function ($) {
  window.noHashChange = true

  var submitHandlers = []

  var ques = $('.que')

  ques.each(function (idx, que) {
    que = $(que)
    que.click(function (evt) {
      que.removeClass('error')
      que.find('.opsy').removeClass('error')
    })
    var mod = que.data('mod')
    if (mod === 'code') {
      var ph = que.find('.placeholder')
      try {
        window.codeQuestionHandler(que.data('codename'), que, function (submitHandler) {
          submitHandlers[idx] = submitHandler
        })
        ph.remove()
      } catch (e) {
        ph.text('Error: ' + e.message)
        que.addClass('error')
      }
    }
    if (mod !== 'single' && mod !== 'select') return
    que.find('.ans').each(function (ansidx, ans) {
      ans = $(ans)
      var opsyBox = ans.find('.opsy')
      var ack = mod === 'single' ? ans.find('input[type=radio]') : ans.find('input[type=checkbox]')
      if (opsyBox.length === 1) {
        opsyBox.on('change keydown', function (evt) {
          setTimeout(function () {
            ack.prop({checked: opsyBox.val().length > 0})
          }, 1)
        })
        ack.on('change', function (evt) {
          setTimeout(function (evt) {
            if (ack.prop('checked')) {
              opsyBox.focus()
            }
          }, 1)
        })
      }
    })
  })

  $('.submit').click(function () {
    var response = []
    var error = false
    ques.each(function (idx, que) {
      var rsp
      que = $(que)
      que.removeClass('error')
      var mod = que.data('mod')
      if (mod === 'single' || mod === 'select') {
        var chooseEle = que.find('.ans input:checked')
        var choose = []
        for (var i = 0; i < chooseEle.length; i++) {
          var cse = chooseEle[i].id
          if (cse.match(/othr$/)) {
            var opsy = que.find('.ans .opsy')
            var opt = opsy.val()
            choose.push('opsy: ' + opt)
            if (opt.length === 0) {
              opsy.addClass('error')
              error = true
            }
          } else {
            choose.push(cse)
          }
        }
        if (choose.length === 0 && !que.data('optional')) {
          que.addClass('error')
          error = true
        }
        rsp = choose
      } else if (mod === 'open') {
        rsp = que.find('.ans textarea').val()
        if (rsp.length === 0 && !que.data('optional')) {
          que.addClass('error')
          error = true
        }
      } else if (mod === 'input') {
        var ipt = que.find('.ans input')
        rsp = ipt.val()
        if (rsp.length === 0 && !que.data('optional')) {
          que.addClass('error')
          error = true
        }
      } else if (mod === 'code') {
        var submitHandler = submitHandlers[idx]
        try {
          rsp = submitHandler()
        } catch (e) {
          que.addClass('error')
          error = true
          rsp = null
        }
      }
      response[idx] = rsp
    })
    if (!error) {
      $('.submit').css({display: 'none'})
      $('.submiting').css({display: 'block'})
      $('.submError').css({display: 'none'})
      var subm = JSON.stringify(response)
      $.ajax('', {
        method: 'POST',
        contentType: 'application/json',
        data: subm,
        error: function (jqxhr, txt, err) {
          txt = jqxhr.responseText || txt || err
          $('.submit').css({display: ''})
          $('.submiting').css({display: 'none'})
          $('.submError').css({display: 'block'}).text(txt)
        },
        success: function (data, status) {
          window.location = 'success/'
        }
      })
    } else {
      window.scrollTo(0, 0)
    }
  })
})(window.$)
