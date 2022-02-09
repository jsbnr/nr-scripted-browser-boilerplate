/**
 *  Settings
*/ 
const DefaultTimeout = 5000


/**
 * For local development
 */
 if (typeof $env === "undefined" || $env === null) {
    require("../simulator/simulator");
}


/* Initial setup */
const assert = require("assert");
const By = $driver.By;
const globalStartTime=Date.now()
const STEP_TYPE = {
        HARD : "HARD",
        SOFT : "SOFT",
        OPTIONAL : "OPTIONAL"
}
let STEP=1              //A global indicator of number of steps
let CATEGORY_STEP={}    //A counter of steps per category
let FAILED_STEPS=[]     //A record of failed soft steps
let HARD_FAILURE=""



/* Utility functions */

/**
 * 
 * timedStep()
 * Performas a step timing start and end and dealing with failure.
 * 
 * @param {string} type 
 * @param {string} description 
 * @param {string} category 
 * @param {fn} fn 
 * @returns Promise
 */

const timedStep = (type,description,category,fn) =>{
    return ()=>{
        const thisStep=STEP++
        if(!CATEGORY_STEP[category]) {CATEGORY_STEP[category]=1}
        const categoryStep=CATEGORY_STEP[category]++
        const startTimestamp=Date.now()-globalStartTime
        console.log(`START  Step ${thisStep}: [${category}:${categoryStep}] start: ${startTimestamp}ms -> ${description}`)
        return fn().then(e=>{
            const endTimestamp=Date.now()-globalStartTime
            const elapsed=endTimestamp-startTimestamp
            console.log(`FINISH Step ${thisStep}: [${category}:${categoryStep}] ended: ${endTimestamp}ms, elapsed: ${elapsed}ms -> ${description}`)
            return Promise.resolve(!0)
        }).catch(err=>{
            if(type==STEP_TYPE.HARD) {
                console.log(`ERROR! Step ${thisStep}: [${category}:${categoryStep}] -> ${description}'\n ╚══> This is a HARD step error so processing of further steps will cease and the  journey will be failed.`)
                HARD_FAILURE=`Step ${thisStep}: [${category}:${categoryStep}] -> ${description}`
                throw(err)
            } else if (type==STEP_TYPE.SOFT) {
                console.log(`ERROR! Step ${thisStep}: [${category}:${categoryStep}] -> ${description}\n ╚═══> This is a SOFT step error so processing of further steps will continue but the journey will be failed.`)
                console.log(`\n${err.message}\n\n`)
                FAILED_STEPS.push({failure:`Step ${thisStep}: [${category}:${categoryStep}] - ${description}`, reason: err.message})
                return Promise.resolve(!0)
            } else {
                console.log(`ERROR! Step ${thisStep}: [${category}:${categoryStep}] -> ${description}\n ╚═══> This is an OPTIONAL step so this error will not fail the journey.`)
                console.log(`\n${err.message}\n\n`)
                return Promise.resolve(!0)
            }
        })
    }
}

/**
 * startCategory()
 * Prints out the category start
 * 
 * @param {string} category 
 * @param {string} description 
 */
const startCategory = (category,description) => {
    console.log(`\n\n==[ Start category: ${category} ]==`)
    console.log(`${description}\n`)
}

/**
 * Journey step groups. 
 * 
 * Group your jouneys steps into categories to keep them tidy!
 */


 const JRN_WindowSetup = (startURL)=> {
    const category="Window Setup"
    const description="Setup browser window and resize"

    startCategory(category,description)
    return Promise.resolve(true)
    .then(timedStep(STEP_TYPE.HARD,"Open Start URL",category,()=>{ return $browser.get(startURL).then(e=>e) }))
    .then(timedStep(STEP_TYPE.HARD,"Set Window Size",category,()=>{ return $browser.manage().window().setSize(2328,1667).then(e=>e) }))
 }

 const JRN_Search = ()=> {
    const category="Search"
    const description="Test search features"
    const SEARCH_TERM = "apm"

    startCategory(category,description)
    return Promise.resolve(true)
    .then(timedStep(STEP_TYPE.HARD,"Click search icon",category,()=>{ return $browser.waitForAndFindElement(By.xpath("//div[@id='header-main']//button[contains(@class,'header-search-trigger')]",DefaultTimeout)).then(e=>(e.click())) }))
    .then(timedStep(STEP_TYPE.HARD,"Type a search term",category,()=>{ return $browser.waitForAndFindElement(By.xpath("//input[contains(@class,'js-full-text-search')]",DefaultTimeout)).then(e=>(e.sendKeys(SEARCH_TERM))) }))
    .then(timedStep(STEP_TYPE.HARD,"Click submit search icon",category,()=>{ return $browser.waitForAndFindElement(By.xpath("//button[contains(@class,'js-search-form-submit')]",DefaultTimeout)).then(e=>(e.click())) }))

    //Example of checking for presence of text.
    .then(timedStep(STEP_TYPE.SOFT,"Check results text is shown",category,()=>{ return $browser.waitForAndFindElement(By.xpath("//div[contains(@class,'st-app-results__summary')]",DefaultTimeout))
        .then(e=>{
            e.getText().then(text=>{
                assert(text.includes("Showing 1–10") && text.includes(SEARCH_TERM))
            })
        }) 
    }))

    //Example showing how we can interrogate the items returned by the findElements function.
    .then(timedStep(STEP_TYPE.SOFT,"Check 10 results shown on page",category,()=>{ return $browser.findElements(By.xpath("//div[@id='nr-search-app']//div[@class='st-app-results']/div[contains(@class,'st-app-result')]",DefaultTimeout))
        .then(e=>{
            assert(e.length == 10)
        }) 
    }))


    //Example how to sleep for a moment
    .then( ()=>{return $browser.sleep(1000)}) //an unlogged sleep, this wont appear in the log
    .then(timedStep(STEP_TYPE.HARD,"Sleep a moment",category,()=>{ return $browser.sleep(1000) })) // a logged sleep, this wil lappear in the log

    //Example showing how we can click a specific element filtered by some descendant condition, in this case we want to find a search result that is on the docs.newrelic.com domain
    .then(timedStep(STEP_TYPE.HARD,"Find and click first docs link",category,()=>{ return $browser.waitForAndFindElement(By.xpath("//div[@id='nr-search-app']//div[@class='st-app-results']/div[contains(@class,'st-app-result')][descendant::a[contains(@href,'docs.newrelic.com')]][1]",DefaultTimeout)).then(e=>{e.click()}) }))

    //Example showing how we might check text (in this case demonstrating an optinal step as this will fail)
    .then(timedStep(STEP_TYPE.OPTIONAL,"Confirm header text is correct",category,()=>{ return $browser.waitForAndFindElement(By.xpath("//h1",DefaultTimeout)).then(e=>{e.getText().then(text=>assert.strictEqual(text,"Some header we expect to fail"))}) }))

 }





 $browser.getCapabilities().then(function () { })
 
 .then(function (){
    return Promise.resolve(true)

    //Run each category of steps in turn
    .then(()=>JRN_WindowSetup('https://newrelic.com/'))
    .then(()=>JRN_Search())
    //your category here...

   /** 
   * Script completion messaging 
   */
   .then(function() {
     if(FAILED_STEPS.length > 0 ) {
       console.log(`\n\n========[ JOURNEY END ]========\nJourney failed: ${FAILED_STEPS.length} soft failures detected:`)
       console.log(FAILED_STEPS)
       assert.fail(`Journey failed: There were ${FAILED_STEPS.length} soft step failures.`)
     } else {
       console.log(`\n\n========[ JOURNEY END ]========\nJourney completed successfully`)  
     }
         //logger.endTestCase("test1");
     }, function(err) {
       console.log(err.message)
       console.log(`\n\n========[ JOURNEY END ]========\nJourney failed: there was a hard step failure.` )
       console.log(HARD_FAILURE)
       if(FAILED_STEPS.length > 0 ) {
           console.log(`\n\nThere were also ${FAILED_STEPS.length} soft step failures:`)
           console.log(FAILED_STEPS)
       }
       assert.fail(`Journey failed: There was a hard step failure and ${FAILED_STEPS.length} soft step failures.`)
     });
})


