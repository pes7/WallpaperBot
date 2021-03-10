 FROM node:15-alpine
 WORKDIR /WallpaperBot
 COPY . .
 RUN yarn install --production
 CMD ["node", "bot.js"]