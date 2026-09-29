FROM node:22-alpine
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev
COPY index.html ./
COPY backend/src ./backend/src
ENV NODE_ENV=production PORT=3000 DB_PATH=/data/ledger.db
RUN mkdir -p /data && chown node:node /data
VOLUME /data
EXPOSE 3000
USER node
CMD ["node", "--disable-warning=ExperimentalWarning", "backend/src/server.js"]
