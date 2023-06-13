FROM node:18.14.2-alpine3.17
RUN apk update && apk add ffmpeg
WORKDIR /
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm install
RUN npm rebuild
RUN npm run build
COPY . .
CMD ["node", "bin/index.js"]