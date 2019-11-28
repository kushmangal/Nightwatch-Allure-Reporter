import * as Models from "./model";
import { NightwatchAssertion, NightwatchStep, NightwatchTest } from "./model";
import { AllureRuntime, IAllureConfig } from "allure-js-commons";
import { AllureReporter } from "./AllureReporter";
import { NightwatchAllureInterface } from "./NightwatchAllureInterface";
import { ContentType, Status } from "allure-js-commons/dist";
import fs from "fs";

export let allure: NightwatchAllureInterface;

export class NightwatchAllureReporter {
  private coreReporter: AllureReporter;

  constructor(opts: Models.NightwatchOptions) {
    const allureConfig: IAllureConfig = { resultsDir: "allure-results", ...opts };
    this.coreReporter = new AllureReporter(new AllureRuntime(allureConfig));
    allure = this.coreReporter.getInterface();
  }

  public write(results: Models.NightwatchResults, done: Function) {

    for (let currentModuleName in results.modules) {
      let currentModule = results.modules[currentModuleName];
      let currentTest: NightwatchTest = {
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
        startTimestamp: currentModule.timestamp,
        endTimestamp: currentModule.timestamp,
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

      //TODO Check how to use this
      // if (currentTest.tags.hasOwnProperty("testcaseId")) {
      //     runtimeAllure.addLabel("testId", currentTest.tags["testcaseId"]);
      // }
      // if (currentTest.tags.hasOwnProperty("description")) {
      //     runtimeAllure.description(currentTest.tags.description);
      // }
      //

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
        step.endStep();
      }

      for (let skippedStep in currentModule.skipped) {
        let step = allure.startStep(skippedStep);
        step.setStatus(Status.SKIPPED);
        step.endStep();
      }

      if (currentModule.assertionsCount === currentModule.passedCount) {
        //Passed step
        this.coreReporter.setTestStatus(Status.PASSED);
      } else if (currentModule.assertionsCount === currentModule.skippedCount) {
        //Skipped step
        this.coreReporter.setTestStatus(Status.SKIPPED);
      } else if (currentModule.assertionsCount === currentModule.failedCount) {
        //Failed step
        this.coreReporter.setTestStatus(Status.FAILED);
        this.coreReporter.setTestDetailsTrace(currentModule.errmessages.join(","));
      } else {
        //Broken step
        this.coreReporter.setTestStatus(Status.BROKEN);
        this.coreReporter.setTestDetailsTrace(currentModule.errmessages.join(","));
      }
      this.coreReporter.completeTest();
      this.coreReporter.endSuite();
    }
    done();
  }
}