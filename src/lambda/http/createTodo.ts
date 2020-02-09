import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from "aws-lambda";
import "source-map-support/register";
import * as AWS from "aws-sdk";
import * as uuid from "uuid";

const docClient = new AWS.DynamoDB.DocumentClient();

const todosTable = process.env.TODOS_TABLE;

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("processing :", event);
  const itemId = uuid.v4();
  const parsedBody = JSON.parse(event.body);

  const newItem = {
    id: itemId,
    ...parsedBody
  };

  await docClient
    .put({
      TableName: todosTable,
      Item: newItem
    })
    .promise();


  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin' : '*'
    },
    body: JSON.stringify({
      newItem
    })
  };
};
