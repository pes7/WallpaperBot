 FROM node:15-alpine
 WORKDIR /
 COPY . .
 RUN yarn install --production
 CMD ["node", "bot.js"]