import * as Models from "./model";
import { NightwatchStep, NightwatchTest } from "./model";
import { AllureReporter } from "./AllureReporter";
import { NightwatchAllureInterface } from "./NightwatchAllureInterface";
import fs from "fs";
import { IAllureConfig } from "./allure/AllureConfig";
import { AllureRuntime } from "./allure/AllureRuntime";
import { ContentType, Status } from "./allure/model";

export let allure: NightwatchAllureInterface;

export class NightwatchAllureReporter {
  private coreReporter: AllureReporter;
  private readonly sendData: boolean = false;

  constructor(opts: Models.NightwatchOptions) {
    const folderName = opts.folder ? opts.folder : "allure-results";
    const allureConfig: IAllureConfig = { resultsDir: folderName };
    //Send Data param is to send a summary of results back as callback of reporter
    if (opts.sendData)
      this.sendData = true;
    this.coreReporter = new AllureReporter(new AllureRuntime(allureConfig));
    allure = this.coreReporter.getInterface();
  }

  public write(results: Models.NightwatchResults, done: Function) {
    let suiteStatus: string = Status.BROKEN;
    let testCount: number = 0;
    let passedCount: number = 0;
    let failedCount: number = 0;
    let skippedCount: number = 0;
    let partialCount: number = 0;
    for (let currentModuleName in results.modules) {
      testCount++;
      let currentModule = results.modules[currentModuleName];
      let currentTest: NightwatchTest = {
        reportPrefix: currentModule.reportPrefix,
        failures: currentModule.failures,
        errors: currentModule.errors,
        skipped: currentModule.skipped.length,
        tests: currentModule.tests,
        isFailure: currentModule.failures > 0 || currentModule.errors > 0,
        isSkipped: currentModule.skipped.length === currentModule.tests,
        suiteName: currentModule.group,
        testName: currentModuleName,
        testSteps: [],
        errorMessage: "",
        timeMs: parseFloat(currentModule.time) * 1000,
        tags: {}
      };

      if (currentTest.suiteName === "") {
        currentTest.suiteName = currentTest.testName;
      }
      if (results.environment !== "") {
        currentTest.suiteName =
          currentTest.suiteName + "-" + results.environment;
      }
      //Starting Test Suite
      this.coreReporter.startSuite(currentTest.suiteName);
      //Starting test in the suite
      this.coreReporter.startCase(currentTest);


      allure.attachment("Reported Result", JSON.stringify(currentModule), ContentType.JSON);

      //Add all completed steps
      for (let completedStep in currentModule.completed) {
        let step = allure.startStep(completedStep);
        const currentStep: NightwatchStep = currentModule.completed[completedStep];
        //Setting step status
        if (currentStep.tests === currentStep.passed) {
          //Passed step
          step.setStatus(Status.PASSED);
        } else if (currentStep.tests === currentStep.skipped) {
          //Skipped step
          step.setStatus(Status.SKIPPED);
        } else if (currentStep.tests === currentStep.failed) {
          //Failed step
          step.setStatus(Status.FAILED);
          step.setDetailsTrace(currentStep.stackTrace);
        } else {
          //Broken step
          step.setStatus(Status.BROKEN);
          step.setDetailsTrace(currentStep.stackTrace);
        }

        for (let completedAssertion in currentStep.assertions) {
          const currentAssertion = currentStep.assertions[completedAssertion];
          //Start Assertion
          let assertion = allure.startStep(currentAssertion.message);
          assertion.setDescription(currentAssertion.fullMsg);
          if (currentAssertion.failure) {
            assertion.setStatus(Status.FAILED);
            assertion.setDetailsTrace(currentAssertion.stackTrace);
            if (currentAssertion.screenshots && currentAssertion.screenshots.length > 0) {
              //Add Screenshots as attachments
              for (let index in currentAssertion.screenshots) {
                const file = currentAssertion.screenshots[index];
                const data = fs.readFileSync(file);
                allure.attachment("Screenshot", data, ContentType.PNG);
              }
            }
            //TODO Add Screenshots
          } else {
            assertion.setStatus(Status.PASSED);
          }
          //End Assertion
          assertion.endStep();
        }
        step.endStep(currentStep.timeMs);
      }

      for (let skippedStep in currentModule.skipped) {
        let step = allure.startStep(skippedStep);
        step.setStatus(Status.SKIPPED);
        step.endStep();
      }

      if (currentModule.assertionsCount!=0 && currentModule.assertionsCount === currentModule.passedCount) {
        //Passed step
        this.coreReporter.setTestStatus(Status.PASSED);
        passedCount++;
      } else if (currentModule.assertionsCount!=0 && currentModule.assertionsCount === currentModule.skippedCount) {
        //Skipped step
        this.coreReporter.setTestStatus(Status.SKIPPED);
        skippedCount++;
      } else if (currentModule.assertionsCount === currentModule.failedCount) {
        //Failed step
        this.coreReporter.setTestStatus(Status.FAILED);
        this.coreReporter.setTestDetailsTrace(currentModule.errmessages.join(","));
        failedCount++;
      } else {
        //Broken step
        this.coreReporter.setTestStatus(Status.BROKEN);
        this.coreReporter.setTestDetailsTrace(currentModule.errmessages.join(","));
        partialCount++;
      }
      this.coreReporter.completeTest();
      this.coreReporter.endSuite();
    }
    if (testCount === passedCount)
      suiteStatus = Status.PASSED;
    else if (testCount === failedCount)
      suiteStatus = Status.FAILED;
    else if (testCount === skippedCount)
      suiteStatus = Status.SKIPPED;
    if (this.sendData)
      done(suiteStatus, testCount, passedCount, failedCount, skippedCount, partialCount);
    else
      done();
  }

}