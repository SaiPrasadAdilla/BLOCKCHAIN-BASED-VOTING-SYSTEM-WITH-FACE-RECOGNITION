FROM node:20-bullseye AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:20-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/models ./models

RUN mkdir -p /app/assets/voters/faces /app/assets/voters/documents

ENV NODE_ENV=production
ENV PORT=3000
ENV TF_CPP_MIN_LOG_LEVEL=3

EXPOSE 3000 3001 3002

CMD ["node", "dist/main.js"]