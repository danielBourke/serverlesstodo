import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from "aws-lambda";
import "source-map-support/register";
import * as AWS from "aws-sdk";
import * as uuid from "uuid";

const docClient = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3({
  signatureVersion: "v4"
});
const todosTable = process.env.TODOS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;
const bucketName = process.env.IMAGES_S3_BUCKET;
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

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
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: "Todo does not exist"
      })
    };
  }
  const imageId = uuid.v4();
  const newImage = await createNewImage(todoId, imageId, event);

  const url = getUploadUrl(imageId);

  return {
    statusCode: 201,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      newImage,
      uploadUrl: url
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

async function createNewImage(todoId: string, imageId: string, event: any) {
  const timeStamp = new Date().toISOString();
  const newImage = JSON.parse(event.body);

  const newItem = {
    todoId,
    timeStamp,
    imageId,
    ...newImage,
    imageUrl: `https://${bucketName}.s3.amazonaws.com/${imageId}`
  };
  console.log("storing a new item", newItem);

  await docClient
    .put({
      TableName: imagesTable,
      Item: newItem
    })
    .promise();

  return newItem;
}

function getUploadUrl(imageId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: imageId,
    Expires: 3000
  })
}