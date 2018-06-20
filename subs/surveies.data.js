module.exports = {
  'sciebpc-empire': {
    lang: 'zh/en',
    desc: '这是一个关于微信的调查。所有收集的数据仅做研究用途。数据为匿名收集并且无个人信息。感谢您抽出宝贵时间参与。 / This survey is about WeChat. All data is collected for research usage. No personal detail will be collected, and all response is anonymous. Thank you for helping us.',
    q: [
      {
        question: '请选择您的年龄段… / What is your age group?',
        answer: [
          '≤19', '20-34', '35-49', '50-64', '≥65'
        ],
        mode: 'single'
      },
      {
        question: '您使用微信吗？多久使用一次？ / Do you use WeChat? How often do you check it?',
        answer: [
          '一天使用多次 / Many times every day',
          '一天偶尔使用 / One or few times every day',
          '一周偶尔使用 / Few times a week',
          '从不使用 / Never'
        ],
        mode: 'single'
      },
      {
        question: '您的国籍？ / What is your nationality?',
        mode: 'input',
        placeholder: 'CN'
      },
      {
        question: '您主要用微信做什么？ / What do you mostly do using WeChat?',
        answer: [
          '聊天 / Chat with friends',
          '看朋友圈 / See how others are doing on Moment',
          '使用微信支付 / Pay expenses with WeChat Pay',
          '使用微信游戏 / Share gaming achievements with WeChat Game',
          '看公众号 / Get information from official accounts',
          '消磨时间 / Kill time',
          '使用微信运动 / WeRun motivates me to walk/exercise more'
        ],
        mode: 'select-orother'
      },
      {
        question: '您认为微信支付会取代现金支付吗？ / Do you think WeChat Pay will replace cash payment?',
        answer: ['会 / Yes for sure', '可能 / Maybe', '不会 / No'],
        mode: 'single'
      },
      {
        question: '您最常使用哪一种社交软件？ / What social network do you use the most?',
        answer: [
          '微信 / WeChat',
          'QQ',
          'Facebook',
          '微博 / Weibo'
        ],
        mode: 'single-orother'
      },
      {
        question: '在1-5的程度中，您在日常生活中对微信的依赖有多少？ / On a scale of 1-5, how much do you depend on WeChat in your everyday life?',
        answer: [
          '1 (一点也不依赖 / Not at all)', '2', '3', '4', "5 (无法离开微信 / Can't live without)"
        ],
        mode: 'single',
        singleLine: true
      },
      {
        question: '在1-5的程度中，您目前对微信的满意度是多少？ / On a scale of 1-5, rate your satisfaction with WeChat currently.',
        answer: [
          '1 (完全不满意 / Not satisfied at all)', '2', '3', '4', '5 (非常满意 / Deeply impressed)'
        ],
        mode: 'single',
        singleLine: true
      },
      {
        question: '您觉得微信在十年之后还能像今天一样受欢迎吗？ / Do you think WeChat will remain its current popularity after 10 years from now?',
        mode: 'open',
        placeholder: '必填，请简单解释原因 / Required, please briefly explain why.'
      }
    ]
  },
  'schsrch-mr': {
    lang: 'zh',
    title: 'Schsrch小调查【假装不是Market research',
    descHtml: '<p>如果你从未使用过<a href="https://schsrch.xyz">schsrch.xyz</a>，请忽略此调查！【谢谢你关注我</p><p>准备抽时间写一些比较大的新功能！但是这挺费时间的，所以我想避免出现设计上的问题。在这之前我希望能了解你刷paper的习惯=.=<br>请亲抽出几分钟完成这个小调查…谢谢！\u{1F60A}【遗憾的是新功能考试前可能出不来，因为我非常需要复习。</p>',
    q: [
      {
        mode: 'select-orother',
        question: '你经常在哪些设备上使用Schsrch？',
        answer: [
          '手机，iOS',
          '手机，国内Android + 国内浏览器',
          '手机，Android + Chrome',
          '手机，Android + 其他浏览器',
          '学校电脑',
          '电脑，Chrome / Firefox （学校电脑除外）',
          '电脑，Windows + IE / Edge',
          '电脑，Windows + 其他浏览器',
          '电脑，Mac OS + Safari',
          '电脑，Mac OS + 其他浏览器'
        ]
      },
      {
        mode: 'select-orother',
        question: '在Schsrch上看paper 大多数时候你会直接在网页上看（在点开结果后出现的那个里直接看）还是把整个pdf下载下来或者浏览器打开pdf（点那个下载按钮）再看？为什么？',
        answer: [
          '在网页上看，因为打开就是这样，并且也没什么不好用的',
          '在网页上看，因为跳转问题及Mark scheme方便',
          '在网页上看，因为切换到其他paper方便',
          '在网页上看，因为手机上不想下载pdf（内存不够/省流量）',
          '在网页上看，因为PDF下载很慢',
          '下载PDF，因为网页上加载很慢',
          '下载PDF，因为网页上翻页不方便（不考虑加载慢）',
          '下载PDF，因为网页上不能放大缩小（Mac好像有这个问题）',
          '下载PDF，因为网页上很卡（放大什么的时候有些浏览器可能会特别卡）',
          '下载PDF，因为很多时候我要一次看很多页',
          '下载PDF，因为网页上不能复制',
          '下载PDF，因为网页上显示不了（比如学校电脑上）',
          '两个都很慢\u{1F641}'
        ]
      },
      {
        mode: 'single',
        question: '最近一段时间，你觉得在网页上看时打开paper的速度…',
        answer: [
          '很快',
          '一般',
          '太慢了，无法忍受',
          '有时候很快，但是有时候很慢'
        ]
      },
      {
        mode: 'single',
        question: '你觉得下载PDF的速度…',
        answer: [
          '很快',
          '一般',
          '太慢了，无法忍受',
          '有时候很快，但是有时候特别慢'
        ]
      },
      {
        mode: 'single',
        question: '最近一段时间，你觉得全文搜索的速度…',
        answer: [
          '很快',
          '一般',
          '很慢，以至于我会尽量避免搜索',
          '有时候很快，但是有时候很慢'
        ]
      },
      {
        mode: 'single',
        question: '你的学校 / 工作单位是NCIC的吗？',
        answer: [
          '是',
          '不是',
          '不告诉你'
        ]
      },
      {
        mode: 'single',
        question: '你在NCIC的Wifi下使用Schsrch多吗？',
        answer: [
          '不是NCIC的 / 不告诉你',
          '我不用学校Wifi',
          '基本上都是在学校用的',
          '大部分时间是在学校用',
          '一半一半',
          '很少在学校用'
        ]
      },
      {
        mode: 'single',
        question: '最近一段时间，你觉得按题目全文搜索的精确度…',
        answer: [
          '很满意：每次都能在前几个找到我要的',
          '还可以：大部分时候都能找到我要找的',
          '有待提高：想要的paper经常被排在很后面',
          '有待提高：经常根本找不到'
        ]
      },
      {
        mode: 'open',
        optional: true,
        question: '（可选）列举一些不知道为什么搜不到但是明明在past paper里有的题目？（附上出现在哪个paper里）',
        placeholder: 'What did Clemenceau want to achieve from the peace settlement of 1919-20? / 0470 s07 paper 1'
      },
      {
        mode: 'single-orother',
        question: '如果你可以把一个科目所有的paper都缓存下来离线看，并且就算在线加载也会更快，但是这会用掉平均700M/科的存储，你会使用这个功能吗？',
        answer: [
          '会，这样很好',
          '不会，没那么多存储',
          '电脑上会，手机没那么多存储',
          '不会，我很少没网，而且感觉现在还挺快的'
        ]
      },
      {
        mode: 'single',
        question: '如果速度都一样，你更喜欢真正的App还是网页（Web App）？（网页也可以离线用的）',
        answer: [
          '网页',
          'App',
          '都OK'
        ]
      },
      {
        mode: 'select-orother',
        question: '你对Schsrch界面的满意度如何？',
        answer: [
          '好：简洁清晰',
          '好：配色不辣眼镜',
          '好：总体好看',
          '不好：不清晰，功能复杂 / 模糊，难以理解',
          '不好：配色风格奇怪',
          '不好：总体不好看'
        ]
      },
      {
        mode: 'select-orother',
        question: '你对Schsrch的总体满意度如何？',
        answer: [
          '没什么不满意的',
          '比其他的Past paper网站要好',
          '有些问题，但是总体还不错',
          '问题很多，有待改进',
          '不够稳定，经常用不了 / 出问题',
          '还没有其他的Past paper网站好'
        ]
      },
      {
        mode: 'single-orother',
        question: '你会把Schsrch推荐给别的需要找Past paper的人吗？',
        answer: [
          '肯定会',
          '也许会',
          '不会，因为Schsrch不够好',
          '不会，因为我不给别人推荐网站'
        ]
      },
      {
        mode: 'single-orother',
        question: '下列哪个选项最贴近你的身份？',
        answer: [
          '不告诉你',
          'IGCSE学生',
          'AS / A Level学生',
          'A Level 毕业学生',
          '老师'
        ]
      },
      {
        mode: 'open',
        optional: true,
        question: '（可选）这个网站可能会面临经济问题（i.e. 我没钱，服务器贵）。你有什么好的想法能帮我解决这个问题，或者有什么建议？',
        placeholder: '募捐、广告等，NCIC的人请尽量考虑我目前的实际情况，谢谢您的宝贵意见！'
      },
      {
        mode: 'open',
        optional: true,
        question: '（可选）有什么关于这个网站的其他意见（功能或者界面之类的）？'
      },
      {
        mode: 'select',
        question: '你知道我多少？',
        answer: [
          '不告诉你',
          '你是NCIC的',
          '你目前是IG1的',
          '你目前是IG2的',
          '你是3班的',
          '你是3班的Tim',
          '你是3班的Lynn',
          '并不知道'
        ]
      },
      {
        mode: 'input',
        question: '可选联系方式',
        optional: true,
        placeholder: 'm@maowtm.org'
      }
    ]
  },
  '__unit_test': {
    lang: 'en',
    desc: 'This survey is for testing porpuse. Ignore it.',
    q: [
      {
        question: 'single',
        mode: 'single',
        answer: ['H', 'E', 'L', 'l', 'O']
      },
      {
        question: 'select',
        mode: 'select',
        answer: ['H', 'E', 'L', 'l', 'O']
      },
      {
        question: 'single-orother',
        mode: 'single-orother',
        answer: ['H', 'E', 'L', 'l', 'O']
      },
      {
        question: 'select-orother',
        mode: 'select-orother',
        answer: ['H', 'E', 'L', 'l', 'O']
      },
      {
        question: 'input',
        mode: 'input',
        placeholder: 'ph'
      },
      {
        question: 'open',
        mode: 'open',
        placeholder: 'ph'
      }
    ]
  },
  'jose-proxy-purchasing': {
    lang: 'zh/en',
    title: '小调查 / Survey',
    desc: '小调查 / Survey',
    q: [
      {
        question: '你的年龄段？ / What is your age group?',
        answer: [
          '≤15', '16-24', '25-34', '35-49', '50-64', '≥65'
        ],
        mode: 'single'
      },
      {
        question: '你网上购物的频率是？ / How often do you buy items on the Internet?',
        mode: 'single',
        answer: ['一周一次 / Once per week', '几周一次 / Once per several week', '一年一次 / Once per year', '几乎不 / Hardly']
      },
      {
        mode: 'input',
        question: '你住在哪？ / Where are you living?',
        placeholder: '中国大陆 / Mainland China'
      },
      {
        mode: 'open',
        question: '你一般买什么东西？ / What kind of item do you buy on the Internet usually?'
      },
      {
        mode: 'select-orother',
        question: '一般买哪的东西？ / Where are they from?',
        answer: ['国内 / China (including HK TW & MA)', '日本 / Japan', '欧洲 / Europe', '美国 / US']
      },
      {
        mode: 'single',
        question: '交税吗？ / Do you pay taxes on them?',
        answer: ['我交 / I explicitly pay taxes', '商家交 / Seller pays taxes', '都不交 / No one pays taxes']
      },
      {
        mode: 'single-orother',
        question: '你帮别人代购过吗？ / Had you previously purchased oversea items on behalf of others?',
        answer: [
          "没有，也并不想专门帮 / No, and I don't want to do this often.",
          '没有，但是可以考虑通过这个赚些钱 / Not yet, but I do want to do it for profit.',
          '有，但没有想赚钱 / Yes, but not for profit.',
          '很多次了，且也赚过一点钱 / Many times, and I did earned some money from it.',
          '我专门做代购 / I do it regularly (and professionally)'
        ]
      },
      {
        mode: 'single',
        question: '你出国或者回国的时候会带很多东西吗？ / When you go to a foreign country, do you bring a lot of items?',
        answer: ['会 / Yes', '没 / Not much']
      },
      {
        mode: 'single',
        question: '你出国旅游的频率？ / How often do you travel overseas?',
        answer: ['几乎不 / hardly', '一年一到两次 / Once or twice per year', '一个月一次 / One per month']
      }
    ]
  },
  'schsrch-content-mr': {
    lang: 'zh',
    title: 'SchSrchの第二次小调查',
    descHtml: '<p>此调查面向CIE IGCSE/AS/A Level学生…</p><p>我们希望了解一下网站的用户希望网站增加什么新内容/功能…</p><p>这篇调查可能会需要一点mental effort, we will appreciate your response\u2026</p>' +
              '<p>You may also answer the open questions in English.</p>',
    q: [
      {
        question: '这个暑假之后 你将会是哪个年级的学生？',
        mode: 'single-orother',
        answer: [
          'IG1',
          'IG2',
          'AS',
          'A2 (A Level)',
          '毕业'
        ],
        singleLine: true
      },
      {
        question: '在你上个学期的学习中 有听说或者使用过SchSrch吗？',
        mode: 'single',
        answer: [
          '有使用过',
          '有听说过，但是没有用过，因为不刷paper',
          '有听说过，但是没有用过，因为其他原因',
          '没有听说过'
        ]
      },
      {
        question: '以下的科目中 有哪些是你下学期将会学习的？',
        mode: 'select',
        answer: [
          'Mathematics (IG)',
          'Mathematics (AS & A-Level)',
          'Mathematics (Further)',
          'Economics',
          'Business',
          'History',
          'Sociology',
          'Physics',
          'Chemistry',
          '以上没有'
        ]
      },
      {
        question: '你觉得文科学习中 有范文会对你有多大帮助？',
        mode: 'code',
        codename: 'sample_helpfulness'
      },
      {
        question: '如果网站准备请老师有偿写范文 并给学生收费下载 你怎么看？',
        mode: 'select-orother',
        answer: [
          '我不学文科',
          '我觉得这很有用 只要价格合理我就愿意下载',
          '15-20元一篇一整道大题听起来是个合理的价格 只要写的好的话',
          '10元一篇听起来是个合理的价格',
          '5元一篇听起来是个合理的价格',
          '我觉得用处不大 因为我可以从其他地方获得这样的帮助',
          '我觉得用处不大 因为我对范文没有那么大需要'
        ]
      },
      {
        question: '你考虑在网站上有偿发布你的essay吗？',
        mode: 'select-orother',
        answer: [
          '听起来不错',
          '然而没人会看我写的essay',
          '我身边的同学可能有愿意的',
          '我觉得学生应该多看老师写的',
          '不考虑'
        ]
      },
      {
        question: '你觉得理科学习中 能有更详细的mark scheme会对你有多大的帮助？',
        mode: 'code',
        codename: 'mathy_ms_helpfulness'
      },
      {
        question: '除了之前提到的之外 你觉得还有什么其他可能会对学习有帮助的资源吗？',
        mode: 'open',
        desc: '选填',
        optional: true
      },
      {
        question: '对网站还有什么其他的建议 或者希望看到什么其他的功能吗',
        mode: 'open',
        optional: true,
        desc: '选填'
      },
      {
        question: '谢谢你愿意填写这份问卷 留下你的联系方式（邮箱或微信）以便我们可以get in touch 或者在以后网站有付费内容时给你优惠',
        desc: '虽然你也可以不填…',
        mode: 'open',
        optional: true,
        placeholder: '邮箱 m@maowtm.org；微信号 mao-w-'
      },
      {
        question: 'Lastly, 如果对哪题的回答有需要补充的 请在这里填写',
        mode: 'open',
        optional: true,
        desc: '选填'
      }
    ]
  }
}
