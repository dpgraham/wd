//Element object
//Wrapper around browser methods
let __slice = Array.prototype.slice;
let _ = require("lodash")
    , utils = require("./utils.js")
    , niceArgs = utils.niceArgs
    , niceResp = utils.niceResp
    , elementCommands = require('./element-commands');

let Element = function (value, browser) {
  this.value = value;
  this.browser = browser;

  if (!value) {
    throw new Error("no value passed to Element constructor");
  }

  if (!browser) {
    throw new Error("no browser passed to Element constructor");
  }
};

Element.prototype.emit = function () {
  this.browser.emit.apply(this.browser, __slice.call(arguments, 0));
};

Element.prototype.toString = function () {
  return String(this.value);
};

Element.prototype.toJSON = function () {
  return { ELEMENT: this.value };
};

_(elementCommands).each(function (fn, name) {
  Element.prototype[name] = function () {
    let _this = this;
    let fargs = utils.varargs(arguments);
    this.emit('command', "CALL", "element." + name + niceArgs(fargs.all));
    let cb = function (err) {
      if (err) {
        err.message = '[element.' + name + niceArgs(fargs.all) + "] " + err.message;
        fargs.callback(err);
      } else {
        let cbArgs = __slice.call(arguments, 0);
        _this.emit('command', "RESPONSE", "element." + name + niceArgs(fargs.all),
          niceResp(_.drop(cbArgs)));
        fargs.callback.apply(null, cbArgs);
      }
    };
    let args = fargs.all.concat([cb]);
    return fn.apply(this, args);
  };
});

module.exports = Element;
