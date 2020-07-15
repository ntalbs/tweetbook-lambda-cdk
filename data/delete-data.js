const aws = require('aws-sdk')

aws.config.update({
    region : "eu-west-1"
})

const dynamodb = new aws.DynamoDB.DocumentClient({
  httpOptions: {
    timeout: 5000
  }
})

dynamodb.scan({TableName: 'Tweetbook-Quotes'}, (e, d) => {
  if (e) {
    console.log('Delete unsuccessful ...', i)
    console.log(e, e.stack)
  } else {
    d.Items.forEach(i => {
      let param = {
        Key: {
          'id': i._id
        },
        TableName: 'Tweetbook-Quotes'
      }
      dynamodb.delete(param, (err, data) => {
        if (err) {
          console.log('Delete failed', err)
        } else {
          console.log('Delete successful ...', d.id)
        }
      })
    })
  }
})
