require('../helpers/setup');

describe('wait-for-1 ' + env.ENV_DESC, function () {
  let Asserter = wd.Asserter;
  let page = '<div id="theDiv"></div>';

  let appendChild =
    'setTimeout(function() {\n' +
    ' $("#theDiv").append("<div class=\\"child\\">a waitFor child</div>");\n' +
    '}, arguments[0]);\n';

  let removeChildren =
    '$("#theDiv").empty();\n';

  // util function used tag chai assertion errors
  let tagChaiAssertionError = function (err) {
    // throw error and tag as retriable to poll again
    err.retriable = err instanceof AssertionError;
    throw err;
  };

  let asserter = new Asserter(
    function (browser, cb) {
      browser.text(function (err, text) {
        if (err) { return cb(err); }
        cb(null, text.match(/a waitFor child/), "It worked!");
      });
    }
  );

  let promisedAsserter = new Asserter(
    function (browser) {
      return browser
        .text().then(function (text) {
          text.should.include('a waitFor child');
          return text;
        })
        .catch(tagChaiAssertionError);
    }
  );

  let asserterFalse = new Asserter(
    function (browser, cb) {
      cb(null, false);
    }
  );

  let elAsserter = new Asserter(
    function (el, cb) {
      el.text(function (err, text) {
        if (err) { return cb(err); }
        cb(null, text && text.length > 0);
      });
    }
  );

  let promisedElAsserter = new Asserter(
    function (el) {
      return el
        .text().should.eventually.have.length.above(0)
        .text()
        .catch(tagChaiAssertionError);
    }
  );

  let elAsserterFalse = new Asserter(
    function (el, cb) {
      cb(null, false);
    }
  );

  let partials = {};

  let browser;
  require('./midway-base')(this, partials).then(function (_browser) { browser = _browser; });

  partials['browser.waitFor'] = page;
  it('browser.waitFor', function () {
    return browser

      .execute(appendChild, [env.BASE_TIME_UNIT])
      .text().should.eventually.not.include('a waitFor child')
      .waitFor(asserter, 2 * env.BASE_TIME_UNIT, 100)
        .should.become("It worked!")
      .waitFor({ asserter, timeout: 2 * env.BASE_TIME_UNIT,
                 pollFreq: 100 })
      .waitFor(asserter, 2 * env.BASE_TIME_UNIT).should.become("It worked!")
      .waitFor(asserter).should.become("It worked!")

      .execute(removeChildren)
      .execute(appendChild, [env.BASE_TIME_UNIT])
      .waitFor(promisedAsserter, 2 * env.BASE_TIME_UNIT)
        .should.eventually.include('a waitFor child')

      .then(function () {
        return browser
          .execute(removeChildren)
          .execute(appendChild, [env.BASE_TIME_UNIT])
          .waitFor(asserterFalse, 0.1 * env.BASE_TIME_UNIT, 100)
          .should.be.rejectedWith(/Condition wasn't satisfied!/);
      });
  });

  partials['browser.waitForElement'] = page;
  it('browser.waitForElement', function () {
    return browser

      .execute(appendChild, [env.BASE_TIME_UNIT])
      .elementByCss("#theDiv .child").should.be.rejectedWith(/status: 7/)
      .waitForElement("css selector", "#theDiv .child", 2 * env.BASE_TIME_UNIT, 100)
      .text().should.become('a waitFor child')
      .waitForElement("css selector", "#theDiv .child", 2 * env.BASE_TIME_UNIT)
      .text().should.become('a waitFor child')
      .waitForElement("css selector", "#theDiv .child")
      .text().should.become('a waitFor child')

      .execute(removeChildren)
      .execute(appendChild, [env.BASE_TIME_UNIT])
      .waitForElement("css selector", "#theDiv .child", {
        timeout: 2 * env.BASE_TIME_UNIT, pollFreq: 100 })
      .text().should.become('a waitFor child');
  });

  partials['browser.waitForElement - asserter'] = page;
  it('browser.waitForElement - asserter', function () {
    return browser
      .execute(removeChildren)
      .execute(appendChild, [env.BASE_TIME_UNIT])
      .waitForElement("css selector", "#theDiv .child", elAsserter, 2 * env.BASE_TIME_UNIT, 200)
      .text().should.become('a waitFor child')
      .waitForElement("css selector", "#theDiv .child", elAsserter, 2 * env.BASE_TIME_UNIT)
      .text().should.become('a waitFor child')
      .waitForElement("css selector", "#theDiv .child", elAsserter)
      .text().should.become('a waitFor child')

      .execute(removeChildren)
      .execute(appendChild, [env.BASE_TIME_UNIT])
      .waitForElement("css selector", "#theDiv .child", { asserter: elAsserter,
                                                          timeout: 2 * env.BASE_TIME_UNIT, pollFreq: 200 })
      .text().should.become('a waitFor child')

      .execute(removeChildren)
      .execute(appendChild, [env.BASE_TIME_UNIT])
      .elementByCss("#theDiv .child").should.be.rejectedWith(/status: 7/)
      .waitForElement("css selector", "#theDiv .child", promisedElAsserter,
         2 * env.BASE_TIME_UNIT, 200)
      .text().should.become('a waitFor child');
  });

  partials['browser.waitForElement - rejected'] = page;
  it('browser.waitForElement - rejected', function () {
    return browser.chain()
      .then(function () {
        return browser
          .waitForElement("css selector", "#theDiv .child", elAsserterFalse,
            0.1 * env.BASE_TIME_UNIT, 200)
          .should.be.rejectedWith(/Element condition wasn't satisfied/);
      })

      .then(function () {
        return browser
          .waitForElement("css selector", "#theDiv .child", { asserter: elAsserterFalse,
                                                              timeout: 0.1 * env.BASE_TIME_UNIT, pollFreq: 200 })
          .should.be.rejectedWith(/Element condition wasn't satisfied/);
      })

      .then(function () {
        return browser
          .waitForElement("css selector", "#wrongsel .child", 0.1 * env.BASE_TIME_UNIT)
          .should.be.rejectedWith(/Element condition wasn't satisfied/);
      });
  });

  partials['browser.waitForElementByCss'] = page;
  it('browser.waitForElementByCss', function () {
    return browser

      .execute(appendChild, [env.BASE_TIME_UNIT])
      .elementByCss("#theDiv .child").should.be.rejectedWith(/status: 7/)
      .waitForElementByCss("#theDiv .child", 2 * env.BASE_TIME_UNIT, 200)
      .text().should.become('a waitFor child')

      .execute(removeChildren)
      .execute(appendChild, [env.BASE_TIME_UNIT])
      .waitForElementByCss("#theDiv .child", elAsserter, 2 * env.BASE_TIME_UNIT, 200)
      .text().should.become('a waitFor child')

      .execute(removeChildren)
      .execute(appendChild, [env.BASE_TIME_UNIT])
      .waitForElementByCss("#theDiv .child", { asserter: elAsserter,
                                               timeout: 2 * env.BASE_TIME_UNIT, pollFreq: 200 })
      .text().should.become('a waitFor child');
  });

});
