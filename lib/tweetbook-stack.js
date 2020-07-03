const cdk      = require('@aws-cdk/core')
const dynamodb = require('@aws-cdk/aws-dynamodb')
const lambda   = require('@aws-cdk/aws-lambda');
const events   = require('@aws-cdk/aws-events');
const targets  = require('@aws-cdk/aws-events-targets');

class TweetbookStack extends cdk.Stack {

  constructor(scope, id, props) {
    super(scope, id, props)

    const bookquoteTable = new dynamodb.Table(this, 'BookQuotes', {
      tableName: 'BookQuotes',
      partitionKey: { name: '_id', type: dynamodb.AttributeType.NUMBER },
    })

    const tweetbookFn = new lambda.Function(this, 'tweetbook', {
      functionName: 'tweetbook',
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambdas/tweetbook'),
      environment: {
        TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
        TWITTER_ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET,
        TWITTER_CONSUMER_KEY: process.env.TWITTER_CONSUMER_KEY,
        TWITTER_CONSUMER_SECRET: process.env.TWITTER_CONSUMER_SECRET,
      }
    })

    bookquoteTable.grant(tweetbookFn, 'dynamodb:GetItem');

    const rule = new events.Rule(this, 'Rule', {
      ruleName: 'EveryDayAt6am',
      schedule: events.Schedule.expression('cron(0 6 * * ? *)')
    });

    rule.addTarget(new targets.LambdaFunction(tweetbookFn));
  }
}

module.exports = { TweetbookStack }
