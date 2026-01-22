FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"

RUN npx prisma generate

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:server"]