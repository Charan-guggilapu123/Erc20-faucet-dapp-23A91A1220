const fs = require('fs');
const path = require('path');

function main() {
  const root = path.join(__dirname, '..');
  const deploymentPath = path.join(root, 'deployment.json');
  const frontendEnvPath = path.join(root, 'frontend', '.env');

  if (!fs.existsSync(deploymentPath)) {
    console.error('deployment.json not found. Run deploy first.');
    process.exit(1);
  }

  const dep = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const { token, faucet } = dep;
  if (!token || !faucet) {
    console.error('deployment.json missing token/faucet addresses');
    process.exit(1);
  }

  let env = '';
  if (fs.existsSync(frontendEnvPath)) {
    env = fs.readFileSync(frontendEnvPath, 'utf8');
  }
  function setLine(content, key, value) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      return content.replace(regex, `${key}=${value}`);
    } else {
      return content + `\n${key}=${value}`;
    }
  }

  env = setLine(env, 'VITE_TOKEN_ADDRESS', token);
  env = setLine(env, 'VITE_FAUCET_ADDRESS', faucet);

  fs.writeFileSync(frontendEnvPath, env);
  console.log('Updated frontend .env with:');
  console.log('VITE_TOKEN_ADDRESS=', token);
  console.log('VITE_FAUCET_ADDRESS=', faucet);
}

main();
