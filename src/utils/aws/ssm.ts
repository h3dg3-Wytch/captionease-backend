import SSM from 'aws-sdk/clients/ssm';

export async function getSSMParameter(props) {
    const { parameterName, env} = props;
    const ssm = new SSM({ region: 'us-east-1' });
    const { Parameter } = await ssm.getParameter({
      Name: `/${env}/${parameterName}`,
    }).promise();

    return Parameter?.Value;
} 
