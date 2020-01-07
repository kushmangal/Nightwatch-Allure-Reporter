import { createHash } from "crypto";
import { NightwatchAllureInterface } from "./NightwatchAllureInterface";
import * as Models from "./model";
import { ContentType, LabelName, Stage, Status, StatusDetails } from "./allure/model";
import { AllureTest } from "./allure/AllureTest";
import { AllureStep } from "./allure/ExecutableItemWrapper";
import { AllureGroup } from "./allure/AllureGroup";
import { AllureRuntime } from "./allure/AllureRuntime";

export class AllureReporter {
  private suites: AllureGroup[] = [];
  private steps: AllureStep[] = [];
  private runningTest: AllureTest | null = null;

  constructor(private runtime: AllureRuntime) {
  }

  public getInterface(): NightwatchAllureInterface {
    return new NightwatchAllureInterface(this, this.runtime);
  }

  get currentSuite(): AllureGroup | null {
    if (this.suites.length === 0) {
      return null;
    }
    return this.suites[this.suites.length - 1];
  }

  get currentStep(): AllureStep | null {
    if (this.steps.length > 0) {
      return this.steps[this.steps.length - 1];
    }
    return null;
  }

  get currentTest(): AllureTest | null {
    return this.runningTest;
  }

  set currentTest(test: AllureTest | null) {
    this.runningTest = test;
  }

  public startSuite(suiteName: string) {
    const scope = this.currentSuite || this.runtime;
    const suite = scope.startGroup(suiteName || "Global");
    this.pushSuite(suite);
  }

  public endSuite() {
    if (this.currentSuite !== null) {
      if (this.currentStep !== null) {
        this.currentStep.endStep();
      }
      this.currentSuite.endGroup();
      this.popSuite();
    }
  }

  public startCase(test: Models.NightwatchTest) {
    if (this.currentSuite === null) {
      throw new Error("No active suite");
    }
    this.currentTest = this.currentSuite.startTest(test.testName);
    this.currentTest.setEnd(test.timeMs);
    this.currentTest.fullName = test.testName;
    //Adding date and reportPrefix as tags
    const currentDate = new Date();
    this.currentTest.addLabel(LabelName.TAG, "" + currentDate);
    if (test.reportPrefix) {
      this.currentTest.addLabel(LabelName.TAG, test.reportPrefix);
      this.currentTest.addParameter('Machine', test.reportPrefix);
    }
    this.currentTest.historyId = createHash("md5")
      .update(test.reportPrefix + test.testName)
      .digest("hex");
    this.currentTest.stage = Stage.RUNNING;

    //TODO Check use of this
    // if (test.parent) {
    //     const [parentSuite, suite, ...subSuites] = test.parent.titlePath();
    //     if (parentSuite) {
    //         this.currentTest.addLabel(LabelName.PARENT_SUITE, parentSuite);
    //     }
    //     if (suite) {
    //         this.currentTest.addLabel(LabelName.SUITE, suite);
    //     }
    //     if (subSuites.length > 0) {
    //         this.currentTest.addLabel(LabelName.SUB_SUITE, subSuites.join(" > "));
    //     }
    // }
  }

  public passTestCase(test: Models.NightwatchTest) {
    if (this.currentTest === null) {
      this.startCase(test);
    }
    this.endTest(Status.PASSED);
  }

  public pendingTestCase(test: Models.NightwatchTest) {
    this.startCase(test);
    this.endTest(Status.SKIPPED, { message: "Test ignored" });
  }

  public partialTestCase(test: Models.NightwatchTest) {
    this.startCase(test);
    this.endTest(Status.BROKEN, { message: "Test ignored" });
  }

  public failTestCase(test: Models.NightwatchTest, error: Error) {
    if (this.currentTest === null) {
      this.startCase(test);
    } else {
      const latestStatus = this.currentTest.status;
      // if test already has a failed state, we should not overwrite it
      if (latestStatus === Status.FAILED || latestStatus === Status.BROKEN) {
        return;
      }
    }
    const status = error.name === "AssertionError" ? Status.FAILED : Status.BROKEN;

    this.endTest(status, { message: error.message, trace: error.stack });
  }

  public writeAttachment(content: Buffer | string, type: ContentType): string {
    return this.runtime.writeAttachment(content, type);
  }

  public setTestStatus(status: Status) {
    if (this.currentTest === null) {
      throw new Error("setTestStatus while no test is running");
    }
    this.currentTest.status = status;
  }

  public setTestDescription(description: string) {
    if (this.currentTest === null) {
      throw new Error("setTestDescription while no test is running");
    }
    this.currentTest.description = description;
  }

  public setTestDetailsTrace(detailsTrace: string) {
    if (this.currentTest === null) {
      throw new Error("setTestDetailsTrace while no test is running");
    }
    this.currentTest.statusDetails = { message: "Error", trace: detailsTrace };
  }

  public setTestDetailsMessage(detailsMessage: string) {
    if (this.currentTest === null) {
      throw new Error("setTestDetailsMessage while no test is running");
    }
    this.currentTest.detailsMessage = detailsMessage;
  }

  public addTestAttachment(name: string, content: Buffer | string, type: ContentType) {
    if (this.currentTest === null) {
      throw new Error("addTestAttachment while no test is running");
    }
    const file = this.writeAttachment(content, type);
    this.currentTest.addAttachment(name, type, file);
  }

  public pushStep(step: AllureStep): void {
    this.steps.push(step);
  }

  public popStep(): void {
    this.steps.pop();
  }

  public pushSuite(suite: AllureGroup): void {
    this.suites.push(suite);
  }

  public popSuite(): void {
    this.suites.pop();
  }

  public completeTest(): void {
    if (this.currentTest === null) {
      throw new Error("completeTest while no test is running");
    }
    this.currentTest.endTest();
  }

  private endTest(status: Status, details?: StatusDetails): void {
    if (this.currentTest === null) {
      throw new Error("endTest while no test is running");
    }

    if (details) {
      this.currentTest.statusDetails = details;
    }
    this.currentTest.status = status;
    this.currentTest.stage = Stage.FINISHED;
    this.currentTest.endTest();
  }
}