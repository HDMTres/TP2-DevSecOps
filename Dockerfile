# Dockerfile VOLONTAIREMENT VULNÉRABLE pour Étape 8
FROM node:18.0.0-alpine3.14

WORKDIR /app

# Créer un utilisateur non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copier les dépendances et installer
COPY --chown=appuser:appgroup package*.json ./
RUN npm install --only=production

# Copier le code applicatif
COPY --chown=appuser:appgroup . .

# Basculer vers utilisateur non-privilégié
USER appuser

EXPOSE 3000
CMD ["node", "src/index.js"]
