const aws = require('aws-sdk')

aws.config.update({
    region : "eu-west-1"
})

const dynamodb = new aws.DynamoDB.DocumentClient({
  httpOptions: {
    timeout: 5000
  }
})

dynamodb.scan({TableName: 'Tweetbook-Quotes'}, (err, data) => {
  if (err) {
    console.log('Scan failed ...')
    console.log(err, err.stack)
  } else {
    for (const i of data.Items) {
      let params = {
        Key: {
          'id': i.id
        },
        TableName: 'Tweetbook-Quotes'
      }
      dynamodb.delete(params, (err, data) => {
        if (err) {
          console.log('Delete failed', err)
        } else {
          console.log('Delete succeeded, id=', params.Key.id)
        }
      })
    }
  }
})
