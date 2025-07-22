const express = require('express');
const cors = require('cors');
const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory store for demo (replace with DB in production)
const userCredentials = {};
const userChallenges = {};

// Registration options
app.post('/webauthn/register/options', (req, res) => {
  const { userId, username, displayName } = req.body;
  if (!userId || !username || !displayName) return res.status(400).json({ error: 'Missing required fields' });
  const options = generateRegistrationOptions({
    rpName: 'PaePros',
    rpID: req.hostname,
    userID: userId,
    userName: username,
    userDisplayName: displayName,
    attestationType: 'none',
    authenticatorSelection: {
      userVerification: 'preferred',
      residentKey: 'preferred',
    },
    excludeCredentials: (userCredentials[userId] || []).map(authr => ({
      id: authr.credentialID,
      type: 'public-key',
      transports: authr.transports,
    })),
  });
  userChallenges[userId] = options.challenge;
  res.json(options);
});

// Registration verification
app.post('/webauthn/register/verify', (req, res) => {
  const { userId, credential } = req.body;
  if (!userId || !credential) return res.status(400).json({ error: 'Missing required fields' });
  const expectedChallenge = userChallenges[userId];
  const expectedOrigin = req.headers.origin || `http://${req.headers.host}`;
  const expectedRPID = req.hostname;
  try {
    const verification = verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
    });
    if (verification.verified && verification.registrationInfo) {
      userCredentials[userId] = userCredentials[userId] || [];
      userCredentials[userId].push(verification.registrationInfo);
      // TODO: Store credential in DB
      return res.json({ success: true, info: verification.registrationInfo });
    }
    return res.status(400).json({ success: false, error: 'Verification failed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Authentication options
app.post('/webauthn/authenticate/options', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  const allowCredentials = (userCredentials[userId] || []).map(authr => ({
    id: authr.credentialID,
    type: 'public-key',
    transports: authr.transports,
  }));
  const options = generateAuthenticationOptions({
    allowCredentials,
    userVerification: 'preferred',
    timeout: 60000,
    rpID: req.hostname,
  });
  userChallenges[userId] = options.challenge;
  res.json(options);
});

// Authentication verification
app.post('/webauthn/authenticate/verify', (req, res) => {
  const { userId, credential } = req.body;
  if (!userId || !credential) return res.status(400).json({ error: 'Missing required fields' });
  const expectedChallenge = userChallenges[userId];
  const expectedOrigin = req.headers.origin || `http://${req.headers.host}`;
  const expectedRPID = req.hostname;
  const authenticators = userCredentials[userId] || [];
  const authenticator = authenticators.find(a => Buffer.compare(a.credentialID, Buffer.from(credential.id, 'base64url')) === 0);
  if (!authenticator) return res.status(404).json({ success: false, error: 'Authenticator not found' });
  try {
    const verification = verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      authenticator,
    });
    if (verification.verified && verification.authenticationInfo) {
      authenticator.counter = verification.authenticationInfo.newCounter;
      // TODO: Update counter in DB
      return res.json({ success: true, info: verification.authenticationInfo });
    }
    return res.status(400).json({ success: false, error: 'Verification failed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = app; 