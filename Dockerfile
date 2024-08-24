FROM node:18.20.4
RUN apt-get update && apt-get install -y ffmpeg
WORKDIR /
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm install
RUN npm run build
CMD ["node", "bin/index.js"]