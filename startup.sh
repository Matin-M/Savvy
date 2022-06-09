git pull origin main
npm install --only=production
pm2 start ecosystem.config.js