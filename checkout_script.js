import { execSync } from 'child_process';
execSync('git log -1', { stdio: 'inherit' });
try {
  execSync('git reset --hard', { stdio: 'inherit' });
  console.log("Reset successful");
} catch(e) {
  console.log("Reset failed", e);
}
