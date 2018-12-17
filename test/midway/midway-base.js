/* global sauceJobTitle, mergeDesired, midwayUrl, Express, uuidLib */

module.exports = function (that, partials) {

  that.timeout(env.TIMEOUT);

  let deferred = Q.defer();

  let browser;
  let allPassed = true;
  let express;
  before(function (done) {
    express = new Express(__dirname + '/assets', partials);
    express.start(done);
  });

  before(function () {
    browser = wd.promiseChainRemote(env.REMOTE_CONFIG);
    deferred.resolve(browser);
    let sauceExtra = {
      name: sauceJobTitle(this.runnable().parent.title),
      tags: ['midway']
    };
    let desired = mergeDesired(env.DESIRED, env.SAUCE ? sauceExtra : null);
    return browser
      .configureLogging()
      .then(function () {
        return browser
          .init(desired)
          .sleep(500)
          .catch(function () {
            // trying one more time
            return browser.init(desired).sleep(500);
          });
      });
  });

  beforeEach(function () {
    let uuid = uuidLib.v1().substring(0, 8);
    let url = midwayUrl({
      testSuite: this.currentTest.parent.title,
      title: this.currentTest.title,
      uuid
    });
    return browser
      .get(url)
      .sleep(500)
      .waitForElementById(uuid, 10000, 500)
      .catch(function () {
        return browser
          .sleep(500)
          .get(url)
          .sleep(500)
          .waitForElementById(uuid, 10000, 500);
      }).sleep(100);
  });

  afterEach(function () {
    allPassed = allPassed && (this.currentTest.state === 'passed');
  });

  after(function () {
    return browser
      .quit().then(function () {
        if (env.SAUCE) { return (browser.sauceJobStatus(allPassed)); }
      });
  });

  after(function (done) {
    express.stop(done);
  });

  return deferred.promise;
};
