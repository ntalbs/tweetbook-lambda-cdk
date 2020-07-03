const { expect, matchTemplate, MatchStyle } = require('@aws-cdk/assert');
const cdk = require('@aws-cdk/core');
const Tweetbook = require('../lib/tweetbook-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Tweetbook.TweetbookStack(app, 'MyTestStack');
    // THEN
    expect(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
