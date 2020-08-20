const aws  = require('aws-sdk')
const fs   = require('fs')
const {v4: uuidv4} = require('uuid')

aws.config.update({
    region : "eu-west-1"
})

const dynamodb = new aws.DynamoDB.DocumentClient({
  httpOptions: {
    timeout: 1000
  }
});

async function getRandomQuote () {
  let uuid = uuidv4()

  console.log('>>>>>', uuid)

  let p = uuid.indexOf('-')
  let a = uuid.substring(0, p)
  let b = uuid.substring(p)

  let param = {
    TableName: 'Quotes',
    FilterExpression: 'msb < :a and lsb < :b',
    ExpressionAttributeValues: {
      ':a': a,
      ':b': b
    },
    Limit: 1
  }

  let quote = await dynamodb.scan(param).promise()

  if (quote.Items.length===0) {
    console.log('>>>>>', 'Second try')
    param = {
      TableName: 'Quotes',
      FilterExpression: 'msb >= :a and lsb >= :b',
      ExpressionAttributeValues: {
        ':a': a,
        ':b': b
      },
      Limit: 1
    }
    quote = await dynamodb.scan(param).promise()
  }
  return quote
}

getRandomQuote().then(d=>console.log(d))
