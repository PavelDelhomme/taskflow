// Filtre les logs Fast Refresh verbeux et les erreurs de reconnaissance vocale
if (typeof window !== 'undefined') {
  const originalLog = console.log
  const originalInfo = console.info
  const originalError = console.error
  
  console.log = (...args: any[]) => {
    const message = args[0]?.toString() || ''
    // Ignorer les logs Fast Refresh
    if (!message.includes('[Fast Refresh]')) {
      originalLog(...args)
    }
  }
  
  console.info = (...args: any[]) => {
    const message = args[0]?.toString() || ''
    // Ignorer les logs Fast Refresh
    if (!message.includes('[Fast Refresh]')) {
      originalInfo(...args)
    }
  }
  
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || ''
    // Ignorer les erreurs de reconnaissance vocale (gérées par le modal)
    if (!message.includes('Erreur de reconnaissance vocale') && 
        !message.includes('reconnaissance vocale') &&
        !message.includes('recognition.onerror')) {
      originalError(...args)
    }
  }
}

