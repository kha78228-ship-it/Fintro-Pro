import { execSync } from 'child_process';
execSync('git checkout src/App.tsx', { stdio: 'inherit' });
console.log("Checkout done.");
