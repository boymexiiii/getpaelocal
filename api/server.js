const express = require('express');
const webauthnApi = require('./webauthn');

const app = express();

app.use('/api', webauthnApi);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`WebAuthn API server running on http://localhost:${PORT}`);
}); 