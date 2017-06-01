const timeUnits = [
  {
    name: 'c.',
    length: 1000 * 60 * 60 * 24 * 365 * 100
  },
  {
    name: 'yr',
    length: 1000 * 60 * 60 * 24 * 365
  },
  {
    name: ' month',
    length: 1000 * 60 * 60 * 24 * 30
  },
  {
    name: 'w',
    length: 1000 * 60 * 60 * 24 * 7
  },
  {
    name: ' day',
    length: 1000 * 60 * 60 * 24
  },
  {
    name: 'h',
    length: 1000 * 60 * 60
  },
  {
    name: 'min',
    length: 1000 * 60
  },
  {
    name: 's',
    length: 1000
  },
  {
    name: 'ms',
    length: 1
  }
]
module.exports = (now, target) => {
  now = now.getTime()
  target = target.getTime()

  if (now === target) return 'just now'
  let past = now > target
  let mag = Math.abs(now - target)
  for (let unit of timeUnits) {
    let val = mag / unit.length
    if (val >= 1) {
      let str = (Math.round(val * 10) / 10).toString()
      return `${str}${unit.name} ${past ? 'ago' : 'after now'}`
    }
  }
  return target.toLocaleString()
}
