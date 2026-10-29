FROM node:22-alpine
WORKDIR /app
COPY deploy/package.json package.json
RUN npm install --omit=dev --no-audit --no-fund
COPY server/arena.js server/app.js server/node.js server/mail.js server/logo.png server/
COPY src/config.js src/blocks.js src/online.js src/ai.js src/nickname.js src/brand.js src/
COPY src/world/ src/world/
ENV HOST=0.0.0.0 PORT=8787 ARENA_DATA=/data NODE_ENV=production
EXPOSE 8787
CMD ["node", "server/node.js"]
