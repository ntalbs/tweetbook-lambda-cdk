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

for (let i = 0; i < data.length; i++) {
  let params = {
    Item: {
      '_id': i,
      'msg': data[i].msg,
      'src': data[i].src
    },
    TableName: 'Tweetbook-Quotes'
  }

  dynamodb.put(params, (e, d) => {
    if (e) {
      console.log(e, e.stack)
    } else {
      console.log(i, '/', data.length)
    }
  })
}
