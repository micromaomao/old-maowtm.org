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
      case 'in': return 'insert'
      default: return type
    }
  }
  function paperName (doc) {
    return doc.subject + ' ' + doc.time + ' paper ' + doc.paper + (doc.variant !== 0 ? doc.variant : '')
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

  function clearNonDirect () {
    $('.ftr').remove()
    $('.ppl').remove()
  }
  function processQuery (query) {
    resultList.html('')
    if (query === '') {
      resultList.append($('<div class="prompt">Search for something...</div>'))
      clearNonDirect()
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
        if (results >= 5) {
          clearNonDirect()
          return
        }
      }
    }

    $('.ppl').css({opacity: 0.5})
    var ppResult = $('<div class="ppl"></div>')
    function fetchPP (subj, time, paper, variant, type) {
      var queryBody = {}
      if (subj) {
        queryBody.subject = subj
      }
      if (time) {
        queryBody.time = time
      }
      if (paper) {
        queryBody.paper = paper
      }
      if (variant) {
        queryBody.variant = variant
      }
      if (type) {
        queryBody.type = type
      }
      $.ajax({
        url: '/search/pp/',
        method: 'get',
        cache: true,
        dataType: 'json',
        data: queryBody,
        success: function (data, s, jqx) {
          if (queryBox.val().trim() !== query) {
            return
          }
          $('.ppl').remove()

          var ppMaps = {}
          for (var i = 0; i < data.length; i ++) {
            (function (doc) {
              var pName = paperName(doc)
              var rs
              if (!ppMaps[pName]) {
                rs = $('<div class="pp"></div>')
                rs.append($('<span class="name"></span>').text(pName))
                ppMaps[pName] = rs
                ppResult.append(rs)
              } else {
                rs = ppMaps[pName]
              }
              rs.append($('<span class="type"></span>').text(getTypeString(doc.type)).click(function () {
                window.open('https://file.schsrch.xyz/' + doc._id)
              }))
            })(data[i])
          }

          $('.pplContainer').append(ppResult)
        }
      })
    }

    if (query.match(/^\d{4}$/)) {
      fetchPP(query, null, null, null, null)
    }
    var match
    if (match = query.match(/^(\d{4})[_ ]([a-z]\d{2})$/)) {
      fetchPP(match[1], match[2])
    } else if (match = query.match(/^(\d{4})[_ ]([a-z]+)$/)) {
      fetchPP(match[1], null, null, null, match[2])
    } else if (match = query.match(/^(\d{4})[_ ]([a-z]\d{2})[_ ]([a-z]+)$/)) {
      fetchPP(match[1], match[2], null, null, match[3])
    } else if (match = query.match(/^(\d{4})[_ ]([a-z]\d{2})[_ ](\d)$/)) {
      fetchPP(match[1], match[2], match[3], null, null)
    } else if (match = query.match(/^(\d{4})[_ ]([a-z]\d{2})[_ ](\d)(\d)$/)) {
      fetchPP(match[1], match[2], match[3], match[4], null)
    } else if (match = query.match(/^(\d{4})[_ ]([a-z]\d{2})[_ ]([a-z]+)[_ ](\d)(\d)$/)) {
      fetchPP(match[1], match[2], match[4], match[5], match[3])
    } else if (match = query.match(/^(\d{4})[_ ]([a-z]\d{2})[_ ]([a-z]+)[_ ](\d)$/)) {
      fetchPP(match[1], match[2], match[4], null, match[3])
    } else {
      $('.ppl').remove()
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
          if (queryBox.val().trim() !== query) {
            return
          }
          $('.ftr').remove()

          for (var i = 0; i < data.length; i ++) {
            (function (idx) {
              var rs = $('<div class="fulltext"></div>')
              rs.append($('<span class="paper"></span>').text(paperName(idx.doc)))
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
            })(data[i])
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
