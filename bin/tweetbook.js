#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { TweetbookStack } = require('../lib/tweetbook-stack');

const app = new cdk.App();
new TweetbookStack(app, 'TweetbookStack');
