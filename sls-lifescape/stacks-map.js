//module.exports = (resource, logicalId) => {
//  if (logicalId.endsWith("LogGroup")) return { destination: 'AWSLogs' };
 
  // Falls back to default
//};

const stacksMap = require('serverless-plugin-split-stacks').stacksMap;

stacksMap['AWS::IAM::Role'] = { destination: 'Roles' };
stacksMap['AWS::SNS::Topic'] = { destination: 'Topics' };
stacksMap['AWS::Logs::LogGroup'] = { destination: 'LogGroups' };
stacksMap['AWS::DynamoDB::Table'] = { destination: 'DynamoTables' };
stacksMap['AWS::Lambda::Function'] = { destination: 'Lambdas' };
stacksMap['AWS::ApiGateway::Model'] = { destination: 'APIModels' };


