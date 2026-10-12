FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

RUN wget -qO /etc/ssl/certs/rds-global-bundle.pem \
    https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .
USER node

EXPOSE 4000
CMD ["npm", "start"]
