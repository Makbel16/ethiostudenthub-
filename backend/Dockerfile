FROM node:20-alpine
# Prisma's query engine needs OpenSSL, which isn't included in the slim alpine image
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["npm", "run", "start"]