import { App } from "aws-cdk-lib";
import { IntegTest } from "@aws-cdk/integ-tests-alpha";
import { ApiStack } from "./stack";

const app = new App();

const apiStack = new ApiStack(app, "i");

const integ = new IntegTest(app, "IntegTest", { testCases: [apiStack] });

// TODO: get apiStack restApi URL and fetch response

// TODO: Invoke API and assert:
// - response
// - JSON parsing

// https://docs.aws.amazon.com/cdk/api/v2/docs/integ-tests-alpha-readme.html

// https://github.com/aws/aws-cdk/tree/main/packages/%40aws-cdk/integ-runner
