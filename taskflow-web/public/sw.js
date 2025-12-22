// Service Worker pour notifications push et en arrière-plan
const CACHE_NAME = 'taskflow-v1'
const NOTIFICATIONS_DB = 'taskflow-notifications'

// Installation du Service Worker
self.addEventListener('install', (event) => {
  // Log uniquement en mode développement (commenté pour réduire la verbosité)
  // console.log('TaskFlow SW installed')
  self.skipWaiting() // Activer immédiatement
})

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  // Log uniquement en mode développement (commenté pour réduire la verbosité)
  // console.log('TaskFlow SW activated')
  event.waitUntil(
    clients.claim() // Prendre le contrôle de toutes les pages
  )
})

// Gestion des notifications programmées
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { id, title, body, timestamp, icon, tag } = event.data
    scheduleNotification(id, title, body, timestamp, icon, tag)
  } else if (event.data && event.data.type === 'CANCEL_NOTIFICATION') {
    const { id } = event.data
    cancelScheduledNotification(id)
  } else if (event.data && event.data.type === 'SYNC_REMINDERS') {
    syncRemindersFromAPI()
  }
})

// Planifier une notification
async function scheduleNotification(id, title, body, timestamp, icon = '/favicon.ico', tag = 'taskflow-reminder') {
  const now = Date.now()
  const delay = timestamp - now
  
  if (delay <= 0) {
    // Notification immédiate
    showNotification(title, body, icon, tag)
    return
  }
  
  // Stocker la notification dans IndexedDB
  await storeNotification({
    id,
    title,
    body,
    timestamp,
    icon,
    tag
  })
  
  // Programmer la notification avec setTimeout
  setTimeout(() => {
    showNotification(title, body, icon, tag)
    removeNotification(id)
  }, delay)
  
  // Log uniquement en mode développement
  // console.log(`Notification programmée: ${title} dans ${Math.round(delay / 1000)}s`)
}

// Annuler une notification programmée
async function cancelScheduledNotification(id) {
  await removeNotification(id)
  // Log uniquement en mode développement (commenté pour réduire la verbosité)
  // console.log(`Notification annulée: ${id}`)
}

// Afficher une notification
function showNotification(title, body, icon = '/favicon.ico', tag = 'taskflow-reminder', data = {}) {
  const options = {
    body,
    icon,
    badge: icon,
    tag,
    data,
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Ouvrir'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  }
  
  return self.registration.showNotification(title, options)
}

// Gestion du clic sur une notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const action = event.action
  
  if (action === 'close') {
    return
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, la focus
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === '/' && 'focus' in client) {
          return client.focus()
        }
      }
      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})

// Synchronisation périodique des rappels depuis l'API
async function syncRemindersFromAPI() {
  try {
    // Récupérer le token depuis IndexedDB
    const token = await getStoredToken()
    if (!token) {
      // Pas de token encore, c'est normal au démarrage - ne pas logger
      return
    }
    
    const response = await fetch('http://localhost:4001/reminders/pending', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      // Erreur silencieuse, on réessayera plus tard
      return
    }
    
    const reminders = await response.json()
    
    // Programmer les notifications pour chaque rappel
    let scheduledCount = 0
    for (const reminder of reminders) {
      const reminderTime = new Date(reminder.reminder_time).getTime()
      const now = Date.now()
      
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
        scheduledCount++
      }
    }
    
    // Log uniquement si des rappels ont été programmés (commenté pour réduire la verbosité)
    // if (scheduledCount > 0) {
    //   console.log(`${scheduledCount} rappel(s) programmé(s)`)
    // }
  } catch (error) {
    // Erreur silencieuse, on réessayera plus tard
    // console.error('Erreur lors de la synchronisation:', error)
  }
}

// Vérification périodique des notifications programmées
setInterval(async () => {
  const notifications = await getAllNotifications()
  const now = Date.now()
  
  for (const notification of notifications) {
    if (notification.timestamp <= now) {
      // Notification due, l'afficher
      showNotification(
        notification.title,
        notification.body,
        notification.icon,
        notification.tag
      )
      await removeNotification(notification.id)
    }
  }
}, 60000) // Vérifier toutes les minutes

// Background Sync pour synchroniser les rappels
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reminders') {
    event.waitUntil(syncRemindersFromAPI())
  }
})

// Periodic Background Sync (si supporté)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodic sync', (event) => {
    if (event.tag === 'sync-reminders-periodic') {
      event.waitUntil(syncRemindersFromAPI())
    }
  })
}

// Gestion de IndexedDB pour stocker les notifications
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NOTIFICATIONS_DB, 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('notifications')) {
        db.createObjectStore('notifications', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('token')) {
        db.createObjectStore('token', { keyPath: 'id' })
      }
    }
  })
}

async function storeNotification(notification) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['notifications'], 'readwrite')
    const store = transaction.objectStore('notifications')
    const request = store.put(notification)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function removeNotification(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['notifications'], 'readwrite')
    const store = transaction.objectStore('notifications')
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function getAllNotifications() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['notifications'], 'readonly')
    const store = transaction.objectStore('notifications')
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

async function storeToken(token) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['token'], 'readwrite')
    const store = transaction.objectStore('token')
    const request = store.put({ id: 'auth', token })
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function getStoredToken() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['token'], 'readonly')
    const store = transaction.objectStore('token')
    const request = store.get('auth')
    request.onsuccess = () => {
      const result = request.result
      resolve(result ? result.token : null)
    }
    request.onerror = () => reject(request.error)
  })
}

// Écouter les messages pour stocker le token
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'STORE_TOKEN') {
    storeToken(event.data.token)
  }
})
