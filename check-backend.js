// Backend Health Check Script for EcoAtlas AI
// Run this to check if your backend servers are running properly

const http = require('http');

const checkServer = (port, name) => {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${name} (Port ${port}): Running and healthy`);
          resolve(true);
        } else {
          console.log(`⚠️  ${name} (Port ${port}): Responding but unhealthy (Status: ${res.statusCode})`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${name} (Port ${port}): Not running or not accessible`);
      console.log(`   Error: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log(`⏰ ${name} (Port ${port}): Request timeout`);
      req.destroy();
      resolve(false);
    });
  });
};

const checkBackendServers = async () => {
  console.log('🔍 Checking EcoAtlas AI Backend Servers...\n');
  
  const results = await Promise.all([
    checkServer(5000, 'Main Backend Server'),
    checkServer(3001, 'Auth Server')
  ]);
  
  console.log('\n📊 Summary:');
  const healthyServers = results.filter(Boolean).length;
  const totalServers = results.length;
  
  if (healthyServers === totalServers) {
    console.log('🎉 All backend servers are running properly!');
    console.log('✅ Your EcoAtlas AI application should work without HTTP errors.');
  } else if (healthyServers > 0) {
    console.log(`⚠️  ${healthyServers}/${totalServers} servers are running.`);
    console.log('🔧 Some features may not work properly.');
  } else {
    console.log('❌ No backend servers are running.');
    console.log('🚀 Please start the backend servers:');
    console.log('   - Run: start_both.bat (Windows)');
    console.log('   - Or: start_both.sh (Linux/Mac)');
    console.log('   - Or manually: cd backend && npm start');
  }
  
  console.log('\n🔗 API Endpoints to check:');
  console.log('   - http://localhost:5000/api/health');
  console.log('   - http://localhost:5000/api/sensor-data/latest');
  console.log('   - http://localhost:5000/api/devices');
  console.log('   - http://localhost:3001/api/auth/health (if auth server is separate)');
};

// Run the health check
checkBackendServers().catch(console.error);





