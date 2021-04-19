const cdk      = require('@aws-cdk/core')
const apigw    = require('@aws-cdk/aws-apigateway')
const dynamodb = require('@aws-cdk/aws-dynamodb')
const iam      = require('@aws-cdk/aws-iam')
const lambda   = require('@aws-cdk/aws-lambda')
const events   = require('@aws-cdk/aws-events')
const s3       = require('@aws-cdk/aws-s3')
const s3deploy = require('@aws-cdk/aws-s3-deployment')
const sm       = require('@aws-cdk/aws-secretsmanager')
const targets  = require('@aws-cdk/aws-events-targets')

class TweetbookStack extends cdk.Stack {

  constructor(scope, id, props) {
    super(scope, id, props)

    const secret = sm.Secret.fromSecretAttributes(this, 'Tweetbook-Secret', {
      secretArn: 'arn:aws:secretsmanager:eu-west-1:884307244203:secret:TwitterBookBotApiTokens-UOqtNU'
    })

    const quoteTable = new dynamodb.Table(this, 'Tweetbook-Quotes', {
      tableName: 'Tweetbook-Quotes',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    const tweetFn = new lambda.Function(this, 'Tweetbook-Tweet', {
      functionName: 'Tweetbook-Tweet',
      runtime: lambda.Runtime.NODEJS_14_X,
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
              selectionPattern: '2..'
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
            statusCode: '200'
          }, {
            statusCode: '404'
          }]
        })
  }
}

module.exports = { TweetbookStack }
