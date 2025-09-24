# Initialisation du module routes
# Ce fichier permet d'importer les sous-modules de routes

from . import auth, tasks, reports, workflows

__all__ = ['auth', 'tasks', 'reports', 'workflows']