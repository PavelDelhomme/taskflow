// Service Worker pour notifications push
self.addEventListener('install', (event) => {
    console.log('TaskFlow SW installed')
  })
  
  self.addEventListener('activate', (event) => {
    console.log('TaskFlow SW activated')
  })
  
  self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus()
        }
        return clients.openWindow('/')
      })
    )
  })
  