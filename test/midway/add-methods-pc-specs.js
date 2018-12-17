require('../helpers/setup');

describe('add-methods - promise-chain' + env.ENV_DESC, function () {

  let browser;
  let partials = {};

  require('./midway-base')(this, partials).then(function (_browser) { browser = _browser; });

  let extraAsyncMethods = {
    sleepAndElementById (id, cb) {
      let _this = this;
      _this.sleep(200, function (err) {
        if (err) { return cb(err); }
        _this.elementById(id, cb);
      });
    },
    sleepAndText (el, cb) {
      let _this = this;
      _this.sleep(200, function (err) {
        if (err) { return cb(err); }
        _this.text(el, cb);
      });
    },
    elementByCssWhenReady (selector, timeout, cb) {
      let _this = this;
      _this.waitForElementByCss(selector, timeout, function (err) {
        if (err) { return cb(err); }
        _this.elementByCss(selector, cb);
      });
    }
  };

  let extraElementAsyncMethods = {
    textTwice (cb) {
      let _this = this;
      let result = '';
      _this.text(function (err, text) {
        if (err) { return cb(err); }
        result += text;
        _this.text(function (err, text) {
          if (err) { return cb(err); }
          result += text;
          cb(null, result);
        });
      });
    },
  };

  let extraPromiseChainMethods = {
    sleepAndElementById (id) {
      return this
        .sleep(200)
        .elementById(id);
    },
    sleepAndText (el) {
      return this
        .sleep(200)
        .text(el);
    }
  };

  let extraElementPromiseChainMethods = {
    textTwice () {
      let _this = this;
      let result = '';
      return _this
        .text().then(function (text) {
          result += text;
          return _this;
        }).text().then(function (text) {
          result += text;
          return result;
        });
    }
  };

  let extraPromiseNoChainMethods = {
    sleepAndElementById (id) {
      let _this = this;
      return this
        .sleep(200)
        .then(function () {
          return _this.elementById(id);
        });

    },
    sleepAndText (el) {
      let _this = this;
      return this
        .sleep(200)
        .then(function () {
          return _this.text(el);
        });
    }
  };

  let extraElementPromiseNoChainMethods = {
    textTwice () {
      let _this = this;
      let result = '';
      return _this.text()
        .then(function (text) {
          result += text;
        }).then(function () {
          return _this.text();
        }).then(function (text) {
          result += text;
          return result;
        });
    }
  };

  let allExtraMethodNames = _.union(
    _(extraAsyncMethods).keys().value(),
    _(extraPromiseChainMethods).keys().value(),
    _(extraPromiseNoChainMethods).keys().value()
  );

  let noExtraMethodCheck = function () {
    _(allExtraMethodNames).each(function (name) {
      should.not.exist(wd.Webdriver.prototype[name]);
      should.not.exist(wd.PromiseWebdriver.prototype[name]);
      should.not.exist(wd.PromiseChainWebdriver.prototype[name]);
    });
  };

  beforeEach(function () {
    noExtraMethodCheck();
  });

  afterEach(function () {
    _(allExtraMethodNames).each(function (name) {
      wd.removeMethod(name);
    });
    noExtraMethodCheck();
  });

  beforeEach(function () {
    return browser.getSessionId().then(function (sessionId) {
      browser = wd.promiseChainRemote(env.REMOTE_CONFIG);
      browser.configureLogging();
      browser.attach(sessionId);
    });
  });

  partials['wd.addPromisedMethod (chain)'] =
    '<div id="theDiv">Hello World!</div>';
  it('wd.addPromisedMethod (chain)', function () {
    _(extraPromiseChainMethods).each(function (method, name) {
      wd.addPromiseChainMethod(name, method);
    });
    return browser
      .sleepAndElementById('theDiv')
      .should.be.fulfilled
      .sleepAndText()
      .should.be.fulfilled
      .sleepAndElementById('theDiv')
      .sleepAndText().should.eventually.include("Hello World!");
  });

  partials['wd.addElementPromisedMethod (chain)'] =
    '<div id="theDiv">\n' +
    '  <div id="div1">\n' +
    '    <span>one</span>\n' +
    '    <span>two</span>\n' +
    '  </div>\n' +
    '  <div id="div2">\n' +
    '    <span>one</span>\n' +
    '    <span>two</span>\n' +
    '    <span>three</span>\n' +
    '  </div>\n' +
    '</div>\n';
  it('wd.addElementPromisedMethod (chain)', function () {
    _(extraElementPromiseChainMethods).each(function (method, name) {
      wd.addElementPromiseChainMethod(name, method);
    });
    return browser
      .elementById('div1')
      .textTwice()
      .should.become('one twoone two');
  });

  partials['wd.addPromisedMethod (no-chain)'] =
    '<div id="theDiv">Hello World!</div>';
  it('wd.addPromisedMethod (no-chain)', function () {
    _(extraPromiseNoChainMethods).each(function (method, name) {
      wd.addPromiseMethod(name, method);
    });
    return browser
      .sleepAndElementById('theDiv')
      .should.be.fulfilled
      .sleepAndText()
      .should.be.fulfilled
      .sleepAndElementById('theDiv')
      .sleepAndText().should.eventually.include("Hello World!");
  });

  partials['wd.addElementPromisedMethod (no-chain)'] =
    '<div id="theDiv">\n' +
    '  <div id="div1">\n' +
    '    <span>one</span>\n' +
    '    <span>two</span>\n' +
    '  </div>\n' +
    '  <div id="div2">\n' +
    '    <span>one</span>\n' +
    '    <span>two</span>\n' +
    '    <span>three</span>\n' +
    '  </div>\n' +
    '</div>\n';
  it('wd.addElementPromisedMethod (no-chain)', function () {
    _(extraElementPromiseNoChainMethods).each(function (method, name) {
      wd.addElementPromiseMethod(name, method);
    });
    return browser
      .elementById('div1')
      .textTwice()
      .should.become('one twoone two');
  });

  partials['wd.addAsyncMethod'] =
    '<div id="theDiv">Hello World!</div>';
  it('wd.addAsyncMethod', function () {
    _(extraAsyncMethods).each(function (method, name) {
      wd.addAsyncMethod(name, method);
    });
    return browser
      // .sleepAndElementById('theDiv')
      //   .should.be.fulfilled
      // .sleepAndText()
      //   .should.be.fulfilled
      // .sleepAndElementById('theDiv')
      // .sleepAndText().should.eventually.include("Hello World!")
      .elementByCssWhenReady('#theDiv', 500).text()
        .should.become("Hello World!");
  });

  partials['wd.addElementAsyncMethod'] =
    '<div id="theDiv">\n' +
    '  <div id="div1">\n' +
    '    <span>one</span>\n' +
    '    <span>two</span>\n' +
    '  </div>\n' +
    '  <div id="div2">\n' +
    '    <span>one</span>\n' +
    '    <span>two</span>\n' +
    '    <span>three</span>\n' +
    '  </div>\n' +
    '</div>\n';
  it('wd.addElementAsyncMethod', function () {
    _(extraElementAsyncMethods).each(function (method, name) {
      wd.addElementAsyncMethod(name, method);
    });
    return browser
      .elementById('div1')
      .textTwice()
      .should.become('one twoone two');
  });
});

