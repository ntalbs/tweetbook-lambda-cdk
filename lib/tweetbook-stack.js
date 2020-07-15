const cdk      = require('@aws-cdk/core')
const api      = require('@aws-cdk/aws-apigatewayv2')
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

    const bucket = new s3.Bucket(this, 'Tweetbook-Bucket', {
      bucketName: 'tweetbook-bucket'
    })

    new s3deploy.BucketDeployment(this, 'DeployHtml', {
      sources: [s3deploy.Source.asset('web')],
      destinationBucket: bucket,
      destinationPrefix: 'web/html'
    })

    const secret = sm.Secret.fromSecretAttributes(this, 'Tweetbook-Secret', {
      secretArn: 'arn:aws:secretsmanager:eu-west-1:884307244203:secret:TwitterBookBotApiTokens-UOqtNU'
    })

    const quoteTable = new dynamodb.Table(this, 'Tweetbook-Quotes', {
      tableName: 'Tweetbook-Quotes',
      partitionKey: { name: '_id', type: dynamodb.AttributeType.NUMBER },
    })

    const tweetFn = new lambda.Function(this, 'Tweetbook-Tweet', {
      functionName: 'Tweetbook-Tweet',
      runtime: lambda.Runtime.NODEJS_12_X,
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

    const webFn = new lambda.Function(this, 'Tweetbook-Web', {
      functionName: 'Tweetbook-Web',
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambdas/web')
    })

    bucket.grantRead(webFn)

    const web = new api.LambdaProxyIntegration({
      handler: webFn
    })

    const httpApi = new api.HttpApi(this, 'TweetbookApi')

    httpApi.addRoutes({
      path: '/',
      methods: [api.HttpMethod.GET],
      integration: web
    })
    httpApi.addRoutes({
      path: '/{file}',
      methods: [api.HttpMethod.GET],
      integration: web
    })

  }
}

module.exports = { TweetbookStack }
