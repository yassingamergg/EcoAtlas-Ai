export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/auth/google') {
    // Handle Google OAuth
    const { id, email, name, picture, email_verified } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    // Mock user data
    const user = {
      id: 1,
      email: email,
      name: name,
      picture: picture,
      provider: 'google'
    };

    // Mock JWT token
    const token = 'mock-jwt-token-' + Date.now();

    res.json({
      message: 'Google login successful',
      token,
      user
    });
  } else if (req.method === 'GET' && req.url === '/api/health') {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
}
