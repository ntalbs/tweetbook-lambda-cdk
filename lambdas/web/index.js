const aws = require('aws-sdk')
const s3 = new aws.S3()

async function readBucket(filename) {
  let param = {
    Bucket: 'tweetbook-bucket',
    Key: filename
  }

  let file = await s3.getObject(param).promise()
  return file.Body
}

exports.handler = async (event) => {
  const servingFiles = ['index.html', 'style.css', 'tweetbook.js']

  let filename = event.requestContext.http.path.substring(1)

  if (!filename) {
    filename = 'index.html'
  }

  if (servingFiles.includes(filename)) {
    let content = await readBucket(filename)
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html'
      },
      body: content.toString()
    }
  } else {
    return {
      statusCode: 404
    }
  }
}
