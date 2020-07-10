const aws = require('aws-sdk')
const fs  = require('fs')

aws.config.update({
    region : "eu-west-1"
})

const data = JSON.parse(fs.readFileSync("./data.json"))
const dynamodb = new aws.DynamoDB.DocumentClient({
  httpOptions: {
    timeout: 5000
  }
})

for (let i=0; i <data.length; i++) {
  let param = {
    Key: {
      '_id': i
    },
    TableName: 'Tweetbook-Quotes'
  }

  dynamodb.delete(param, function(err, data) {
    if (err) {
      console.log('Delete unsuccessful ...', i)
      console.log(err, err.stack)
    } else {
      console.log('Delete successful ...', i)
    }
  })
}
