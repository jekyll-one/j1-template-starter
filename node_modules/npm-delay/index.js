var args = process.argv.slice(2)
var delay = args[0]

if (delay != parseInt(delay)) {
  return console.error('incorrect delay value: ' + delay);
}

setTimeout(function() {process.exit(0)}, delay);
