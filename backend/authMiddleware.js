const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const {
    CognitoIdentityProviderClient,
    AdminGetUserCommand
} = require("@aws-sdk/client-cognito-identity-provider");

const client = jwksClient({
    jwksUri: `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`
});

const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            return callback(err);
        }

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

        const username = decoded["cognito:username"];
        const sub = decoded.sub;

        try {
            await cognitoClient.send(
                new AdminGetUserCommand({
                    UserPoolId: process.env.COGNITO_USER_POOL_ID,
                    Username: username
                })
            );

            req.user = {
                username,
                sub
            };

            next();

        } catch (err) {
            if (err.name === "UserNotFoundException") {
                return res.status(401).json({
                    error: "Account no longer exists"
                });
            }

            console.error("Cognito user check failed:", err);

            return res.status(500).json({
                error: "Failed to verify account"
            });
        }
    });
};

module.exports = authMiddleware;