const cdk      = require('@aws-cdk/core')
const dynamodb = require('@aws-cdk/aws-dynamodb')
const lambda   = require('@aws-cdk/aws-lambda')
const events   = require('@aws-cdk/aws-events')
const s3       = require('@aws-cdk/aws-s3')
const sm       = require('@aws-cdk/aws-secretsmanager')
const targets  = require('@aws-cdk/aws-events-targets')

class TweetbookStack extends cdk.Stack {

  constructor(scope, id, props) {
    super(scope, id, props)

    const bucket = new s3.Bucket(this, 'Tweetbook-Bucket')

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
  }
}

module.exports = { TweetbookStack }
