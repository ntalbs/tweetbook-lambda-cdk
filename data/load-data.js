const aws = require('aws-sdk')
const fs  = require('fs')

const quotes = JSON.parse(fs.readFileSync('./data.json'))

aws.config.update({
  region: "eu-west-1"
})

const dynamodb = new aws.DynamoDB.DocumentClient({
  httpOptions: {
    timeout: 5000
  }
});

let i = 0
for (const e of quotes) {
  let params = {
    Item: {
      'id': i++,
      'msg': e.msg,
      'src': e.src
    },
    TableName: 'Tweetbook-Quotes'
  }

  dynamodb.put(params, (err, data) => {
    if (err) {
      console.log(err, err.stack)
    } else {
      console.log(params.Item, '/', quotes.length)
    }
  })
}
