const aws = require('aws-sdk')
const dynamodb = new aws.DynamoDB.DocumentClient({apiVersion: '2012-08-10'})
const secretsManager = new aws.SecretsManager({ region: 'eu-west-1' })
const Twit = require('twit')

async function getTokens () {
  let secrets = await secretsManager.getSecretValue({SecretId: 'TwitterBookBotApiTokens'}).promise()
  return JSON.parse(secrets.SecretString)
}

let T;
async function tweet(quote) {
  if (!T) {
    let tokens = await getTokens();
    T = new Twit({
      consumer_key: tokens.TWITTER_CONSUMER_KEY,
      consumer_secret: tokens.TWITTER_CONSUMER_SECRET,
      access_token: tokens.TWITTER_ACCESS_TOKEN,
      access_token_secret: tokens.TWITTER_ACCESS_TOKEN_SECRET
    })
  }

  let msg = `${quote.msg}\n${quote.src}`
  return T.post('statuses/update', {status: msg})
}

const MAX_INDEX = 551

function random() {
  return Math.floor(Math.random() * MAX_INDEX)
}

async function getQuote(id) {
  let param = {
    Key: {
      "_id": id
    },
    TableName: "Tweetbook-Quotes"
  }

  let q = await dynamodb.get(param).promise()

  return {
    msg: q.Item.msg,
    src: q.Item.src
  }
}

exports.handler = async (event) => {
  let id = random()
  let q = await getQuote(id)
  let t = await tweet(q)

  const response = {
    statusCode: 200,
    quote: q,
    tweetId: t.data.id
  }

  return response;
}
