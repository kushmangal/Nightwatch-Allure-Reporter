export interface NightwatchOptions {
  folder: string,
  sendData: boolean
}

export interface NightwatchResults {
  passed: number,
  failed: number,
  errors: number,
  skipped: number,
  tests: number,
  assertions: number,
  environment: string,
  errmessages: object[],
  modules: { [index: string]: NightwatchModule }
}

export interface NightwatchModule {
  reportPrefix: string,
  assertionsCount: number,
  failures: number,
  errors: number,
  tests: number,
  testsCount: number,
  skippedCount: number,
  failedCount: number,
  errorsCount: number,
  time: string,
  skipped: object[],
  completed: { [key: string]: NightwatchStep },
  errmessages: object[],
  passedCount: number,
  group: string,
  modulePath: string,
}

export interface NightwatchTest {
  failures: number,
  errors: number,
  skipped: number,
  tests: number,
  isFailure: boolean,
  isSkipped: boolean,
  suiteName: string,
  testName: string,
  testSteps: object[],
  errorMessage: string,
  timeMs: number,
  tags: object
}

export interface NightwatchStep {
  time: string,
  timeMs: number,
  assertions: NightwatchAssertion[],
  tests: number,
  failed: number,
  errors: number,
  skipped: number,
  passed: number,
  stackTrace: string,
}

export interface NightwatchAssertion {
  message: string,
  stackTrace: string,
  fullMsg: string,
  failure: string,
  screenshots: string[],
}