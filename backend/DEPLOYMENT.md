# 🚀 Guide de Déploiement - MagFlow Backend

## 📋 Pré-requis

### Serveur
- Node.js 18+
- npm ou yarn
- 2GB RAM minimum
- 10GB espace disque

### Services Externes
- ✅ Compte Supabase (base de données)
- ✅ Compte OpenAI (API key)
- ✅ Serveur Flask déployé (génération InDesign)

---

## 🔧 Étape 1 : Préparation

### 1.1 Cloner le projet
```bash
git clone https://github.com/your-repo/magflow.git
cd magflow/backend
```

### 1.2 Installer les dépendances
```bash
npm install --production
```

### 1.3 Configuration
```bash
# Copier le fichier d'exemple
cp .env.production.example .env.production

# Éditer avec vos valeurs
nano .env.production
```

**Variables critiques à configurer :**
```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
FLASK_API_URL=...
```

---

## 🗄️ Étape 2 : Base de Données

### 2.1 Initialiser Supabase
```bash
# Se connecter à Supabase Dashboard
# SQL Editor → Exécuter supabase-schema.sql
```

### 2.2 Vérifier les données
```sql
-- Vérifier les templates
SELECT COUNT(*) FROM indesign_templates WHERE is_active = true;

-- Doit retourner au moins 3 templates
```

---

## 🏗️ Étape 3 : Build & Test

### 3.1 Build (si TypeScript)
```bash
npm run build
```

### 3.2 Tests
```bash
# Tests unitaires
npm test

# Vérifier la connexion aux services
node scripts/test-connections.js
```

---

## 🚀 Étape 4 : Déploiement

### Option A : PM2 (Recommandé)

```bash
# Installer PM2 globalement
npm install -g pm2

# Démarrer l'application
pm2 start server.js --name magflow-backend

# Configuration PM2
pm2 startup
pm2 save

# Monitoring
pm2 monit
pm2 logs magflow-backend
```

**Configuration PM2** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'magflow-backend',
    script: 'server.js',
    instances: 2,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
```

### Option B : Docker

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
```

**Déploiement:**
```bash
# Build image
docker build -t magflow-backend .

# Run container
docker run -d \
  --name magflow-backend \
  -p 3001:3001 \
  --env-file .env.production \
  --restart unless-stopped \
  magflow-backend
```

### Option C : Service systemd

**Fichier** `/etc/systemd/system/magflow-backend.service`:
```ini
[Unit]
Description=MagFlow Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/magflow/backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production
EnvironmentFile=/var/www/magflow/backend/.env.production

[Install]
WantedBy=multi-user.target
```

**Commandes:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable magflow-backend
sudo systemctl start magflow-backend
sudo systemctl status magflow-backend
```

---

## 🔒 Étape 5 : Nginx (Reverse Proxy)

**Configuration** `/etc/nginx/sites-available/magflow-api`:
```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (no rate limit)
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
```

**Activer:**
```bash
sudo ln -s /etc/nginx/sites-available/magflow-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 Étape 6 : SSL/TLS (Let's Encrypt)

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir certificat
sudo certbot --nginx -d api.your-domain.com

# Auto-renouvellement (vérifie)
sudo certbot renew --dry-run
```

---

## 📊 Étape 7 : Monitoring

### 7.1 Health Check
```bash
# Script de monitoring (à mettre dans cron)
#!/bin/bash
HEALTH_URL="https://api.your-domain.com/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE != "200" ]; then
    echo "Backend DOWN!" | mail -s "MagFlow Backend Alert" admin@your-domain.com
    pm2 restart magflow-backend
fi
```

### 7.2 Logs
```bash
# PM2 logs
pm2 logs magflow-backend --lines 100

# Logs applicatifs
tail -f /var/log/magflow/backend.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 7.3 Metrics (optionnel)
```bash
# Installer PM2 monitoring
pm2 install pm2-server-monit

# Ou utiliser des services externes
# - Sentry (erreurs)
# - New Relic (performance)
# - Datadog (infra)
```

---

## 🔄 Étape 8 : Mises à Jour

### Déploiement Zero-Downtime
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Déploiement MagFlow Backend..."

# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm ci --production

# 3. Run tests
npm test || exit 1

# 4. Reload PM2 (zero downtime)
pm2 reload magflow-backend

# 5. Verify health
sleep 5
curl -f http://localhost:3001/health || pm2 restart magflow-backend

echo "✅ Déploiement terminé"
```

---

## 🆘 Dépannage

### Backend ne démarre pas
```bash
# Vérifier les logs
pm2 logs magflow-backend --err

# Vérifier la config
node -c server.js

# Vérifier les ports
sudo netstat -tulpn | grep 3001
```

### Erreur OpenAI
```bash
# Tester la clé API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Erreur Supabase
```bash
# Tester la connexion
node scripts/test-supabase.js
```

---

## 📋 Checklist Finale

- [ ] Backend démarre correctement
- [ ] Health check répond 200 OK
- [ ] Templates récupérés depuis Supabase (3+)
- [ ] Analyse OpenAI fonctionne
- [ ] Génération magazine fonctionne
- [ ] SSL/TLS configuré
- [ ] Nginx reverse proxy actif
- [ ] Monitoring configuré
- [ ] Logs accessibles
- [ ] Backups activés
- [ ] DNS configuré

---

## 🎉 Succès !

Votre backend est maintenant en production !

**URLs importantes:**
- API: https://api.your-domain.com
- Health: https://api.your-domain.com/health
- Docs: https://api.your-domain.com/docs (si activé)

**Monitoring:**
```bash
pm2 status
pm2 monit
curl https://api.your-domain.com/health
```

---

**Besoin d'aide ?** Consulter `TROUBLESHOOTING_GUIDE.md`
