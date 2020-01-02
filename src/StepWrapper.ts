import { ContentType, Status } from "./allure/model";
import { AllureReporter } from "./AllureReporter";
import { StepInterface } from "./allure/Allure";
import { AllureStep } from "./allure/ExecutableItemWrapper";

export class StepWrapper {
  constructor(private readonly reporter: AllureReporter, private readonly step: AllureStep) {
  }

  public startStep(name: string): StepWrapper {
    const step = this.step.startStep(name);
    this.reporter.pushStep(step);
    return new StepWrapper(this.reporter, step);
  }

  public setStatus(status: Status) {
    this.step.status = status;
  }

  public setDescription(description: string) {
    this.step.description = description;
  }

  public setDetailsTrace(detailsTrace: string) {
    this.step.detailsTrace = detailsTrace;
    this.step.statusDetails = { message: "Error", trace: detailsTrace };
  }

  public setDetailsMessage(detailsMessage: string) {
    this.step.detailsMessage = detailsMessage;
  }

  public addAttachment(name: string, content: Buffer | string, type: ContentType) {
    const file = this.reporter.writeAttachment(content, type);
    this.step.addAttachment(name, type, file);
  }

  public endStep(timeMs: number = 0): void {
    this.reporter.popStep();
    this.step.endStep(timeMs);
  }

  public run<T>(body: (step: StepInterface) => T): T {
    return this.step.wrap(body)();
  }
}