/**
 *  Settings
 */
const DefaultTimeout = 5000;

/**
 * For local development
 */
if (typeof $env === "undefined" || $env === null) {
  require("../simulator/simulator");
}

/* Initial setup */
const assert = require("assert");
const By = $selenium.By;
const globalStartTime = Date.now();
const STEP_TYPE = {
  HARD: "HARD",
  SOFT: "SOFT",
  OPTIONAL: "OPTIONAL",
};
let STEP = 1; //A global indicator of number of steps
let CATEGORY_STEP = {}; //A counter of steps per category
let FAILED_STEPS = []; //A record of failed soft steps
let HARD_FAILURE = "";

/* Utility functions */

/**
 *
 * timedStep()
 * Performs a step timing start and end and dealing with failure.
 *
 * @param {string} type
 * @param {string} description
 * @param {string} category
 * @param {fn} fn
 * @returns Promise
 */

const timedStep = async (type, description, category, stepFn) => {
  const thisStep = STEP++;
  if (!CATEGORY_STEP[category]) {
    CATEGORY_STEP[category] = 1;
  }
  const categoryStep = CATEGORY_STEP[category]++;
  const startTimestamp = Date.now() - globalStartTime;
  console.log(
    `START  Step ${thisStep}: [${category}:${categoryStep}] start: ${startTimestamp}ms -> ${description}`
  );

  try {
    await stepFn(); //runs the function for this step
    const endTimestamp = Date.now() - globalStartTime;
    const elapsed = endTimestamp - startTimestamp;
    console.log(
      `FINISH Step ${thisStep}: [${category}:${categoryStep}] ended: ${endTimestamp}ms, elapsed: ${elapsed}ms -> ${description}`
    );
    return Promise.resolve(true);
  } catch (err) {
    if (type == STEP_TYPE.HARD) {
      console.log(
        `ERROR! Step ${thisStep}: [${category}:${categoryStep}] -> ${description}'\n ╚══> This is a HARD step error so processing of further steps will cease and the  journey will be failed.`
      );
      HARD_FAILURE = `Step ${thisStep}: [${category}:${categoryStep}] -> ${description}`;
      throw err;
    } else if (type == STEP_TYPE.SOFT) {
      console.log(
        `ERROR! Step ${thisStep}: [${category}:${categoryStep}] -> ${description}\n ╚═══> This is a SOFT step error so processing of further steps will continue but the journey will be failed.`
      );
      console.log(`\n${err.message}\n\n`);
      FAILED_STEPS.push({
        failure: `Step ${thisStep}: [${category}:${categoryStep}] - ${description}`,
        reason: err.message,
      });
      return Promise.resolve(true);
    } else {
      console.log(
        `ERROR! Step ${thisStep}: [${category}:${categoryStep}] -> ${description}\n ╚═══> This is an OPTIONAL step so this error will not fail the journey.`
      );
      console.log(`\n${err.message}\n\n`);
      return Promise.resolve(true);
    }
  }
};

/**
 * startCategory()
 * Prints out the category start
 *
 * @param {string} category
 * @param {string} description
 */
const startCategory = (category, description) => {
  console.log(`\n\n==[ Start category: ${category} ]==`);
  console.log(`${description}\n`);
};

/**
 * waitForAndFindElement()
 * Replacement for the deprecated $browser.waitForAndFindElement()
 *
 * @param {string} locator
 * @param {string} waitTimeout
 */
const waitForAndFindElement = async (locator, waitTimeout) => {
  const element = await $webDriver.wait(
    $selenium.until.elementLocated(locator),
    waitTimeout,
    "Timed-out waiting for element to be located using: " + locator
  );
  await $webDriver.wait(
    $selenium.until.elementIsVisible(element),
    waitTimeout,
    "Timed-out waiting for element to be visible using ${element}"
  );
  return await $webDriver.findElement(locator);
};

/**
 * waitForAndFindElement()
 * Replacement for the deprecated $browser.waitForAndFindElement()
 *
 * @param {string} locator
 * @param {string} waitTimeout
 */
const waitForPendingRequests = async (locator, waitTimeout) => {
  return await $webDriver.wait(
    $webDriver.executeScript("return document.readyState == 'complete'"),
    waitTimeout,
    "waitForPendingRequests"
  );
};

/**
 *
 * --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * Journey Categories.
 *
 * Group your journeys steps into categories to keep them tidy!
 */

const JRN_WindowSetup = async (startURL) => {
  const category = "Window Setup";
  const description = "Setup browser window and resize";

  startCategory(category, description);

  await timedStep(STEP_TYPE.HARD, "Open Start URL", category,  async () => {
    $webDriver.get(startURL);
  });

  await timedStep(STEP_TYPE.HARD, "Set Window Size", category,  async () => {
    $webDriver
      .manage()
      .window()
      .setRect({ x: 0, y: 0, width: 2328, height: 1667 });
  });
};

const JRN_Search = async () => {
  const category = "Search";
  const description = "Test search features";
  const SEARCH_TERM = "apm";

  startCategory(category, description);

  await timedStep(STEP_TYPE.HARD, "Click search icon", category, async () => {
    const e = await waitForAndFindElement(
      By.xpath(
        "//div[@id='header-main']//button[contains(@class,'header-search-trigger')]"
      ),
      DefaultTimeout
    );
    e.click();
  });

  await timedStep(STEP_TYPE.HARD, "Type a search term", category, async () => {
    const e = await waitForAndFindElement(
      By.xpath("//input[contains(@class,'js-full-text-search')]"),
      DefaultTimeout
    );
    e.sendKeys(SEARCH_TERM);
  });

  await timedStep(
    STEP_TYPE.HARD,
    "Click submit search icon",
    category,
    async () => {
      const e = await waitForAndFindElement(
        By.xpath("//button[contains(@class,'js-search-form-submit')]"),
        DefaultTimeout
      );
      e.click();
    }
  );

  //Example of checking for presence of text.
  await timedStep(
    STEP_TYPE.SOFT,
    "Check results text is shown",
    category,
    async () => {
      const e = await waitForAndFindElement(
        By.xpath("//div[contains(@class,'st-app-results__summary')]"),
        DefaultTimeout
      );
      const text = await e.getText();

      assert(text.includes("Showing 1–10") && text.includes(SEARCH_TERM));
    }
  );

  //Example showing how we can interrogate the items returned by the findElements function.
  await timedStep(
    STEP_TYPE.SOFT,
    "Check 10 results shown on page",
    category,
    async () => {
      const e = await $webDriver.findElements(
        By.xpath(
          "//div[@id='nr-search-app']//div[@class='st-app-results']/div[contains(@class,'st-app-result')]"
        ),
        DefaultTimeout
      );
      assert(e.length == 10);
    }
  );

  //Example how to sleep for a moment
   //an unlogged sleep, this WON'T appear in the log
  await $webDriver.sleep(1000);  

  // a logged sleep, this will appear in the log
  await timedStep(STEP_TYPE.HARD, "Sleep a moment", category, () => {
    return $webDriver.sleep(1000);
  });
  

  //Example showing how we can click a specific element filtered by some descendant condition, in this case we want to find a search result that is on the docs.newrelic.com domain
  await timedStep(
    STEP_TYPE.HARD,
    "Find and click first docs link",
    category,
    async () => {
      const e = await waitForAndFindElement(
        By.xpath(
          "//div[@id='nr-search-app']//div[@class='st-app-results']/div[contains(@class,'st-app-result')][descendant::a[contains(@href,'docs.newrelic.com')]][1]"
        ),
        DefaultTimeout
      );
      e.click();
    }
  );

  //Example showing how we might check text (in this case demonstrating an optional step as this will fail)
  await timedStep(
    STEP_TYPE.OPTIONAL,
    "Confirm header text is correct",
    category,
    async () => {
      const e = await waitForAndFindElement(By.xpath("//h1"), DefaultTimeout);
      const text = await e.getText();

      assert.strictEqual(text, "Some header we expect to fail");
    }
  );
};

$webDriver
  .getCapabilities()
  //we're ready to start
  .then(async () => {
    //Run each category of steps in turn
    await JRN_WindowSetup("https://newrelic.com/");
    await JRN_Search()
      //your category here...

      /**
       * Script completion messaging
       */
      .then(
        function () {
          if (FAILED_STEPS.length > 0) {
            console.log(
              `\n\n========[ JOURNEY END ]========\nJourney failed: ${FAILED_STEPS.length} soft failures detected:`
            );
            console.log(FAILED_STEPS);
            assert.fail(
              `Journey failed: There were ${FAILED_STEPS.length} soft step failures.`
            );
          } else {
            console.log(
              `\n\n========[ JOURNEY END ]========\nJourney completed successfully`
            );
          }

        },
        function (err) {
          console.log(err.message);
          console.log(
            `\n\n========[ JOURNEY END ]========\nJourney failed: there was a hard step failure.`
          );
          console.log(HARD_FAILURE);
          if (FAILED_STEPS.length > 0) {
            console.log(
              `\n\nThere were also ${FAILED_STEPS.length} soft step failures:`
            );
            console.log(FAILED_STEPS);
          }
          assert.fail(
            `Journey failed: There was a hard step failure and ${FAILED_STEPS.length} soft step failures.`
          );
        }
      );
  });
