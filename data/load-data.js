const aws  = require('aws-sdk')
const fs   = require('fs')
const {v4: uuidv4} = require('uuid')

const data = JSON.parse(fs.readFileSync('./data.json'))

aws.config.update({
  region: "eu-west-1"
})

const dynamodb = new aws.DynamoDB.DocumentClient({
  httpOptions: {
    timeout: 5000
  }
});

data.forEach(e => {

  let uuid = uuidv4()
  let p = uuid.indexOf('-')
  let a = uuid.substring(0, p)
  let b = uuid.substring(p)
  let params = {
    Item: {
      'msb': a,
      'lsb': b,
      'msg': e.msg,
      'src': e.src
    },
    TableName: 'Quotes'
  }

  dynamodb.put(params, (e, d) => {
    if (e) {
      console.log(e, e.stack)
    } else {
      console.log(">>>OK>>>", params)
    }
  })
})
