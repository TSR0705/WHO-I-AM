# Use official Node.js LTS image
FROM node:18-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
