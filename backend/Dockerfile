FROM node:20-slim
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
# Install all dependencies (including typescript and ts-node)
RUN npm install
RUN npx prisma generate
COPY . .
EXPOSE 3000
CMD ["npx", "ts-node", "src/index.ts"]
