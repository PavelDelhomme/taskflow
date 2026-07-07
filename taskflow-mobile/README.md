# TaskFlow Mobile (Flutter)

Application mobile compagnon de TaskFlow — synchronisation avec l’API (`taskflow-api`), même compte que le web.

> **État** : le dépôt Flutter sera ajouté ici (`taskflow-mobile/`). Les commandes Make et la CI sont déjà préparées.

## Prérequis

- Flutter SDK 3.x (`flutter doctor`)
- Android SDK (APK) / Xcode (iOS, macOS uniquement)
- API TaskFlow accessible (dev : `http://<IP_LAN>:4001`, prod : `https://api.taskflow.delhomme.ovh`)

## Configuration API

Créer `taskflow-mobile/.env` ou utiliser `--dart-define` :

```bash
# Dev LAN (téléphone sur le même réseau)
flutter run --dart-define=API_URL=http://192.168.1.x:4001

# Production
flutter run --dart-define=API_URL=https://api.taskflow.delhomme.ovh
```

## Build & déploiement

```bash
# Debug (tests internes)
make mobile-build
# → taskflow-mobile/build/app/outputs/flutter-apk/app-debug.apk

# Release (distribution)
make mobile-release
# → taskflow-mobile/build/app/outputs/flutter-apk/app-release.apk
```

### Mise à jour de l’app installée

1. Incrémenter `version` dans `pubspec.yaml` (`1.2.3+45`).
2. `make mobile-release`
3. Distribuer l’APK (side-load, Firebase App Distribution, ou Play Store).

### CI (GitHub Actions)

Le workflow `.github/workflows/mobile-build.yml` build l’APK release sur tag `mobile-v*` et publie l’artifact.

## Intégrations

L’app mobile utilisera les mêmes endpoints que le web :

- Auth JWT (`/auth/login`, `/auth/register`)
- CRUD tâches (`/tasks`)
- Workflows, rappels, stats TDAH

Sync Google Tasks / Cloudity passera par l’API (pas de secrets OAuth dans l’app mobile).

## Structure cible

```
taskflow-mobile/
├── lib/
│   ├── main.dart
│   ├── config/api_config.dart
│   ├── services/task_service.dart
│   └── screens/
├── pubspec.yaml
└── .env.example
```

## Prochaines étapes

1. Initialiser le projet : `flutter create --org ovh.delhomme taskflow-mobile`
2. Brancher `API_URL` via `--dart-define`
3. Écrans : login, liste tâches, détail, création rapide
4. Notifications locales pour rappels TDAH
