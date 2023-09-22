import { App, Duration } from "aws-cdk-lib";
import { ExpectedResult, IntegTest } from "@aws-cdk/integ-tests-alpha";
import { ApiStack } from "../stack";

const app = new App();

const apiStack = new ApiStack(app, "i");

const integ = new IntegTest(app, "IntegTest", { testCases: [apiStack] });

// TODO: get apiStack restApi URL and fetch response
// TODO: Assert JSON parsing (apostrophe)
// fetch(this.apiUrl)

const start = integ.assertions.awsApiCall('StepFunctions', 'startExecution', {
  stateMachineArn: apiStack.stateMachineArn,
});

// integ.assertions.awsApiCall('StepFunctions', 'describeExecution', {
//   executionArn: start.getAttString('executionArn'),
// }).expect(ExpectedResult.objectLike({
//   // TODO: Assert output https://docs.aws.amazon.com/step-functions/latest/apireference/API_DescribeExecution.html#API_DescribeExecution_ResponseSyntax
//   status: 'SUCCEEDED',
// })).waitForAssertions({
//   totalTimeout: Duration.minutes(5),
//   interval: Duration.seconds(15),
//   backoffRate: 3,
// });
