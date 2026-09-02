FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --prefer-offline --no-audit || npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
