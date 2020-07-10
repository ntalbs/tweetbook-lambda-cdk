const cdk      = require('@aws-cdk/core')
const dynamodb = require('@aws-cdk/aws-dynamodb')
const lambda   = require('@aws-cdk/aws-lambda')
const events   = require('@aws-cdk/aws-events')
const sm       = require('@aws-cdk/aws-secretsmanager')
const targets  = require('@aws-cdk/aws-events-targets')

class TweetbookStack extends cdk.Stack {

  constructor(scope, id, props) {
    super(scope, id, props)

    const secret = sm.Secret.fromSecretAttributes(this, 'Tweetbook-Secret', {
      secretArn: 'arn:aws:secretsmanager:eu-west-1:884307244203:secret:TwitterBookBotApiTokens-UOqtNU'
    })

    const bookquoteTable = new dynamodb.Table(this, 'Tweetbook-Quotes', {
      tableName: 'Tweetbook-Quotes',
      partitionKey: { name: '_id', type: dynamodb.AttributeType.NUMBER },
    })

    const tweetbookFn = new lambda.Function(this, 'Tweetbook-Tweet', {
      functionName: 'Tweetbook-Tweet',
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambdas/tweet')
    })

    secret.grantRead(tweetbookFn)
    bookquoteTable.grant(tweetbookFn, 'dynamodb:GetItem')

    const rule = new events.Rule(this, 'Tweetbook-EveryDayat6am', {
      ruleName: 'Tweetbook-EveryDayAt6am',
      description: 'Trigger everyday at 6am',
      schedule: events.Schedule.expression('cron(0 6 * * ? *)')
    })

    rule.addTarget(new targets.LambdaFunction(tweetbookFn))
  }
}

module.exports = { TweetbookStack }
