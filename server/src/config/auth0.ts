import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { AuthenticationError } from '../utils/errors';

// Auth0 configuration
export const auth0Config = {
  domain: process.env['AUTH0_DOMAIN']!,
  audience: process.env['AUTH0_AUDIENCE']!,
  clientId: process.env['AUTH0_CLIENT_ID']!,
  clientSecret: process.env['AUTH0_CLIENT_SECRET']!,
};

// JWKS client for Auth0 public key verification
const client = jwksClient({
  jwksUri: `https://${auth0Config.domain}/.well-known/jwks.json`,
  requestHeaders: {}, // Optional
  timeout: 30000, // Defaults to 30s
  cache: true,
  cacheMaxEntries: 5, // Default value
  cacheMaxAge: 600000, // Default value (10 minutes)
});

/**
 * Get signing key from Auth0 JWKS
 */
export const getKey = (header: any, callback: any) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
};

/**
 * Verify JWT token with Auth0
 */
export const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        audience: auth0Config.audience,
        issuer: `https://${auth0Config.domain}/`,
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) {
          reject(new AuthenticationError('Invalid token'));
        } else {
          resolve(decoded);
        }
      }
    );
  });
};

/**
 * Extract user information from Auth0 token
 */
export const extractUserFromToken = (decodedToken: any) => {
  return {
    auth0Id: decodedToken.sub,
    email: decodedToken.email,
    name: decodedToken.name || decodedToken.nickname || decodedToken.email,
    roles: decodedToken['https://rental-app.com/roles'] || [],
    permissions: decodedToken.permissions || [],
  };
};