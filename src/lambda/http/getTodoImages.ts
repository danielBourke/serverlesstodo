import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from "aws-lambda";
import "source-map-support/register";
import * as AWS from "aws-sdk";

const docClient = new AWS.DynamoDB.DocumentClient();

const todosTable = process.env.TODOS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("processing :", event);
  const todoId = event.pathParameters.todoId;
  const validtodoId = await todoExists(todoId);

  if (!validtodoId) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*'
    },
      body: JSON.stringify({
        error: "todoDoes not exist"
      })
    };
  }
const images = await getImagesPerTodo(todoId)

 
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      items: images
    })
  };
};

async function todoExists(todoId: string) {
  const result = await docClient
    .get({
      TableName: todosTable,
      Key: {
        id: todoId
      }
    })
    .promise();

  console.log("Get todos: ", result);
  return !!result.Item;
}


async function getImagesPerTodo(todoId: string){
    const result = await docClient.query({
        TableName: imagesTable,
        KeyConditionExpression: "todoId = :todoId",
        ExpressionAttributeValues: {
            ":todoId": todoId
        },
        ScanIndexForward: false
    }).promise()

    return result.Items
}