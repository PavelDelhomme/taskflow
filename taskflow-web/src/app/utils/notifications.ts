// Utilitaires pour gérer les notifications push en arrière-plan

const SW_PATH = '/sw.js'
const SW_SCOPE = '/'

export interface ScheduledNotification {
  id: string
  title: string
  body: string
  timestamp: number
  icon?: string
  tag?: string
}

// Enregistrer le Service Worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers non supportés')
    return null
  }

  try {
    // Vérifier si le Service Worker est déjà enregistré
    const existingRegistration = await navigator.serviceWorker.getRegistration(SW_SCOPE)
    if (existingRegistration) {
      // Service Worker déjà enregistré, attendre qu'il soit prêt
      await navigator.serviceWorker.ready
      return existingRegistration
    }
    
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: SW_SCOPE
    })
    
    // Log uniquement en mode développement
    if (process.env.NODE_ENV === 'development') {
      console.log('Service Worker enregistré:', registration.scope)
    }
    
    // Attendre que le Service Worker soit actif
    await navigator.serviceWorker.ready
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Service Worker prêt')
    }
    
    return registration
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du Service Worker:', error)
    return null
  }
}

// Demander la permission pour les notifications
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Notifications non supportées')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    console.warn('Permission de notification refusée')
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

// Programmer une notification (fonctionne même si l'app est fermée)
export async function scheduleNotification(
  id: string,
  title: string,
  body: string,
  timestamp: number | Date,
  icon: string = '/favicon.ico',
  tag: string = 'taskflow-reminder'
): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker non disponible, notification immédiate')
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon, tag })
    }
    return false
  }

  const registration = await navigator.serviceWorker.ready
  const timestampMs = timestamp instanceof Date ? timestamp.getTime() : timestamp

  // Envoyer le message au Service Worker
  registration.active?.postMessage({
    type: 'SCHEDULE_NOTIFICATION',
    id,
    title,
    body,
    timestamp: timestampMs,
    icon,
    tag
  })

  console.log(`Notification programmée: ${title} à ${new Date(timestampMs).toLocaleString()}`)
  return true
}

// Annuler une notification programmée
export async function cancelScheduledNotification(id: string): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return
  }

  const registration = await navigator.serviceWorker.ready
  registration.active?.postMessage({
    type: 'CANCEL_NOTIFICATION',
    id
  })
}

// Envoyer une notification immédiate
export function sendNotification(
  title: string,
  body: string,
  options: NotificationOptions = {}
): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.warn('Notifications non disponibles ou permission refusée')
    return
  }

  new Notification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'taskflow-reminder',
    ...options
  })
}

// Stocker le token d'authentification dans le Service Worker
export async function storeAuthTokenInSW(token: string): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return
  }

  const registration = await navigator.serviceWorker.ready
  registration.active?.postMessage({
    type: 'STORE_TOKEN',
    token
  })
}

// Synchroniser les rappels depuis l'API
export async function syncRemindersFromAPI(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return
  }

  const registration = await navigator.serviceWorker.ready
  
  // Utiliser Background Sync si disponible (optionnel, ne pas afficher d'erreur si indisponible)
  if ('sync' in registration) {
    try {
      await (registration as any).sync.register('sync-reminders')
      // Log silencieux en mode développement uniquement
      if (process.env.NODE_ENV === 'development') {
        console.log('Background Sync enregistré pour synchroniser les rappels')
      }
    } catch (error: any) {
      // Background Sync n'est pas toujours disponible (nécessite HTTPS ou localhost avec certaines conditions)
      // C'est normal, on continue sans
      if (process.env.NODE_ENV === 'development' && error.name !== 'NotAllowedError') {
        console.warn('Background Sync non disponible:', error.message)
      }
    }
  }

  // Envoyer un message direct au Service Worker (fonctionne toujours)
  if (registration.active) {
    registration.active.postMessage({
      type: 'SYNC_REMINDERS'
    })
  }
}

// Programmer des notifications pour tous les rappels en attente
export async function scheduleRemindersNotifications(
  reminders: any[],
  apiUrl: string
): Promise<void> {
  const now = Date.now()

  for (const reminder of reminders) {
    const reminderTime = new Date(reminder.reminder_time).getTime()
    
    // Ne programmer que les rappels futurs
    if (reminderTime > now) {
      const title = reminder.task_id ? '🔔 Rappel de tâche' : '🔔 Rappel'
      const body = reminder.task_id 
        ? `Vous avez un rappel pour une tâche`
        : 'Vous avez un rappel'

      await scheduleNotification(
        `reminder-${reminder.id}`,
        title,
        body,
        reminderTime,
        '/favicon.ico',
        `reminder-${reminder.id}`
      )
    }
  }
}

// Initialiser le système de notifications
export async function initNotificationSystem(): Promise<{
  swRegistered: boolean
  permissionGranted: boolean
}> {
  const swRegistered = await registerServiceWorker() !== null
  const permissionGranted = await requestNotificationPermission()

  // Log uniquement en mode développement
  if (process.env.NODE_ENV === 'development' && swRegistered && permissionGranted) {
    console.log('✅ Système de notifications en arrière-plan activé')
  }

  return { swRegistered, permissionGranted }
}

