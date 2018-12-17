let Args = require('vargs').Constructor;

global.skip = function () {
  let cat = null;
  let patterns = {
    'iphone': 'ios',
    'ipad': 'ios',
    'ios': 'ios',
    'android': 'android'
  };
  _(patterns).each(function (_cat, pattern) {
    let re = new RegExp(pattern, 'i');
    if ((env.BROWSER || "").match(re)) {
      cat = _cat;
    }
  });
  let args = new Args(arguments);
  let found = _(args.all).find(function (skipConfig) {
    let re = new RegExp('^' + skipConfig + '$', 'i');
    return (env.BROWSER || "").match(re) || (cat || "").match(re);
  });
  return found ? {pending: true} : {};
};

