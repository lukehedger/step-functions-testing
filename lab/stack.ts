import { App, Stack, StackProps } from "aws-cdk-lib";
import { AwsIntegration, Model, PassthroughBehavior, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { Chain, DefinitionBody, LogLevel, Pass, StateMachine, StateMachineType } from "aws-cdk-lib/aws-stepfunctions";

export const ApiStack = class ApiStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const stateMachine = new StateMachine(this, "StateMachine", {
      definitionBody: DefinitionBody.fromChainable(
        Chain.start(new Pass(this, "Pass")),
      ),
      logs: {
        destination: new LogGroup(this, 'StateMachineLogs', {
          logGroupName: `/aws/vendedlogs/states/state-machine`,
        }),
        includeExecutionData: true,
        level: LogLevel.ALL,
      },
      stateMachineType: StateMachineType.EXPRESS,
    });

    const api = new RestApi(this, "RestApi");

    api.root.addMethod(
      'POST',
      new AwsIntegration({
        action: 'StartSyncExecution',
        integrationHttpMethod: 'POST',
        options: {
          credentialsRole: new Role(this, "CredentialsRole", {
            assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
            inlinePolicies: {
              allowStateMachineExecution: new PolicyDocument({
                statements: [
                  new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ['states:StartSyncExecution'],
                    resources: [stateMachine.stateMachineArn],
                  }),
                ],
              }),
            },
          }),
          integrationResponses: [
            {
              statusCode: '200',
              responseTemplates: {
                'application/json': [
                  "#set($responseOutput = $util.parseJson($input.path('$.output')))",
                  '#if($input.path(\'$.status\').toString().equals("FAILED"))',
                  '#set($context.responseOverride.status = 500)',
                  '{',
                  '"message":"Something went wrong"',
                  '}',
                  '#else',
                  '#set($context.responseOverride.status = $responseOutput.statusCode)',
                  '$responseOutput.body',
                  '#end',
                ].join('\n'),
              },
            },
            {
              selectionPattern: '4\\d{2}',
              statusCode: '400',
              responseTemplates: {
                'application/json': '"error": $input.path(\'$.error\')',
              },
            },
            {
              selectionPattern: '5\\d{2}',
              statusCode: '500',
              responseTemplates: {
                'application/json': '"error": $input.path(\'$.error\')',
              },
            },
          ],
          passthroughBehavior: PassthroughBehavior.NEVER,
          requestTemplates: {
            'application/json': `{
              "input": "{\\"body\\": $util.escapeJavaScript($input.body).replaceAll("\\\\'","'")}",
              "stateMachineArn": "${stateMachine.stateMachineArn}"
            }`,
          },
        },
        service: 'states',
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseModels: {
              'application/json': Model.EMPTY_MODEL,
            },
          },
          {
            statusCode: '400',
            responseModels: {
              'application/json': Model.ERROR_MODEL,
            },
          },
          {
            statusCode: '500',
            responseModels: {
              'application/json': Model.ERROR_MODEL,
            },
          },
        ],
      },
    );
  }
};
