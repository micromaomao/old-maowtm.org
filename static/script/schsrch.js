(function ($) {
  function preg_quote (str) {
      // http://kevin.vanzonneveld.net
      // +   original by: booeyOH
      // +   improved by: Ates Goral (http://magnetiq.com)
      // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // +   bugfixed by: Onno Marsman
      return (str+'').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1")
  }
  function getTypeString (type) {
    switch (type) {
      case 'qp': return 'question paper'
      case 'ms': return 'marking scheme'
    }
  }
  var queryBox = $('.queryBox')
  queryBox.focus()
  var resultList = $('.resultList')

  var lastText = ''
  queryBox.on('keydown keyup change', function (evt) {
    setTimeout(function () {
      var text = queryBox.val()
      if (text === lastText) {
        return
      }
      lastText = text

      processQuery(text.trim())
    }, 0)
  })

  function processQuery (query) {
    resultList.html('')
    if (query === '') {
      resultList.append($('<div class="prompt">Search for something...</div>'))
      $('.ftr').remove()
      return
    }
    if (query.match(/^\d{2,4}$/)) {
      var results = 0
      for (var i = 0; i < CIESubjects.length; i ++) {
        var subj = CIESubjects[i]
        if (subj.id.substr(0, query.length) === query) {
          var subjElem = $('<div class="subject"></div>')
          subjElem.append($('<span class="level"></span>').text(subj.level))
          subjElem.append($('<span class="id"></span>').text(subj.id))
          subjElem.append(': ')
          subjElem.append($('<span class="name"></span>').text(subj.name))
          resultList.append(subjElem)
          results ++
        }
        if (results >= 8) {
          $('.ftr').remove()
          return
        }
      }
    }

    $('.ftr').css({opacity: 0.5})
    var fullTextResults = $('<div class="ftr"></div>')
    setTimeout(function () {
      if (queryBox.val().trim() !== query) {
        return
      }
      $.ajax({
        url: '/search/fullText/' + encodeURIComponent(query) + '/',
        method: 'get',
        cache: true,
        dataType: 'json',
        success: function (data, s, jqx) {
          $('.ftr').remove()
          if (queryBox.val().trim() !== query) {
            return
          }

          for (var i = 0; i < data.length; i ++) {
            var idx = data[i]
            var rs = $('<div class="fulltext"></div>')
            rs.append($('<span class="paper"></span>').text(idx.doc.subject + ' ' + idx.doc.time + ' paper ' + idx.doc.paper + (idx.doc.variant !== 0 ? idx.doc.variant : '')))
            rs.append(' ')
            rs.append($('<span class="type"></span>').text(getTypeString(idx.doc.type)))
            rs.append(' ')
            rs.append($('<span class="page"></span>').text('/ page ').append($('<span class="num"></span>').text(idx.index.page + 1)))
            var tcont = $('<div class="content"></div>')
            var ctSplit = idx.index.content.split(new RegExp("(" + preg_quote(query) + ")" , 'i' ))
            if (ctSplit.length === 1) {
              tcont.text(ctSplit[0].substr(0, 255))
            } else if (ctSplit.length === 3) {
              tcont.append($('<span class="pre"></span>').text(ctSplit[0].substr(-127)))
              if (ctSplit[0].substr(-1).match(/^\s$/)) {
                tcont.append(' ')
              }
              tcont.append($('<span class="highlight"></span>').text(ctSplit[1]))
              if (ctSplit[2].substr(0, 1).match(/^\s$/)) {
                tcont.append(' ')
              }
              tcont.append($('<span class="suf"></span>').text(ctSplit[2].substr(0, 127)))
            } else {
              tcont.text(idx.index.content.substr(0, 255))
            }
            rs.append(tcont)
            fullTextResults.append(rs)
            rs.click(function () {
              window.open('https://file.schsrch.xyz/' + idx.doc._id)
            })
          }

          if (i === 0) {
            fullTextResults.append($('<div class="notfind">No text search results.</div>'))
          }
          $('.ftrContainer').append(fullTextResults)
        }
      })
    }, 500)
  }

  processQuery('')
})(window.jQuery)
