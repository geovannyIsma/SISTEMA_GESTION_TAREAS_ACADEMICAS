FROM node:18-alpine

WORKDIR /app

# This is just a placeholder for future backend containerization
# Currently only the database is being dockerized as requested
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
