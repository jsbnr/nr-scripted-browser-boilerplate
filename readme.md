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
