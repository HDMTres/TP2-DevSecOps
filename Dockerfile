# Dockerfile de test (volontairement vulnérable pour l'exercice)
# NE PAS utiliser en production !
# Version ancienne intentionnelle = CVE CRITICAL attendues
FROM node:18.0.0-alpine3.14

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]

# À corriger dans l'exercice 5.4 :
# FROM node:20-alpine3.19
# RUN adduser --no-create-home appuser
# USER appuser
