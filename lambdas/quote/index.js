const aws = require('aws-sdk')
const dynamodb = new DynamoDB.DocumentClient()
const {v4: uuid4} = require('uuid')

async function putQuote(quote) {
  let param = {
    'id': uuidv4(),
    msg: quote.msg,
    src: quote.src
  }
  dynamodb.put(param)
}
