import { DynamoDB } from 'aws-sdk';
import { Entity, Table } from 'dynamodb-toolbox';


export const createDynamoDbClient = () => {

    const client = new DynamoDB.DocumentClient({
        apiVersion: '2012-08-10',
        region: 'us-east-1'
    });

    const table = new Table({
        DocumentClient: client,
        // FIXME: Use the value in config.ts
        name: 'development-videos',
        partitionKey: 'id',
        sortKey: 'userId'
    });

//     ID (generate an ID using uuid package)
// state (starts with pending)
// videoBucketKey (location of uploaded video on s3)
// extractedAudioKey (location of extracted audio key, will be null initially)
// transcriptionState (starts with pending)
// transcriptionKey (location of transcription SRT file from Assembly.AI, will be null initially)
    const entity = new Entity({
        attributes: {
          id: { partitionKey: true, type: 'string' },
          userId: { sortKey: true, type: 'string'},
          state: { type: 'string' },
          videoBucketKey: { type: 'string' },
          extractedAudioKey: { type: 'string' },
          transcriptionState: { type: 'string' },
          transcriptionKey: { type: 'string' }
        },
        name: 'DynamoTableVideos',
        table 
    });

    const put = async (item) => {
        await entity.put(item);
    }
    const update = async (item) => {
        await entity.update(item);
    }

    return {
        client,
        put,
        update

    };

}
