FROM node:18.14.2-alpine3.17
WORKDIR /
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm ci
#RUN npm install pm2 -g
RUN npm run build
COPY . .
CMD ["node", "bin/index.js"]