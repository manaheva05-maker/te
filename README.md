# SHINKEN ⛩️

Anime Quiz Battle Platform — React Native + Node.js + MongoDB

## Structure

```
shinken/
├── src/                    # Backend (Express + Socket.IO)
│   ├── config/db.js
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── socket/
│   ├── jobs/
│   └── app.js              ← Point d'entrée
├── client/                 # Frontend React Native
│   ├── components/svg/     ← Tous les SVG icons
│   ├── constants/          ← Colors, ranks (sans emoji)
│   ├── context/
│   ├── navigation/
│   ├── screens/
│   ├── services/api.js     ← API + Socket unifiés
│   └── i18n/
├── App.js                  ← Entry React Native
├── package.json            ← UN SEUL package.json
├── .env.example
├── render.yaml
├── railway.toml
├── Procfile
├── Dockerfile
└── capacitor.config.js
```

## Démarrer

```bash
# 1. Cloner
git clone https://github.com/ton-user/shinken.git
cd shinken

# 2. Installer
npm install

# 3. Configurer
cp .env.example .env
nano .env   # Remplis MONGODB_URI, JWT_SECRET, etc.

# 4. Lancer
npm start          # Production
npm run dev        # Développement (nodemon)
```

## Variables .env

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `PORT` | Port du serveur (défaut: 3000) | Non |
| `APP_URL` | URL publique — utilisé pour emails, deep links | Oui |
| `MONGODB_URI` | URI MongoDB Atlas | Oui |
| `JWT_SECRET` | Secret JWT (32+ chars) | Oui |
| `JWT_REFRESH_SECRET` | Secret refresh token | Oui |
| `SMTP_USER` | Email Gmail | Oui |
| `SMTP_PASS` | App password Gmail | Oui |
| `EMAIL_FROM` | Expéditeur emails | Oui |
| `ADMIN_EMAIL` | Email admin initial | Oui |
| `ADMIN_PASSWORD` | Password admin initial | Oui |
| `CLOUDINARY_*` | Upload images (optionnel) | Non |
| `AGORA_*` | Live streaming (optionnel) | Non |
| `OPENAI_API_KEY` | IA questions (optionnel) | Non |

## Déploiement

### Render (recommandé)
1. Push sur GitHub
2. render.com → New Web Service → repo GitHub
3. Build: `npm install` | Start: `npm start`
4. Root directory: `.` (racine)
5. Add env vars depuis `.env.example`
6. `APP_URL` = ton URL Render ex: `https://shinken.onrender.com`

### Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway up
# Ajoute les env vars dans le dashboard Railway
```

### Heroku
```bash
heroku create shinken-app
heroku config:set MONGODB_URI=... JWT_SECRET=... APP_URL=https://shinken-app.herokuapp.com
git push heroku main
```

## APK Android (GitHub Actions)

### Secrets GitHub à configurer
```
ANDROID_KEYSTORE_BASE64  → base64 du fichier .jks
KEYSTORE_PASSWORD        → mot de passe keystore
KEY_ALIAS                → alias de la clé
KEY_PASSWORD             → mot de passe de la clé
```

### Générer le keystore
```bash
keytool -genkey -v -keystore shinken.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias shinken

# Encoder pour GitHub Secrets
base64 -i shinken.jks | tr -d '\n'
```

### Déclencher le build
- **Automatique** : chaque push sur `main` qui modifie `client/` ou `App.js`
- **Manuel** : Actions → Build Android APK → Run workflow → cocher "Create Release"
- **APK signé** : créer un tag `v1.0.0` → build release automatique

## Gmail SMTP — App Password
1. Google Account → Sécurité → Validation en 2 étapes (activer)
2. Sécurité → Mots de passe des applications
3. Sélectionner "Mail" et "Autre" → donner le nom "SHINKEN"
4. Copier le mot de passe généré → `SMTP_PASS`

## APP_URL — Pourquoi c'est important
`APP_URL` est utilisé pour :
- Les liens dans les emails (vérification, reset password)
- Les deep links WhatsApp/partage de profil
- Les invitations de clan
- CORS (autoriser les requêtes depuis cette URL)

## Architecture Socket.IO
- `duel.socket.v2.js` — Duels temps réel
- `live.socket.js` — Live stream + cadeaux
- `clan.socket.js` — Chat clan
