const aws = require('aws-sdk')
const dynamodb = new aws.DynamoDB.DocumentClient({apiVersion: '2012-08-10'})
const Twit = require('twit')

const T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
})

function tweet(quote) {
  let msg = `${quote.msg}\n${quote.src}`
  return T.post('statuses/update', {status: msg})
}

const MAX_INDEX = 553

function random() {
  return Math.floor(Math.random() * MAX_INDEX)
}

async function getQuote(id) {
  let param = {
    Key: {
      "_id": id
    },
    TableName: "BookQuotes"
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
