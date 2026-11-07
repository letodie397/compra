import { execSync } from 'node:child_process'

process.env.VITE_BASE_PATH = '/compra/'

execSync('tsc -b && vite build', {
  stdio: 'inherit',
  env: process.env,
  shell: true,
})
