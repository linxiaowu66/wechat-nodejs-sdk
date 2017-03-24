const colors = require('colors/safe')

const logFactory = (color) => (...args) => console.log(color(...args))

let theme = {
  error: colors.yellow,
  warn: colors.yellow,
  info: colors.green,
  verbose: colors.cyan, 
  debug: colors.blue, 
  silly: colors.rainbow
}

let logger = {}

Object.keys(theme).forEach((level) => {
  logger[level] = (...args) => console.log(theme[level](`[${level}]: `), ...args)
})

exports.__defineSetter__('logger', function (_logger) {
  logger = _logger;
});

exports.__defineGetter__('logger', function () {
  return logger;
});
