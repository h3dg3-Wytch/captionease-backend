const cdk = require('@aws-cdk/core');
const {
  StringParameter,
  ParameterType,
  ParameterTier,
} = require('@aws-cdk/aws-ssm');

const createSsmParameters = (props)  => {
  const { scope, keyValues, envName } = props;

  const ssmParameters = Object.entries(
    keyValues
  ).reduce((acc, cur) => {
    const [key, value] = cur;

    // cloudformation output
    new cdk.CfnOutput(scope, key, { value });

    // add output to ssm and make available to other services
    new StringParameter(scope, `param-${key}`, {
      parameterName: `/${envName}${key}`,
      stringValue: value,
      type: ParameterType.STRING,
      tier: ParameterTier.STANDARD,
    });

    return {
      ...acc,
      [key]: value,
    };
  }, {});

  return ssmParameters;
};

module.exports = { createSsmParameters };


// // Usage
// createSsmParameters({
//   scope: this,
//   envName,
//   keyValues: {
//     '/services/api/apiUrl': webhookApiGateway.url,
//   },
// });

// // Referencing in lambda

// const { Parameter } = await ssm
// .getParameter({
//   Name: `/${env}/services/api/apiUrl`,
// })
// .promise();

// const apiUrl = Parameter?.Value || '';

// // When sending to Assembly A.I
// {
//   webhook_url: `${apiUrl}/webhook?token=<videoId:secureToken>`
// }