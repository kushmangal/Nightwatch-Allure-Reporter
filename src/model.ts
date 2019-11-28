export interface NightwatchOptions {
    folder: string,
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
    timestamp: Date,
    skipped: object[],
    completed: {[key:string]:NightwatchStep},
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
    startTimestamp: Date,
    endTimestamp: Date,
    tags: object
}

export interface NightwatchStep {
    time:string,
    assertions: NightwatchAssertion[],
    tests:number,
    failed:number,
    errors:number,
    skipped:number,
    passed:number,
    stackTrace:string,
}

export interface NightwatchAssertion {
    message:string,
    stackTrace:string,
    fullMsg:string,
    failure:string,
    screenshots:string[],
}