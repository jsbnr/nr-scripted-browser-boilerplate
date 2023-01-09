# New Relic Scripted Browser Boilerplate
This scripted browser boilerplate allows you to author multiple steps of a journey and record the timings and manage the effect of failures of each step.  Each set of steps can be grouped intore-usable categories. Steps can be set to fail the script immediately or defer failure until the script completes. This allows scripted browser journeys to continue even if failures are detected, ensureing as much of your journey is tested as possible before failures are reported.

Steps can be:

- 'hard' steps that stop the script when they fail. If one of thes steps fails the journey ceases.
- 'soft' steps that will fail the journey but the failure is deferred to allow other steps to complete. Failed soft steps will be listed when the script ends. 
- 'optional' steps which are allowed to fail without failing the script. They can be used for optional steps such as hiding adverts or cookie banners.

** Note: Recent updates mean latest versions will no longer run on the legacy (old) synthetic run time. **

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
The intention of the boilerplate is to simplify the creation of multi step journeys, providing a comprehensive logging framework that shows how long steps take to complete and identifies locations of failure. Journeys are made up of individual steps which are then optionally grouped into categories for tidiness. You wrap each step in a timedStep() wrapper function which runs the step and logs the timing information for that step. It also deals with failure conditions. 

### Journey Category
A category runs multiple steps to achieve a purpose. For instance a category might be "Window setup" or "Login" or "Search for product". You can chain categories together. This allows you to build a re-usable set of categories.

Each category is a function, follow the format by setting the `category` and `description` variables. Then add the steps as required

```
const JRN_YourCategoryName = async ()=> {
    const category="Category name here"
    const description="Some explanation of what this category does here"

    startCategory(category,description)

    //Add your steps here, e.g.: 

    //step 1
     await timedStep(STEP_TYPE.HARD, "Open Start URL", category, async () => {
        return $webDriver.get("https://newrelic.com");
    });
    //step 2
    await timedStep(STEP_TYPE.HARD, "Set Window Size", category, async () => {
        return $webDriver
        .manage()
        .window()
        .setRect({ x: 0, y: 0, width: 2328, height: 1667 });
    });
    //step 3... etc
 }
 ```


 ### Steps
 Each step should await a call to `timedStep()`.

 The `timedStep()` function takes the following parameters:

 1: Step type, one of: `STEP_TYPE.HARD`, `STEP_TYPE.SOFT`, `STEP_TYPE.OPTIONAL`
 2: Title/description of the step
 3: Category (use the variable as defined in the category setup)
 4: Wrapped selenium promise function e.g. `()=> { return $webDriver.get(startURL); }` 
 
See example.js for examples.

### Startup
The script starts by checking for browser capabilities then initiating a promise chain. Simply add your journey set categories in turn, following the pattern laid out. 
Once the journey steps have all been run the script ends, logging our any final data and error summary.


### Selenium IDE Formatter conversion

You may have steps generated with the selenium ide formatter [extension](https://chrome.google.com/webstore/detail/synthetics-formatter-for/agedeoibceidbaeajbehgiejlekicbfd). If so then the steps can be convert into the boilerplate format manually.