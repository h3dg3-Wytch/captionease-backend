const cdk = require('@aws-cdk/core');
const dynamodb = require('@aws-cdk/aws-dynamodb');

class Dynamo extends cdk.Stack {
  constructor(app, id, { stage }) {
    super(app, id);

    const dynamoTable = new dynamodb.Table(this, 'DynamoTableVideos', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING
      },
      tableName: `${stage}-videos`,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });
    
  }
}

module.exports = { Dynamo };