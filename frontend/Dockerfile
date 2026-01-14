FROM node:20-alpine
WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN apk add --no-cache curl && npm install

# Build app
COPY . .
ARG VITE_RPC_URL
ARG VITE_TOKEN_ADDRESS
ARG VITE_FAUCET_ADDRESS
ENV VITE_RPC_URL=$VITE_RPC_URL
ENV VITE_TOKEN_ADDRESS=$VITE_TOKEN_ADDRESS
ENV VITE_FAUCET_ADDRESS=$VITE_FAUCET_ADDRESS
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "serve"]
