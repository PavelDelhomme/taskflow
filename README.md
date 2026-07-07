# TaskFlow Pro - Architecture Modulaire

TaskFlow Pro est un gestionnaire de tâches optimisé pour le TDAH, développé avec une architecture modulaire comprenant :

- **taskflow-api** : API REST développée avec FastAPI
- **taskflow-web** : Application web Next.js + Material-UI
- **taskflow-flutter** : Application mobile Flutter

## 🏗️ Architecture

```
taskflow/
├── taskflow-api/          # API FastAPI
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── database.py
│   ├── routers/
│   └── requirements.txt
├── taskflow-web/          # Application Web Next.js
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   ├── package.json
│   └── next.config.js
├── taskflow-flutter/      # Application Mobile Flutter
│   ├── lib/
│   │   ├── models/
│   │   ├── services/
│   │   ├── screens/
│   │   └── providers/
│   └── pubspec.yaml
└── docker-compose.yml     # Configuration Docker
```

## 🚀 Démarrage Rapide

### Prérequis

- Docker et Docker Compose
- Node.js 18+ (pour le développement local)
- Python 3.11+ (pour le développement local)
- Flutter SDK (pour l'application mobile)

### Démarrage avec Docker

1. **Cloner le projet**
   ```bash
   git clone git@github.com:PavelDelhomme/taskflow.git
   cd taskflow
   ```

2. **Configurer l'environnement**
   ```bash
   make init
   # Modifier .env si nécessaire
   ```

3. **Démarrer tous les services**
   ```bash
   make up
   make status-watch   # surveillance conteneurs taskflow-* (Ctrl+C pour quitter)
   ```

4. **Accéder aux applications**
   - Application Web : http://localhost:4000
   - API FastAPI : http://localhost:4001
   - Documentation API : http://localhost:4001/docs
   - Base de données PostgreSQL : localhost:4002

### Développement Local

#### API FastAPI

```bash
cd taskflow-api
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Application Web Next.js

```bash
cd taskflow-web
npm install
npm run dev
```

#### Application Mobile Flutter

```bash
cd taskflow-flutter
flutter pub get
flutter run
```

## 📱 Fonctionnalités

### API FastAPI (taskflow-api)
- ✅ Authentification JWT
- ✅ Gestion des utilisateurs
- ✅ CRUD des tâches
- ✅ Résumés quotidiens
- ✅ Documentation automatique (Swagger)
- ✅ Validation des données avec Pydantic
- ✅ Base de données PostgreSQL
- ✅ Cache Redis

### Application Web (taskflow-web)
- ✅ Interface moderne avec Material-UI
- ✅ Gestion des tâches en temps réel
- ✅ Authentification
- ✅ Responsive design
- ✅ Optimisé pour le TDAH

### Application Mobile (taskflow-flutter)
- ✅ Interface native
- ✅ Gestion des tâches
- ✅ Synchronisation avec l'API
- ✅ Notifications locales
- ✅ Optimisé pour le TDAH

## 🔧 Configuration

### Variables d'environnement

Copiez `env.example` vers `.env` et configurez :

```env
# Base de données
DATABASE_URL=postgresql://taskflow:taskflow@localhost:5432/taskflow

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Sécurité
SECRET_KEY=your-secret-key-here

# API
API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Base de données

Les migrations sont automatiques au démarrage de l'API FastAPI.

## 🧪 Tests

### API
```bash
cd taskflow-api
pytest
```

### Application Web
```bash
cd taskflow-web
npm test
```

### Application Mobile
```bash
cd taskflow-flutter
flutter test
```

## 📦 Déploiement

### Production (Portainer + Nginx Proxy Manager)

Guide complet : [`deploy/portainer/PORTAINER-STACK.md`](deploy/portainer/PORTAINER-STACK.md) · [`docs/DEPLOIEMENT.md`](docs/DEPLOIEMENT.md)

```bash
make secrets-print    # secrets → Portainer ou .env
make deploy-prod        # test local prod
make up-preprod         # staging local (ports 401x)
make status-watch
```

### Commandes utiles

| Commande | Description |
|----------|-------------|
| `make status` | Statut détaillé (conteneurs `taskflow-*` uniquement) |
| `make status-watch` | Rafraîchissement en boucle (comme JobbingTrack) |
| `make upgrade-prod` | Rebuild + redéploiement production |
| `make mobile-release` | Build APK Flutter (voir `taskflow-mobile/`) |

### CI/CD

- **GitHub Actions** : build images GHCR + webhook Portainer sur `main`
- **Mobile** : tag `mobile-v*` → APK artifact

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation de l'API : http://localhost:8000/docs
- Vérifiez les logs : `docker-compose logs`

## 🎯 Roadmap

- [ ] Notifications push
- [ ] Synchronisation hors ligne
- [ ] Analytics et rapports
- [ ] Intégration calendrier
- [ ] Mode sombre
- [ ] Widgets personnalisés
- [ ] Export/Import des données
