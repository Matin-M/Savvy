docker-compose rm -s -v savvy-bot-1
git pull origin main
docker-compose up -d --force-recreate --build savvy-bot-1