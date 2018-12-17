require('./env');

let args = process.argv.splice(2);
let result;

if (args[0] = 'env') {
  result = env[args[1]];
  if (result === undefined) { result = ''; }
  if (typeof result === 'object') {
    result = JSON.stringify(result);
  } else {
    result = result.toString();
  }
}

process.stdout.write(result);
