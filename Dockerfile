# Dockerfile sécurisé - Version corrigée (Exercice 5.4)
FROM node:20-alpine3.19

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
