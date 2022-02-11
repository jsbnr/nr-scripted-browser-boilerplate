# New Relic Scripted Browser Boilerplate
This simple boilerplate allows you to author multiple steps of a journey and record the timings and failures of each step. 

Steps can be:

- mandatory 'hard' steps that stop the script when they fail
- 'soft' steps that will fail ther jounrey but continue to allow other steps to complete 
- 'optional' steps which are allowed to fail without failing the script.


## Simulator
This project includes the simulator borrowed from the [Synthetics Workspace](https://github.com/tanben/generator-nrsynthetics-workspace) project.

This allows you to run the journey locally. To do this:

```
(from the root)
npm install
cd journeys
node example.js
```

## Usage
The intention of the boilerplate is to simplify the creation of multi step journeys, providing a comprehensive logging framework that shows how long steps take to complete and identifies locations of failure. Journeys are made up of individual steps which are then optionally grouped into categories for tidyness. You wrap each step in a timedStep() wrapper function which runs the step and logs the timing information for that step. It also deals with failure conditions. 

Each step can be configured to be:

- 'hard' - steps of this type stop the script when they fail.
- 'soft' - steps of this type continue the script when they fail but the journey itself will be failed on completion. Failed soft steps will be listed when the script ends. 
- 'optional'- these steps  are allowed to fail without failing the script at all. They can be used for optional steps such as hiding adverts or cookie banners.

### Journey Category
A category runs multiple steps to achieve a ourpose. For instance a category might be "Window setip" or "Login" or "Search for product". You can chain categories together. This allows you to build a re-usable set of categories.

Each category is a function, follow the format by setting the `category` and `description` variables. Then add the steps as required

```
const JRN_YourCategoryName = ()=> {
    const category="Category name here"
    const description="Some explanation of what this category does here"

    startCategory(category,description)
    return Promise.resolve(true)
    //Add your steps here, e.g.: 
    //.then(timedStep(STEP_TYPE.HARD,"Open Start URL",category,()=>{ return $browser.get("https://newrelic.com").then(e=>e) }))
    //.then(timedStep(STEP_TYPE.HARD,"Set Window Size",category,()=>{ return $browser.manage().window().setSize(2328,1667).then(e=>e) }))
 }
 ```


 ### Steps
 Each step should return a promise. Subsequent steps should be provided using a `.then()` construct and wrapped in the `timedStep()` function.

 The `timedStep()` function takes the following parameters:

 1: Step type, one of: `STEP_TYPE.HARD`, `STEP_TYPE.SOFT`, `STEP_TYPE.OPTIONAL`
 2: Title/description of the step
 3: Category (use the variable as defined in the category setup)
 4: Wrapped selenium promise function `()=> {return $browser.waitForAndFindElement(...)}` 
 
e.g.
```
.then(  timedStep(STEP_TYPE.HARD,"Click search icon",category,()=>{ return $browser.waitForAndFindElement(By.xpath("//button[@id='example']",DefaultTimeout)).then(e=>(e.click())) })  )
```

### Selenium IDE Formatter conversion

You may have steps generated with the selenium ide formatter [extension](https://chrome.google.com/webstore/detail/synthetics-formatter-for/agedeoibceidbaeajbehgiejlekicbfd). If so then the steps can easily be converted into the boilerplate format like this:

```

Example step from the output of the formatter:
    .then( function(){return logger.log(5,"Click By.css(\".header__cta svg\")","test 1"),$browser.waitForAndFindElement(By.css(".header__cta svg"),DefaultTimeout).then(e=>(e.click(),Promise.resolve(!0)))})

This should be converted like this:
    .then( function(){return logger.log(5,"Click By.css(\".header__cta svg\")","test 1"),            $browser.waitForAndFindElement(By.css(".header__cta svg"),DefaultTimeout).then(e=>(e.click(),Promise.resolve(!0)))})
                 V                           V                                      V                 V
                 V                           V                                      V                 V
    .then(       timedStep(STEP_TYPE.HARD,"Click By.css(\".header__cta svg\")",category,()=>{ return $browser.waitForAndFindElement(By.css(".header__cta svg"),DefaultTimeout).then(e=>(e.click(),Promise.resolve(!0)))}))
                 ^                                                                       ^
                 |                                                                       |
                 --- Replace function with timedStep()                                   --- Add anonymous function and return the selenium step
```
