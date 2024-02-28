//npm install @aws-sdk/client-amazon-q
/*
const { AmazonQClient } = require('@aws-sdk/client-amazon-q');

const client = new AmazonQClient({
  region: 'region', 
  credentials: {
    accessKeyId: 'key',
    secretAccessKey: 'secret'
  }
});

const params = {
  question: 'What is Amazon Q?'
};

client.ask(params, (err, data) => {
  if (err) console.log(err);
  else console.log(data.answer);
});
*/

const AWS = require('aws-sdk');
const q = new AWS.Q({region: 'region'});

const params = {
  question: 'What is Amazon Q?'
}

q.ask(params, function(err, data) {
  if (err) console.log(err);
  else console.log(data); 
});


