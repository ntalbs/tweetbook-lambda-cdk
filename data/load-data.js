const aws = require('aws-sdk')
const fs  = require('fs')

const data = JSON.parse(fs.readFileSync('./data.json'))

aws.config.update({
  region: "eu-west-1"
})

const dynamodb = new aws.DynamoDB.DocumentClient({
  httpOptions: {
    timeout: 5000
  }
});

let i = 0
data.forEach(e => {
  let params = {
    Item: {
      'id': i++,
      'msg': e.msg,
      'src': e.src
    },
    TableName: 'Tweetbook-Quotes'
  }

  dynamodb.put(params, (e, d) => {
    if (e) {
      console.log(e, e.stack)
    } else {
      console.log(i.length)
    }
  })
})
