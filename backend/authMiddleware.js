const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`
});

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const db = DynamoDBDocumentClient.from(dynamoClient);


function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}


const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, getKey, {}, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    try {
      const result = await db.send(
        new GetCommand({
          TableName: "Users",
          Key: {
            sub: decoded.sub
          }
        })
      );

      if (!result.Item) {
        return res.status(404).json({
          error: "User profile not found"
        });
      }

      req.user = {
        username: result.Item.username,
        sub: decoded.sub
      };

      next();

    } catch (error) {
      console.error("User lookup failed:", error);
      res.status(500).json({
        error: "Authentication failed"
      });
    }
  });
};


module.exports = authMiddleware;