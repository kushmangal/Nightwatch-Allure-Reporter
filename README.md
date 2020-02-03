#Nightwatch Allure Reporter
This is a custom reporter for nightwatch, which uses allure reporting to generate reports.

##Install Steps
```npm install nightwatch-allure --save```

##Usage Steps

Add following code to globals file in nightwatch
```
const allureReporter = require('nightwatch-allure');
module.exports = {
  reporter: (results,done)=>{
    const reporter = new allureReporter.NightwatchAllureReporter({});
    reporter.write(results,done);
  }
};
```

That's it, this will create a allure-results folder in your root directory
To serve these results use allure reporter cli, for that first you would need to download allure cli then use following command
```
allure generate ./allure-results --clean && allure open
```

##CHANGELOG
7/1/2020 - 
1. Added Report Prefix to Test Name
2. Added Report Prefix and Date of report generation as tags to each test
3. Adding screenshots if exists in all cases and err messages

30/1/2020 - 
1. Fixed error in issue #2