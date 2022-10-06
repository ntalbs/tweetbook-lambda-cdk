const cdk      = require('aws-cdk-lib')
const apigw    = cdk.aws_apigateway
const dynamodb = cdk.aws_dynamodb
const iam      = cdk.aws_iam
const lambda   = cdk.aws_lambda
const events   = cdk.aws_events
const s3       = cdk.aws_s3
const s3deploy = cdk.aws_s3_deployment
const sm       = cdk.aws_secretsmanager
const targets  = cdk.aws_events_targets

class TweetbookStack extends cdk.Stack {

  constructor(scope, id, props) {
    super(scope, id, props)

    const secret = sm.Secret.fromSecretAttributes(this, 'Tweetbook-Secret', {
      secretArn: 'arn:aws:secretsmanager:eu-west-1:864661773271:secret:TwitterBookBotApiTokens-1TlZIp'
    })

    const quoteTable = new dynamodb.Table(this, 'Tweetbook-Quotes', {
      tableName: 'Tweetbook-Quotes',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    const tweetFn = new lambda.Function(this, 'Tweetbook-Tweet', {
      functionName: 'Tweetbook-Tweet',
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambdas/tweet')
    })

    secret.grantRead(tweetFn)
    quoteTable.grant(tweetFn, 'dynamodb:GetItem')

    const rule = new events.Rule(this, 'Tweetbook-EveryDayAt6am', {
      ruleName: 'Tweetbook-EveryDayAt6am',
      description: 'Trigger everyday at 6am',
      schedule: events.Schedule.expression('cron(0 6 * * ? *)')
    })

    rule.addTarget(new targets.LambdaFunction(tweetFn))

    // access s3 through api-gw
    const bucket = new s3.Bucket(this, 'Tweetbook-Bucket', {
      bucketName: 'tweetbook-bucket',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    new s3deploy.BucketDeployment(this, 'DeployHtml', {
      sources: [s3deploy.Source.asset('web')],
      destinationBucket: bucket,
      destinationPrefix: 'web/html'
    })

    const role = new iam.Role(this, 'Tweetbook-apigw-role', {
      roleName: 'Tweetbook-ApiGw-S3-ReadOnly',
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    })

    role.addToPolicy(new iam.PolicyStatement({
      resources: [`${bucket.bucketArn}/*`],
      actions: ['s3:GetObject']
    }))

    const api = new apigw.RestApi(this, 'Tweetbook-Web')

    api.root
      .addResource('{file}')
      .addMethod(
        'GET',
        new apigw.AwsIntegration({
          service: 's3',
          integrationHttpMethod: 'GET',
          path: `${bucket.bucketName}/{file}`,
          options: {
            credentialsRole: role,
            requestParameters: {
              'integration.request.path.file': 'method.request.path.file'
            },
            integrationResponses: [{
              statusCode: '200',
              selectionPattern: '2..',
              responseParameters: {
                'method.response.header.Content-Type': 'integration.response.header.Content-Type'
              },
            }, {
              statusCode: '403',
              selectionPattern: '4..'
            }]
          }
        }), {
          requestParameters: {
            'method.request.path.file': true
          },
          methodResponses: [{
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': true
            }
          }, {
            statusCode: '404'
          }]
        })
  }
}

module.exports = { TweetbookStack }
