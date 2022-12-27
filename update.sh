git pull origin main
npm ci 
rm -r bin 
npm run build
pm2 restart Savvy