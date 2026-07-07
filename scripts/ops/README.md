# Scripts ops TaskFlow

| Script | Usage |
|--------|--------|
| `status-print.sh` | Statut détaillé conteneurs `taskflow-*` (appelé par `make status`) |
| `status-watch-loop.sh` | Boucle watch (`make status-watch` / `status-live`) |

Variables utiles :

- `STATUS_LEGEND=1` — légende des ports
- `INTERVAL=4` — intervalle watch (min 4s)
- `ALTSCREEN=1` — buffer terminal alternatif (défaut)
- `CLEAR=1` + `ALTSCREEN=0` — clear classique plein écran
- `STATUS_FOLD=0` — désactiver le pliage des lignes longues
