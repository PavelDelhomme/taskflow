// Filtre les logs Fast Refresh verbeux de la console
if (typeof window !== 'undefined') {
  const originalLog = console.log
  const originalInfo = console.info
  
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
}

