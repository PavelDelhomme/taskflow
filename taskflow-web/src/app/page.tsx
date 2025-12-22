'use client'

import { useState, useEffect, useMemo } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import './utils/filterConsoleLogs'
import AuthPage from './components/AuthPage'
import CalendarView from './components/CalendarView'
import { User, Task, Workflow, AuthPageProps } from './types'
import {
  initNotificationSystem,
  scheduleNotification,
  scheduleRemindersNotifications,
  storeAuthTokenInSW,
  syncRemindersFromAPI,
  sendNotification as sendNotificationUtil
} from './utils/notifications'

export default function TaskflowPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [token, setToken] = useState<string>('')
  const [user, setUser] = useState<User | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDailyModal, setShowDailyModal] = useState(false)
  const [showWeeklyModal, setShowWeeklyModal] = useState(false)
  const [showWorkflowModal, setShowWorkflowModal] = useState(false)
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [dailySummary, setDailySummary] = useState('')
  const [weeklySummary, setWeeklySummary] = useState('')
  const [reminderMessage, setReminderMessage] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [fabOpen, setFabOpen] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showTaskActions, setShowTaskActions] = useState<{[key: number]: boolean}>({})
  const [fabCategory, setFabCategory] = useState<string | null>(null)
  const [taskSearchQuery, setTaskSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showCreateWorkflowModal, setShowCreateWorkflowModal] = useState(false)
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false)
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [showBlockReasonModal, setShowBlockReasonModal] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [taskToBlock, setTaskToBlock] = useState<Task | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{type: string, task: Task, message: string} | null>(null)
  const [showTrashModal, setShowTrashModal] = useState(false)
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([])
  const [columnStates, setColumnStates] = useState<{[key: string]: boolean}>({
    in_progress: true,
    todo: true,
    standby: true,
    blocked: true,
    review: true,
    done: true
  })
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showAllTasks, setShowAllTasks] = useState<{[key: string]: boolean}>({
    in_progress: false,
    todo: false,
    standby: false,
    blocked: false,
    review: false,
    done: false
  })
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    steps: '',
    category: 'dev',
    project: ''
  })
  const [workflowSteps, setWorkflowSteps] = useState<string[]>([''])
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null)
  
  // 👁️ États pour show/hide password
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })
  
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: ''
  })
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    trello_id: '',
    due_date: '',
    project: '',
    estimated_time_minutes: null as number | null
  })
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [showProjectView, setShowProjectView] = useState(false)
  const [currentActivity, setCurrentActivity] = useState<any>(null)
  const [showCurrentActivityModal, setShowCurrentActivityModal] = useState(false)
  const [availableProjects, setAvailableProjects] = useState<string[]>([])
  const [projectSuggestions, setProjectSuggestions] = useState<string[]>([])
  const [showProjectSuggestions, setShowProjectSuggestions] = useState(false)
  
  // Time Awareness
  const [timeComparisonStats, setTimeComparisonStats] = useState<any[]>([])
  const [showTimeAwarenessModal, setShowTimeAwarenessModal] = useState(false)
  
  // Templates
  const [templates, setTemplates] = useState<any[]>([])
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  
  // Breakdown/Subtasks
  const [subtasks, setSubtasks] = useState<{[taskId: number]: any[]}>({})
  const [showBreakdownModal, setShowBreakdownModal] = useState(false)
  const [taskToBreakdown, setTaskToBreakdown] = useState<Task | null>(null)
  const [breakdownSteps, setBreakdownSteps] = useState<string[]>([''])
  
  // Tags
  const [tags, setTags] = useState<any[]>([])
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [showTagsModal, setShowTagsModal] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#6B7280')
  
  // Notes/Brain Dump
  const [notes, setNotes] = useState<any[]>([])
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [showBrainDumpModal, setShowBrainDumpModal] = useState(false)
  const [brainDumpContent, setBrainDumpContent] = useState('')
  
  // Stats
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [showStatsModal, setShowStatsModal] = useState(false)
  
  // Pauses
  const [activeBreak, setActiveBreak] = useState<any>(null)
  const [showBreaksModal, setShowBreaksModal] = useState(false)
  const [breakType, setBreakType] = useState('short')
  
  // Energy
  const [energyLevel, setEnergyLevel] = useState<number | null>(null)
  const [showEnergyModal, setShowEnergyModal] = useState(false)
  const [energyLogs, setEnergyLogs] = useState<any[]>([])
  
  // Rappels
  const [pendingReminders, setPendingReminders] = useState<any[]>([])
  const [showRemindersModal, setShowRemindersModal] = useState(false)
  
  // Visualisation temporelle
  const [showTimelineModal, setShowTimelineModal] = useState(false)
  
  // Commandes vocales
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [isListening, setIsListening] = useState(false)
  const [voiceCommandText, setVoiceCommandText] = useState('')
  const [showVoiceHelpModal, setShowVoiceHelpModal] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [voiceAudioFeedback, setVoiceAudioFeedback] = useState(true) // Feedback audio activé par défaut
  const [showVoiceErrorModal, setShowVoiceErrorModal] = useState(false)
  const [voiceErrorDetails, setVoiceErrorDetails] = useState<{title: string, message: string, action?: string} | null>(null)
  
  // 🧠 Mécanisme d'attention intelligent (tracking en arrière-plan pour l'IA)
  const [currentFocusTask, setCurrentFocusTask] = useState<number | null>(null)
  const [focusStartTime, setFocusStartTime] = useState<Date | null>(null)
  const [taskSwitchCount, setTaskSwitchCount] = useState(0)
  const [lastTaskChangeTime, setLastTaskChangeTime] = useState<Date | null>(null)

  // Utiliser une variable d'environnement ou une valeur par défaut
  const API_URL = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) 
    ? process.env.NEXT_PUBLIC_API_URL 
    : 'http://localhost:4001'

  useEffect(() => {
    // Ajouter les styles CSS personnalisés
    const style = document.createElement('style')
    style.textContent = `
      /* Placeholders visibles en mode sombre */
      .bg-dark input::placeholder,
      .bg-dark textarea::placeholder {
        color: #adb5bd !important;
        opacity: 1;
      }
      
      input::placeholder,
      textarea::placeholder {
        color: #6c757d !important;
        opacity: 1;
      }
      
      .form-control:focus {
        border-color: #0d6efd;
        box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
      }
      
      .bg-dark .form-control:focus {
        border-color: #0d6efd;
        box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
        background-color: #343a40;
        color: white;
      }
      
      .bg-dark .form-select {
        background-color: #343a40;
        border-color: #495057;
        color: white;
      }
      
      .bg-dark .form-select option {
        background-color: #343a40;
        color: white;
      }
      
      .card {
        border-radius: 10px;
      }
      
      .btn {
        border-radius: 6px;
      }
      
      /* Style pour bouton show/hide password */
      .password-toggle {
        position: relative;
      }
      
      .password-toggle-btn {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #6c757d;
        cursor: pointer;
        z-index: 3;
      }
      
      .bg-dark .password-toggle-btn {
        color: #adb5bd;
      }
      
      .password-toggle-btn:hover {
        color: #0d6efd;
      }
    `
    document.head.appendChild(style)

    const savedToken = localStorage.getItem('token')
    const storedColumnStates = localStorage.getItem('columnStates')
    
    if (storedColumnStates) {
      try {
        setColumnStates(JSON.parse(storedColumnStates))
      } catch (e) {
        console.error('Error parsing columnStates from localStorage:', e)
      }
    }
    
    let interval: ReturnType<typeof setInterval> | null = null
    
    // Vérifier que le token existe et n'est pas vide
    if (savedToken && savedToken.trim() !== '') {
      setToken(savedToken)
      setIsLoggedIn(true)
      fetchTasks(savedToken)
      fetchWorkflows(savedToken)
      checkForReminders(savedToken)
      
      // Initialiser le système de notifications (Service Worker + permissions)
      initNotifications().then(async () => {
        // Stocker le token dans le Service Worker pour les notifications en arrière-plan
        await storeAuthTokenInSW(savedToken)
        
        // Attendre un peu pour s'assurer que le token est bien stocké
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Synchroniser les rappels avec le Service Worker
        await syncRemindersFromAPI()
      })
      
      // Charger les données des nouvelles fonctionnalités
      fetchTemplates()
      fetchTags()
      fetchNotes()
      fetchDashboardStats()
      fetchBreaks()
      fetchEnergyData()
      fetchTimeComparisonStats()
      createAutoReminders()
      fetchPendingReminders()
      
      // Vérifier les rappels toutes les minutes
      const reminderInterval = setInterval(() => {
        if (savedToken) {
          fetchPendingReminders()
        }
      }, 60000)
      
      interval = setInterval(() => {
        const currentToken = localStorage.getItem('token')
        if (currentToken && currentToken.trim() !== '') {
          checkForReminders(currentToken)
        } else {
          // Token supprimé, arrêter l'intervalle
          if (interval) {
            clearInterval(interval)
          }
        }
      }, 30 * 60 * 1000)

      return () => {
        if (reminderInterval) clearInterval(reminderInterval)
        if (interval) {
          clearInterval(interval)
        }
        if (document.head && document.head.contains(style)) {
          document.head.removeChild(style)
        }
      }
    } else {
      // Pas de token valide, s'assurer que l'utilisateur est déconnecté
      setIsLoggedIn(false)
      setToken('')
      
      return () => {
        if (document.head && document.head.contains(style)) {
          document.head.removeChild(style)
        }
      }
    }
  }, [])

  // 🎤 Initialiser les commandes vocales
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true // Activer pour transcription en temps réel
      recognition.lang = 'fr-FR'
      
      // Transcription en temps réel (interim results)
      recognition.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        // Afficher la transcription en temps réel
        if (interimTranscript) {
          setVoiceCommandText(interimTranscript)
        }
        
        // Traiter la commande finale
        if (finalTranscript) {
          const command = finalTranscript.toLowerCase().trim()
          setVoiceCommandText(command)
          handleVoiceCommand(command)
          // Réinitialiser après un court délai
          setTimeout(() => {
            setVoiceCommandText('')
          }, 2000)
        }
      }
      
      // Gestion des erreurs
      recognition.onerror = (event: any) => {
        // Ne pas logger dans la console pour éviter le spam
        setIsListening(false)
        
        let errorTitle = 'Erreur de reconnaissance vocale'
        let errorMessage = ''
        let errorAction: string | undefined = undefined
        
        switch (event.error) {
          case 'no-speech':
            errorTitle = 'Aucune parole détectée'
            errorMessage = 'Parlez plus fort ou vérifiez que votre microphone fonctionne correctement.'
            errorAction = 'Réessayer'
            break
          case 'audio-capture':
            errorTitle = 'Microphone non disponible'
            errorMessage = 'Vérifiez que votre microphone est connecté et qu\'il n\'est pas utilisé par une autre application.'
            errorAction = 'Réessayer'
            break
          case 'not-allowed':
            errorTitle = 'Permission microphone requise'
            errorMessage = 'Pour utiliser les commandes vocales, vous devez autoriser l\'accès au microphone. Cliquez sur "Autoriser" pour continuer.'
            errorAction = 'Autoriser'
            // Essayer de redemander la permission automatiquement
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                  setVoiceErrorModal(false)
                  setVoiceErrorDetails(null)
                  sendNotification('✅ Permission accordée', 'Vous pouvez maintenant utiliser les commandes vocales.')
                })
                .catch(() => {
                  // Permission toujours refusée, on affiche le modal
                })
            }
            break
          case 'network':
            errorTitle = 'Connexion Internet requise'
            errorMessage = 'La reconnaissance vocale nécessite une connexion Internet active. Vérifiez votre connexion et réessayez.'
            errorAction = 'Compris'
            break
          case 'aborted':
            // L'utilisateur a arrêté manuellement, pas d'erreur à afficher
            return
          default:
            errorTitle = 'Erreur de reconnaissance'
            errorMessage = `Une erreur s'est produite: ${event.error}. Réessayez ou consultez l'aide pour plus d'informations.`
            errorAction = 'Fermer'
        }
        
        // Afficher le modal d'erreur au centre de l'écran
        setVoiceErrorDetails({
          title: errorTitle,
          message: errorMessage,
          action: errorAction
        })
        setShowVoiceErrorModal(true)
        setVoiceError(errorMessage) // Pour l'affichage dans le menu aussi
        
        // Ne pas envoyer de notification pour éviter le spam
      }
      
      // Quand la reconnaissance se termine
      recognition.onend = () => {
        setIsListening(false)
      }
      
      // Quand la reconnaissance commence
      recognition.onstart = () => {
        setIsListening(true)
        setVoiceError(null)
        setVoiceCommandText('🎤 Écoute en cours...')
      }
      
      setRecognition(recognition)
      setVoiceCommandsEnabled(true)
    } else {
      setVoiceCommandsEnabled(false)
      setVoiceError('Reconnaissance vocale non supportée par votre navigateur.')
    }
  }, [])

  // 🎤 Vérifier la disponibilité du microphone (sans demander la permission, juste vérifier)
  const checkMicrophoneAvailability = async (): Promise<boolean> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoiceErrorDetails({
        title: 'Navigateur non compatible',
        message: 'Votre navigateur ne supporte pas les commandes vocales. Utilisez Chrome, Edge ou Safari.',
        action: 'Fermer'
      })
      setShowVoiceErrorModal(true)
      return false
    }
    
    // Vérifier si on a déjà la permission
    try {
      const permissions = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      if (permissions.state === 'denied') {
        setVoiceErrorDetails({
          title: 'Permission microphone refusée',
          message: 'L\'accès au microphone a été refusé. Pour utiliser les commandes vocales, autorisez l\'accès dans les paramètres de votre navigateur (icône 🔒 dans la barre d\'adresse).',
          action: 'Fermer'
        })
        setShowVoiceErrorModal(true)
        return false
      }
    } catch (e) {
      // L'API permissions n'est pas disponible, on continue
    }
    
    // Essayer d'obtenir l'accès (demande automatique de permission)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Libérer le stream immédiatement, on voulait juste vérifier/obtenir la permission
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setVoiceErrorDetails({
          title: 'Permission microphone requise',
          message: 'Pour utiliser les commandes vocales, vous devez autoriser l\'accès au microphone. Cliquez sur "Autoriser" pour continuer.',
          action: 'Autoriser'
        })
        setShowVoiceErrorModal(true)
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setVoiceErrorDetails({
          title: 'Microphone introuvable',
          message: 'Aucun microphone n\'a été détecté. Vérifiez que votre microphone est connecté et fonctionne correctement.',
          action: 'Fermer'
        })
        setShowVoiceErrorModal(true)
      } else {
        setVoiceErrorDetails({
          title: 'Erreur microphone',
          message: `Une erreur s'est produite: ${error.message || error.name}`,
          action: 'Fermer'
        })
        setShowVoiceErrorModal(true)
      }
      return false
    }
  }

  // 🎤 Toggle de la reconnaissance vocale
  const toggleSpeechRecognition = async () => {
    if (!recognition) {
      setVoiceError('Reconnaissance vocale non disponible dans ce navigateur.')
      sendNotification('⚠️ Non supporté', 'Utilisez Chrome, Edge ou Safari pour les commandes vocales.')
      return
    }
    
    if (isListening) {
      recognition.stop()
      setIsListening(false)
      setVoiceCommandText('')
      sendNotification('🎤 Écoute arrêtée', 'Commande vocale désactivée.')
    } else {
      // Vérifier le microphone avant de démarrer
      const micAvailable = await checkMicrophoneAvailability()
      if (!micAvailable) {
        return // L'erreur est déjà affichée par checkMicrophoneAvailability
      }
      
      try {
        recognition.start()
        sendNotification('🎤 Écoute active', 'Parlez votre commande maintenant...')
      } catch (error: any) {
        console.error('Erreur lors du démarrage de la reconnaissance:', error)
        if (error.message?.includes('already started') || error.message?.includes('started')) {
          // La reconnaissance est déjà en cours, on l'arrête d'abord
          recognition.stop()
          setTimeout(() => {
            try {
              recognition.start()
            } catch (e) {
              setVoiceError('Erreur lors du redémarrage. Réessayez dans quelques secondes.')
            }
          }, 200)
        } else {
          setVoiceError('Impossible de démarrer la reconnaissance vocale. Vérifiez votre connexion Internet.')
          sendNotification('⚠️ Erreur', 'Impossible de démarrer. Vérifiez Internet et le microphone.')
          setTimeout(() => {
            setVoiceError(null)
          }, 5000)
        }
      }
    }
  }

  // 🎤 Gestion des commandes vocales (version étendue)
  const handleVoiceCommand = (command: string) => {
    const normalizedCommand = command.toLowerCase().trim()
    let commandExecuted = false
    
    // 🔴 CRÉATION ET GESTION DE TÂCHES
    if (normalizedCommand.includes('créer') && (normalizedCommand.includes('tâche') || normalizedCommand.includes('task'))) {
      // Extraire le titre de la tâche si fourni
      const titleMatch = normalizedCommand.match(/(?:créer|nouvelle).*?tâche[:\s]+(.+)/i) || 
                         normalizedCommand.match(/(?:créer|nouvelle).*?task[:\s]+(.+)/i)
      if (titleMatch && titleMatch[1]) {
        setNewTask({ ...newTask, title: titleMatch[1].trim() })
      }
      setShowCreateModal(true)
      sendNotification('✅ Commande exécutée', 'Création de tâche')
      commandExecuted = true
    }
    
    // 📋 NAVIGATION ET MODALS
    else if (normalizedCommand.includes('calendrier') || normalizedCommand.includes('calendar')) {
      setShowCalendarModal(true)
      sendNotification('✅ Commande exécutée', 'Calendrier ouvert')
      commandExecuted = true
    }
    else if (normalizedCommand.includes('statistiques') || normalizedCommand.includes('stats') || normalizedCommand.includes('tableau de bord')) {
      fetchDashboardStats()
      setShowStatsModal(true)
      sendNotification('✅ Commande exécutée', 'Statistiques ouvertes')
      commandExecuted = true
    }
    else if (normalizedCommand.includes('templates') || normalizedCommand.includes('modèles')) {
      fetchTemplates()
      setShowTemplatesModal(true)
      sendNotification('✅ Commande exécutée', 'Templates ouverts')
      commandExecuted = true
    }
    else if (normalizedCommand.includes('tags') || normalizedCommand.includes('étiquettes')) {
      setShowTagsModal(true)
      sendNotification('✅ Commande exécutée', 'Tags ouverts')
      commandExecuted = true
    }
    else if (normalizedCommand.includes('notes') || normalizedCommand.includes('brain dump') || normalizedCommand.includes('remarques')) {
      setShowNotesModal(true)
      sendNotification('✅ Commande exécutée', 'Notes ouvertes')
      commandExecuted = true
    }
    else if (normalizedCommand.includes('pauses') || normalizedCommand.includes('pause')) {
      fetchBreaks()
      setShowBreaksModal(true)
      sendNotification('✅ Commande exécutée', 'Pauses ouvertes')
      commandExecuted = true
    }
    else if (normalizedCommand.includes('énergie') || normalizedCommand.includes('energy')) {
      setShowEnergyModal(true)
      sendNotification('✅ Commande exécutée', 'Niveau d\'énergie ouvert')
      commandExecuted = true
    }
    else if (normalizedCommand.includes('rappels') || normalizedCommand.includes('reminders')) {
      setShowRemindersModal(true)
      sendNotification('✅ Commande exécutée', 'Rappels ouverts')
      commandExecuted = true
    }
    else if (normalizedCommand.includes('timeline') || normalizedCommand.includes('chronologie')) {
      setShowTimelineModal(true)
      sendNotification('✅ Commande exécutée', 'Timeline ouverte')
      commandExecuted = true
    }
    else if (normalizedCommand.includes('time awareness') || normalizedCommand.includes('conscience du temps')) {
      setShowTimeAwarenessModal(true)
      sendNotification('✅ Commande exécutée', 'Time Awareness ouvert')
      commandExecuted = true
    }
    else if (normalizedCommand.includes('corbeille') || normalizedCommand.includes('trash') || normalizedCommand.includes('supprimées')) {
      setShowTrashModal(true)
      sendNotification('✅ Commande exécutée', 'Corbeille ouverte')
      commandExecuted = true
    }
    
    // 🚪 FERMETURE
    else if (normalizedCommand.includes('fermer') || normalizedCommand.includes('close') || normalizedCommand.includes('annuler')) {
      setShowCreateModal(false)
      setShowEditModal(false)
      setShowTaskDetailModal(false)
      setShowCalendarModal(false)
      setShowTemplatesModal(false)
      setShowTagsModal(false)
      setShowNotesModal(false)
      setShowStatsModal(false)
      setShowBreaksModal(false)
      setShowEnergyModal(false)
      setShowRemindersModal(false)
      setShowTimelineModal(false)
      setShowTimeAwarenessModal(false)
      setShowTrashModal(false)
      setShowMobileMenu(false)
      sendNotification('✅ Commande exécutée', 'Modals fermées')
      commandExecuted = true
    }
    
    // ❓ AIDE
    else if (normalizedCommand.includes('aide') || normalizedCommand.includes('help') || normalizedCommand.includes('commandes')) {
      setShowVoiceHelpModal(true)
      sendNotification('✅ Commande exécutée', 'Aide vocale ouverte')
      commandExecuted = true
    }
    
    // Si aucune commande n'a été reconnue
    if (!commandExecuted) {
      sendNotification('⚠️ Commande non reconnue', `"${command}" - Dites "aide" pour voir les commandes disponibles`)
    } else if (voiceAudioFeedback) {
      // Feedback audio optionnel (son de confirmation)
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = 800 // Fréquence du son
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
      } catch (error) {
        // Ignorer les erreurs audio (navigateur peut bloquer)
        console.debug('Audio feedback non disponible:', error)
      }
    }
  }

  // 🔒 Bloquer le scroll de l'arrière-plan quand le menu mobile est ouvert
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [showMobileMenu])

  // ⌨️ Raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K pour créer une tâche
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowCreateModal(true)
      }
      // Ctrl/Cmd + C pour calendrier
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !e.shiftKey) {
        e.preventDefault()
        setShowCalendarModal(true)
      }
      // Ctrl/Cmd + S pour stats
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault()
        fetchDashboardStats()
        setShowStatsModal(true)
      }
      // Ctrl/Cmd + N pour notes
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault()
        setShowNotesModal(true)
      }
      // Ctrl/Cmd + Shift + V pour commandes vocales
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault()
        toggleSpeechRecognition()
      }
      // Escape pour fermer les modals
      if (e.key === 'Escape') {
        setShowCreateModal(false)
        setShowEditModal(false)
        setShowTaskDetailModal(false)
        setShowCalendarModal(false)
        setShowTemplatesModal(false)
        setShowTagsModal(false)
        setShowNotesModal(false)
        setShowStatsModal(false)
        setShowBreaksModal(false)
        setShowEnergyModal(false)
        setShowRemindersModal(false)
        setShowTimelineModal(false)
        setShowVoiceErrorModal(false)
        setShowVoiceHelpModal(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [recognition])

  // ⏱️ Time tracking continu pour les tâches en cours
  useEffect(() => {
    if (!isLoggedIn || !token) return

    const updateTimeTracking = async () => {
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress' && t.started_at)
      
      for (const task of inProgressTasks) {
        if (task.started_at) {
          try {
            // Mettre à jour le temps toutes les minutes
            const response = await fetch(`${API_URL}/tasks/${task.id}/update-time`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                time_in_progress_seconds: (task.time_in_progress_seconds || 0) + 60,
                time_spent_seconds: (task.time_spent_seconds || 0) + 60
              })
            })
            if (response.ok) {
              // Rafraîchir les tâches après mise à jour
              fetchTasks(token)
            }
          } catch (error) {
            console.error('Error updating time tracking:', error)
          }
        }
      }
    }

    const timeTrackingInterval = setInterval(() => {
      updateTimeTracking()
    }, 60000) // Mettre à jour toutes les minutes

    return () => {
      if (timeTrackingInterval) {
        clearInterval(timeTrackingInterval)
      }
    }
  }, [isLoggedIn, token, tasks])

  // 🧠 Tracking d'attention automatique
  useEffect(() => {
    if (!isLoggedIn || !token) return

    // Détecter la tâche en cours automatiquement
    const inProgressTask = tasks.find(t => t.status === 'in_progress')
    if (inProgressTask && currentFocusTask !== inProgressTask.id) {
      trackTaskChange(inProgressTask.id)
    } else if (!inProgressTask && currentFocusTask !== null) {
      trackTaskChange(null)
    }

    // Rafraîchir les suggestions IA toutes les 10 minutes
    const aiSuggestionsInterval = setInterval(() => {
      fetchAISuggestions()
    }, 10 * 60 * 1000)

    // Enregistrer la session en cours toutes les 10 minutes
    const sessionSaveInterval = setInterval(() => {
      if (currentFocusTask && focusStartTime) {
        const now = new Date()
        const focusDuration = Math.floor((now.getTime() - focusStartTime.getTime()) / 1000)
        
        // Enregistrer une session intermédiaire si on a au moins 5 minutes de focus
        if (focusDuration >= 300) {
          recordAttentionSession(
            currentFocusTask,
            focusStartTime,
            now,
            taskSwitchCount
          )
          // Réinitialiser le compteur mais garder la session active
          setTaskSwitchCount(0)
          setFocusStartTime(now)
        }
      }
    }, 10 * 60 * 1000)

    return () => {
      clearInterval(aiSuggestionsInterval)
      clearInterval(sessionSaveInterval)
    }
  }, [isLoggedIn, token, tasks, currentFocusTask, focusStartTime, taskSwitchCount])

  // 🧠 Détection d'inactivité (quand l'utilisateur quitte la page ou devient inactif)
  useEffect(() => {
    if (!isLoggedIn || !currentFocusTask) return

    let inactivityTimer: ReturnType<typeof setTimeout> | null = null
    const INACTIVITY_THRESHOLD = 5 * 60 * 1000 // 5 minutes

    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      
      inactivityTimer = setTimeout(() => {
        // L'utilisateur est inactif depuis 5 minutes, enregistrer la session
        if (currentFocusTask && focusStartTime) {
          const now = new Date()
          recordAttentionSession(
            currentFocusTask,
            focusStartTime,
            now,
            taskSwitchCount
          )
          trackTaskChange(null)
        }
      }, INACTIVITY_THRESHOLD)
    }

    // Événements pour détecter l'activité
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer, true)
    })

    resetInactivityTimer()

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer, true)
      })
    }
  }, [isLoggedIn, currentFocusTask, focusStartTime, taskSwitchCount])

  // 🧠 Enregistrer la session d'attention quand l'utilisateur quitte la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentFocusTask && focusStartTime && token) {
        const now = new Date()
        // Utiliser sendBeacon pour envoyer la requête même si la page se ferme
        const sessionData = {
          task_id: currentFocusTask,
          focus_start: focusStartTime.toISOString(),
          focus_end: now.toISOString(),
          distraction_events: taskSwitchCount,
          context_energy_level: energyLevel
        }
        
        // Enregistrer de manière synchrone si possible
        fetch(`${API_URL}/attention/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(sessionData),
          keepalive: true
        }).catch(() => {
          // Ignorer les erreurs lors de la fermeture
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [currentFocusTask, focusStartTime, taskSwitchCount, energyLevel, token])

  const initNotifications = async () => {
    try {
      const { swRegistered, permissionGranted } = await initNotificationSystem()
      setNotificationsEnabled(permissionGranted)
      
      if (swRegistered && permissionGranted) {
        console.log('✅ Système de notifications en arrière-plan activé')
        
        // Stocker le token dans le Service Worker si disponible
        if (token) {
          await storeAuthTokenInSW(token)
        }
        
        // Synchroniser les rappels depuis l'API
        await syncRemindersFromAPI()
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications:', error)
    }
  }

  const sendNotification = (title: string, body: string, options?: NotificationOptions) => {
    // Utiliser la fonction utilitaire qui gère à la fois les notifications immédiates
    // et la programmation via Service Worker
    sendNotificationUtil(title, body, options)
  }

  // 🎨 Feedback visuel pour les actions
  const showActionFeedback = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const feedback = document.createElement('div')
    feedback.className = `action-feedback ${type} fade-in`
    feedback.textContent = message
    document.body.appendChild(feedback)
    
    setTimeout(() => {
      feedback.remove()
    }, 3000)
  }

  // 🔊 Son de confirmation (optionnel)
  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (error) {
      // Ignorer les erreurs audio
    }
  }

  const formatTime = (seconds: number): string => {
    if (!seconds || seconds === 0) return '0s'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    const parts: string[] = []
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (secs > 0 && hours === 0) parts.push(`${secs}s`)
    return parts.join(' ') || '0s'
  }

  const getTaskDateInfo = (task: Task): { label: string, date: Date | null, icon: string } | null => {
    if (task.status === 'done' && task.completed_at) {
      return {
        label: 'Terminée',
        date: new Date(task.completed_at),
        icon: '✅'
      }
    }
    if (task.status === 'blocked') {
      // Pour les tâches bloquées, on peut afficher la date de création ou une date de blocage si elle existe
      if (task.created_at) {
        return {
          label: 'Créée',
          date: new Date(task.created_at),
          icon: '🚫'
        }
      }
    }
    if (task.status === 'standby' && task.standby_at) {
      return {
        label: 'En standby',
        date: new Date(task.standby_at),
        icon: '⏸️'
      }
    }
    if (task.status === 'review') {
      // Pour les tâches en review, on peut afficher la date de création
      if (task.created_at) {
        return {
          label: 'Créée',
          date: new Date(task.created_at),
          icon: '⏳'
        }
      }
    }
    if (task.status === 'in_progress' && task.started_at) {
      return {
        label: 'Démarrée',
        date: new Date(task.started_at),
        icon: '🔄'
      }
    }
    if (task.status === 'todo') {
      if (task.due_date) {
        return {
          label: 'À faire',
          date: new Date(task.due_date),
          icon: '📅'
        }
      } else if (task.created_at) {
        return {
          label: 'Créée',
          date: new Date(task.created_at),
          icon: '📋'
        }
      }
    }
    // Fallback : afficher la date de création si disponible
    if (task.created_at) {
      return {
        label: 'Créée',
        date: new Date(task.created_at),
        icon: '📋'
      }
    }
    return null
  }

  const fetchTasks = async (authToken: string) => {
    if (!authToken) return
    
    try {
      const response = await fetch(`${API_URL}/tasks/`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
        // Extraire les projets uniques des tâches et workflows
        const taskProjects = data.map((t: Task) => t.project).filter((p: string | undefined): p is string => !!p)
        const workflowProjects = workflows.map((w: Workflow) => w.project).filter((p: string | undefined): p is string => !!p)
        const allProjects = Array.from(new Set([...taskProjects, ...workflowProjects]))
        setAvailableProjects(allProjects.sort())
      } else if (response.status === 401) {
        // Token invalide ou expiré
        localStorage.removeItem('token')
        setToken('')
        setIsLoggedIn(false)
        setTasks([])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchWorkflows = async (authToken: string) => {
    if (!authToken) return
    
    try {
      const response = await fetch(`${API_URL}/workflows`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data)
        // Mettre à jour les projets disponibles
        const workflowProjects = data.map((w: Workflow) => w.project).filter((p: string | undefined): p is string => !!p)
        const taskProjects = tasks.map((t: Task) => t.project).filter((p: string | undefined): p is string => !!p)
        const allProjects = Array.from(new Set([...taskProjects, ...workflowProjects]))
        setAvailableProjects(allProjects.sort())
      } else if (response.status === 401) {
        // Token invalide ou expiré
        localStorage.removeItem('token')
        setToken('')
        setIsLoggedIn(false)
        setWorkflows([])
      }
    } catch (error) {
      console.error('Error fetching workflows:', error)
    }
  }

  // 📊 Time Awareness - Récupérer les statistiques de comparaison
  const fetchTimeComparisonStats = async () => {
    if (!token) return
    try {
      const response = await fetch(`${API_URL}/stats/time-comparison`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setTimeComparisonStats(data)
      }
    } catch (error) {
      console.error('Error fetching time comparison stats:', error)
    }
  }

  // 📋 Templates - Récupérer les templates
  const fetchTemplates = async () => {
    if (!token) return
    try {
      const response = await fetch(`${API_URL}/templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  // 🔨 Breakdown - Récupérer les sous-tâches
  const fetchSubtasks = async (taskId: number) => {
    if (!token) return
    try {
      const response = await fetch(`${API_URL}/subtasks/task/${taskId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSubtasks({ ...subtasks, [taskId]: data })
      }
    } catch (error) {
      console.error('Error fetching subtasks:', error)
    }
  }

  // 🏷️ Tags - Récupérer les tags
  const fetchTags = async () => {
    if (!token) return
    try {
      const response = await fetch(`${API_URL}/tags`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  // 📝 Notes - Récupérer les notes
  const fetchNotes = async () => {
    if (!token) return
    try {
      const response = await fetch(`${API_URL}/notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }

  // 📊 Stats - Récupérer les statistiques du dashboard
  const fetchDashboardStats = async () => {
    if (!token) return
    try {
      const response = await fetch(`${API_URL}/stats/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setDashboardStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  // ☕ Pauses - Récupérer les pauses d'aujourd'hui
  const fetchBreaks = async () => {
    if (!token) return
    try {
      const response = await fetch(`${API_URL}/breaks/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        const active = data.find((b: any) => b.is_active)
        if (active) setActiveBreak(active)
      }
    } catch (error) {
      console.error('Error fetching breaks:', error)
    }
  }

  // ⚡ Energy - Récupérer le niveau d'énergie actuel et les logs
  const fetchEnergyData = async () => {
    if (!token) return
    try {
      const [currentResponse, logsResponse] = await Promise.all([
        fetch(`${API_URL}/energy/current`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/energy/logs?days=7`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])
      if (currentResponse.ok) {
        const current = await currentResponse.json()
        if (current) setEnergyLevel(current.energy_level)
      }
      if (logsResponse.ok) {
        const logs = await logsResponse.json()
        setEnergyLogs(logs)
      }
    } catch (error) {
      console.error('Error fetching energy data:', error)
    }
  }

  // 🧠 Attention - Récupérer les suggestions IA basées sur l'attention
  const fetchAISuggestions = async () => {
    if (!token) return
    try {
      const [nextTaskResponse, breakResponse] = await Promise.all([
        fetch(`${API_URL}/ai/suggest-next-task`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/ai/suggest-break`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])
      
      if (nextTaskResponse.ok) {
        const nextTask = await nextTaskResponse.json()
        if (nextTask.suggestion) {
          // Afficher la suggestion IA
          const task = tasks.find(t => t.id === nextTask.suggestion.task_id)
          if (task) {
            sendNotification(
              '🤖 Suggestion IA',
              `${nextTask.recommendation}\n\nTâche suggérée: "${task.title}"`
            )
          }
        }
      }
      
      if (breakResponse.ok) {
        const breakSuggestion = await breakResponse.json()
        if (breakSuggestion.suggest_break) {
          sendNotification('☕ Pause suggérée', breakSuggestion.reason)
        }
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error)
    }
  }

  // 🧠 Attention - Enregistrer une session de focus
  const recordAttentionSession = async (
    taskId: number | null,
    focusStart: Date,
    focusEnd: Date | null = null,
    distractionEvents: number = 0
  ) => {
    if (!token) return
    try {
      const sessionData = {
        task_id: taskId,
        focus_start: focusStart.toISOString(),
        focus_end: focusEnd ? focusEnd.toISOString() : null,
        distraction_events: distractionEvents,
        context_energy_level: energyLevel
      }
      
      const response = await fetch(`${API_URL}/attention/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sessionData)
      })
      
      if (response.ok) {
        // Les données sont utilisées par l'IA en arrière-plan
      }
    } catch (error) {
      console.error('Error recording attention session:', error)
    }
  }

  // 🧠 Attention - Détecter les changements de tâches
  const trackTaskChange = (newTaskId: number | null) => {
    const now = new Date()
    
    // Si on change de tâche, enregistrer la session précédente
    if (currentFocusTask !== null && currentFocusTask !== newTaskId && focusStartTime) {
      const focusDuration = Math.floor((now.getTime() - focusStartTime.getTime()) / 1000)
      
      // Enregistrer la session précédente
      recordAttentionSession(
        currentFocusTask,
        focusStartTime,
        now,
        taskSwitchCount
      )
      
      // Réinitialiser le compteur
      setTaskSwitchCount(0)
    }
    
    // Détecter si c'est un changement rapide (distraction)
    if (lastTaskChangeTime) {
      const timeSinceLastChange = (now.getTime() - lastTaskChangeTime.getTime()) / 1000
      if (timeSinceLastChange < 300) { // Moins de 5 minutes = distraction
        setTaskSwitchCount(prev => prev + 1)
      }
    }
    
    // Mettre à jour la tâche actuelle
    setCurrentFocusTask(newTaskId)
    setFocusStartTime(newTaskId ? now : null)
    setLastTaskChangeTime(now)
  }

  // 🔔 Rappels - Récupérer les rappels en attente
  const fetchPendingReminders = async () => {
    if (!token) return
    try {
      const response = await fetch(`${API_URL}/reminders/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setPendingReminders(data)
        
        // Programmer les notifications pour tous les rappels futurs (même si l'app est fermée)
        await scheduleRemindersNotifications(data, API_URL)
        
        // Afficher immédiatement les notifications pour les rappels déjà dus
        const now = Date.now()
        data.forEach((reminder: any) => {
          const reminderTime = new Date(reminder.reminder_time).getTime()
          if (reminderTime <= now) {
            // Rappel déjà dû, notification immédiate
            if (reminder.task_id) {
              const task = tasks.find(t => t.id === reminder.task_id)
              if (task) {
                sendNotification('🔔 Rappel', `Tâche: ${task.title}`, { tag: `reminder-${reminder.id}` })
              }
            } else {
              sendNotification('🔔 Rappel', 'Vous avez un rappel', { tag: `reminder-${reminder.id}` })
            }
          }
        })
      }
    } catch (error) {
      console.error('Error fetching reminders:', error)
    }
  }

  // Créer automatiquement les rappels
  const createAutoReminders = async () => {
    if (!token) return
    try {
      const response = await fetch(`${API_URL}/reminders/auto-create`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.created > 0) {
          fetchPendingReminders()
        }
      }
    } catch (error) {
      console.error('Error creating auto reminders:', error)
    }
  }

  const checkForReminders = async (authToken: string) => {
    if (!authToken) return
    
    try {
      const response = await fetch(`${API_URL}/workflows/remind-new-ticket`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.needs_ticket) {
          setReminderMessage(data.message)
          sendNotification(
            '🎯 TaskFlow ADHD - Rappel',
            'Aucune tâche active ! Prendre un nouveau ticket Trello.',
            { tag: 'no-active-tasks' }
          )
          setTimeout(() => setShowReminderModal(true), 2000)
        }
      } else if (response.status === 401) {
        // Token invalide ou expiré - ne pas déconnecter silencieusement pour les reminders
        // car c'est juste un check périodique
        return
      }
    } catch (error) {
      console.error('Error checking reminders:', error)
    }
  }

  const fetchDailySummary = async () => {
    try {
      const response = await fetch(`${API_URL}/reports/daily-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDailySummary(data.summary)
        setShowDailyModal(true)
      }
    } catch (error) {
      console.error('Error fetching daily summary:', error)
    }
  }

  const fetchWeeklySummary = async () => {
    try {
      const response = await fetch(`${API_URL}/reports/weekly-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setWeeklySummary(data.summary)
        setShowWeeklyModal(true)
      }
    } catch (error) {
      console.error('Error fetching weekly summary:', error)
    }
  }

  const fetchCurrentActivity = async () => {
    try {
      const response = await fetch(`${API_URL}/tasks/stats/current`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentActivity(data)
        setShowCurrentActivityModal(true)
      } else if (response.status === 401) {
        logout()
      }
    } catch (error) {
      console.error('Error fetching current activity:', error)
    }
  }

  const login = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginForm)
      })

      if (response.ok) {
        const data = await response.json()
        setToken(data.access_token)
        setUser(data.user)
        localStorage.setItem('token', data.access_token)
        setIsLoggedIn(true)
        fetchTasks(data.access_token)
        fetchWorkflows(data.access_token)
        checkForReminders(data.access_token)
        
        // Initialiser le système de notifications et stocker le token
        initNotifications().then(async () => {
          await storeAuthTokenInSW(data.access_token)
          
          // Attendre un peu pour s'assurer que le token est bien stocké
          await new Promise(resolve => setTimeout(resolve, 500))
          
          await syncRemindersFromAPI()
        })
        
        // Charger les données des nouvelles fonctionnalités
        fetchTemplates()
        fetchTags()
        fetchNotes()
        fetchDashboardStats()
        fetchBreaks()
        fetchEnergyData()
        fetchTimeComparisonStats()
      } else {
        const error = await response.json()
        alert('Erreur de connexion: ' + error.detail)
        console.error('Login error:', error)
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Erreur de connexion')
    }
  }

  const register = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerForm)
      })

      if (response.ok) {
        const data = await response.json()
        setToken(data.access_token)
        setUser(data.user)
        localStorage.setItem('token', data.access_token)
        setIsLoggedIn(true)
        setShowRegister(false)
        fetchTasks(data.access_token)
        fetchWorkflows(data.access_token)
        initNotifications()
      } else {
        const error = await response.json()
        alert("Erreur d'inscription: " + error.detail)
        console.error('Register error:', error)
      }
    } catch (error) {
      console.error('Register error:', error)
      alert("Erreur d'inscription")
    }
  }

  const logout = () => {
    setToken('')
    setUser(null)
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    setTasks([])
    setNotificationsEnabled(false)
  }

  const createTask = async () => {
    try {
      const taskData = {
        ...newTask,
        due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : undefined,
        project: newTask.project || undefined,
        estimated_time_minutes: newTask.estimated_time_minutes || undefined
      }
      
      const response = await fetch(`${API_URL}/tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      })

      if (response.ok) {
        setNewTask({ title: '', description: '', priority: 'medium', trello_id: '', due_date: undefined, project: '', estimated_time_minutes: null })
        setShowCreateModal(false)
        fetchTasks(token)
        showActionFeedback('✅ Tâche créée avec succès', 'success')
        playSuccessSound()
        sendNotification('✅ Tâche créée', `"${newTask.title}" a été ajoutée`)
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const createWorkflow = async () => {
    try {
      const stepsText = workflowSteps.filter(s => s.trim() !== '').join('\n')
      if (!stepsText) {
        alert('Veuillez ajouter au moins une étape')
        return
      }
      
      const response = await fetch(`${API_URL}/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newWorkflow.name,
          steps: stepsText,
          category: newWorkflow.category,
          project: newWorkflow.project || null
        })
      })

      if (response.ok) {
        setNewWorkflow({ name: '', steps: '', category: 'dev', project: '' })
        setWorkflowSteps([''])
        setEditingWorkflow(null)
        setShowCreateWorkflowModal(false)
        fetchWorkflows(token)
        sendNotification('✅ Workflow créé', `"${newWorkflow.name}" a été créé`)
      } else {
        const error = await response.json()
        alert(error.detail || 'Erreur lors de la création du workflow')
      }
    } catch (error) {
      console.error('Error creating workflow:', error)
      alert('Erreur lors de la création du workflow')
    }
  }

  const updateWorkflow = async () => {
    if (!editingWorkflow) return
    
    try {
      const stepsText = workflowSteps.filter(s => s.trim() !== '').join('\n')
      if (!stepsText) {
        alert('Veuillez ajouter au moins une étape')
        return
      }
      
      const response = await fetch(`${API_URL}/workflows/${editingWorkflow.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newWorkflow.name,
          steps: stepsText,
          category: newWorkflow.category,
          project: newWorkflow.project || null
        })
      })

      if (response.ok) {
        setNewWorkflow({ name: '', steps: '', category: 'dev', project: '' })
        setWorkflowSteps([''])
        setEditingWorkflow(null)
        setShowCreateWorkflowModal(false)
        fetchWorkflows(token)
        sendNotification('✅ Workflow modifié', `"${newWorkflow.name}" a été modifié`)
      } else {
        const error = await response.json()
        alert(error.detail || 'Erreur lors de la modification du workflow')
      }
    } catch (error) {
      console.error('Error updating workflow:', error)
      alert('Erreur lors de la modification du workflow')
    }
  }

  const updateTask = async (taskId: number, updates: any) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const updatedTask = await response.json()
        
        // 🧠 Tracking d'attention : détecter les changements de statut
        if (updates.status) {
          if (updates.status === 'in_progress') {
            // Démarrer le tracking pour cette tâche
            trackTaskChange(taskId)
          } else if (updates.status !== 'in_progress' && currentFocusTask === taskId) {
            // Arrêter le tracking si on quitte la tâche
            trackTaskChange(null)
          }
        }
        
        fetchTasks(token)
        setShowEditModal(false)
        setSelectedTask(null)
        
        // Mettre à jour la tâche dans la modal de détails si elle est ouverte
        if (showTaskDetailModal && selectedTaskDetail && selectedTaskDetail.id === taskId) {
          setSelectedTaskDetail(updatedTask)
        }
        
        if (updates.status === 'done') {
          sendNotification('🎉 Tâche terminée !', 'Bravo ! Pense à prendre un nouveau ticket.')
        } else if (updates.status === 'blocked') {
          sendNotification('🚫 Tâche bloquée', "N'oublie pas de débloquer ou prendre un autre ticket.")
        } else if (updates.status === 'standby') {
          sendNotification('⏸️ Tâche en standby', 'Tâche mise en pause. Prendre un autre ticket ?')
        }
        
        setTimeout(() => checkForReminders(token), 1000)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId: number) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchTasks(token)
        fetchDeletedTasks()
        checkForReminders(token)
        sendNotification('🗑️ Tâche supprimée', 'La tâche a été déplacée dans la corbeille')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copié dans le presse-papiers!')
  }

  const handleTaskAction = (task: Task, action: string) => {
    switch (action) {
      case 'start':
        setConfirmAction({
          type: 'start',
          task,
          message: `Démarrer la tâche "${task.title}" ?`
        })
        setShowConfirmModal(true)
        break
      case 'block':
        setTaskToBlock(task)
        setBlockReason('')
        setShowBlockReasonModal(true)
        break
      case 'standby':
        setConfirmAction({
          type: 'standby',
          task,
          message: `Mettre en standby la tâche "${task.title}" ?`
        })
        setShowConfirmModal(true)
        break
      case 'review':
        setConfirmAction({
          type: 'review',
          task,
          message: `Mettre en review la tâche "${task.title}" ?`
        })
        setShowConfirmModal(true)
        break
      case 'complete':
        setConfirmAction({
          type: 'complete',
          task,
          message: `Confirmer la complétion de la tâche "${task.title}" ?`
        })
        setShowConfirmModal(true)
        break
      case 'resume':
        setConfirmAction({
          type: 'resume',
          task,
          message: `Reprendre la tâche "${task.title}" ?`
        })
        setShowConfirmModal(true)
        break
      case 'delete':
        setConfirmAction({
          type: 'delete',
          task,
          message: `Supprimer définitivement la tâche "${task.title}" ?`
        })
        setShowConfirmModal(true)
        break
      case 'edit':
        setSelectedTask(task)
        setShowTaskDetailModal(false)
        setShowEditModal(true)
        break
    }
  }

  const confirmActionHandler = () => {
    if (!confirmAction) return

    switch (confirmAction.type) {
      case 'start':
        updateTask(confirmAction.task.id, { status: 'in_progress' })
        break
      case 'standby':
        updateTask(confirmAction.task.id, { status: 'standby' })
        break
      case 'review':
        updateTask(confirmAction.task.id, { status: 'review' })
        break
      case 'complete':
        updateTask(confirmAction.task.id, { status: 'done' })
        break
      case 'resume':
        updateTask(confirmAction.task.id, { status: 'in_progress', blocked_reason: null })
        break
      case 'delete':
        deleteTask(confirmAction.task.id)
        break
    }
    
    setShowConfirmModal(false)
    setConfirmAction(null)
  }

  const handleBlockTask = () => {
    if (taskToBlock && blockReason.trim()) {
      updateTask(taskToBlock.id, { status: 'blocked', blocked_reason: blockReason.trim() })
      setShowBlockReasonModal(false)
      setBlockReason('')
      setTaskToBlock(null)
    }
  }

  const fetchDeletedTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/tasks/?include_deleted=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const allTasks = await response.json()
        const deleted = allTasks.filter((t: Task) => t.deleted_at)
        setDeletedTasks(deleted)
      }
    } catch (error) {
      console.error('Error fetching deleted tasks:', error)
    }
  }

  const toggleColumn = (status: string) => {
    const isOpening = !columnStates[status]
    const newStates: {[key: string]: boolean} = {}
    
    // Si on ouvre une colonne, fermer toutes les autres
    if (isOpening) {
      Object.keys(columnStates).forEach(key => {
        newStates[key] = key === status
      })
    } else {
      // Si on ferme, garder l'état actuel
      newStates[status] = false
      Object.keys(columnStates).forEach(key => {
        if (key !== status) {
          newStates[key] = columnStates[key]
        }
      })
    }
    
    setColumnStates(newStates)
    localStorage.setItem('columnStates', JSON.stringify(newStates))
  }

  const restoreTask = async (taskId: number) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        fetchTasks(token)
        fetchDeletedTasks()
        sendNotification('✅ Tâche restaurée', 'La tâche a été restaurée')
      }
    } catch (error) {
      console.error('Error restoring task:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const labels = {
      'todo': 'À faire',
      'in_progress': 'En cours',
      'blocked': 'Bloqué',
      'standby': 'Standby',
      'review': 'Review',
      'done': 'Terminé'
    }

    return <span className={`task-badge task-badge-${status}`}>
      {labels[status as keyof typeof labels]}
    </span>
  }

  const getPriorityBadge = (priority: string) => {
    const labels = {
      'low': 'Basse',
      'medium': 'Moyenne',
      'high': 'Haute',
      'urgent': 'Urgente'
    }
    
    return <span className={`task-badge task-badge-priority task-badge-priority-${priority}`}>
      {labels[priority as keyof typeof labels]}
    </span>
  }

  // Fonction de recherche de tâches
  const filteredTasks = useMemo(() => {
    if (!taskSearchQuery.trim()) {
      return tasks
    }
    const query = taskSearchQuery.toLowerCase().trim()
    return tasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      (task.description && task.description.toLowerCase().includes(query)) ||
      (task.trello_id && task.trello_id.toLowerCase().includes(query))
    )
  }, [tasks, taskSearchQuery])

  const getTaskActions = (task: Task) => {
    const isExpanded = showTaskActions[task.id] || false
    const actions = []
    
    // Bouton toggle pour afficher/masquer les actions
    actions.push(
      <button 
        key="toggle" 
        className="btn-task btn-task-toggle" 
        onClick={() => setShowTaskActions({...showTaskActions, [task.id]: !isExpanded})}
        title={isExpanded ? "Masquer les actions" : "Afficher les actions"}
      >
        {isExpanded ? '▼' : '▶'}
      </button>
    )
    
    // Actions détaillées (affichées seulement si expanded)
    if (isExpanded) {
      // Bouton Décomposer pour toutes les tâches SAUF celles terminées
      if (task.status !== 'done') {
        actions.push(
          <button 
            key="breakdown" 
            className="btn-task btn-task-secondary" 
            onClick={() => {
              setTaskToBreakdown(task)
              fetchSubtasks(task.id)
              setBreakdownSteps([''])
              setShowBreakdownModal(true)
            }}
            title="Décomposer en sous-tâches"
          >
            🔨 Décomposer
          </button>
        )
      }
      
      if (task.status === 'todo') {
        actions.push(
          <button key="start" className="btn-task btn-task-primary" onClick={() => handleTaskAction(task, 'start')}>
            ▶️ Commencer
          </button>
        )
      }
      
      if (task.status === 'in_progress') {
        actions.push(
          <button key="standby" className="btn-task btn-task-warning" onClick={() => handleTaskAction(task, 'standby')}>
            ⏸️ Standby
          </button>,
          <button key="block" className="btn-task btn-task-danger" onClick={() => handleTaskAction(task, 'block')}>
            🚫 Bloquer
          </button>,
          <button key="review" className="btn-task btn-task-info" onClick={() => handleTaskAction(task, 'review')}>
            ⏳ Review
          </button>,
          <button key="complete" className="btn-task btn-task-success" onClick={() => handleTaskAction(task, 'complete')}>
            ✅ Terminer
          </button>
        )
      }
      
      if (task.status === 'blocked' || task.status === 'done' || task.status === 'standby' || task.status === 'review') {
        actions.push(
          <button key="resume" className="btn-task btn-task-primary" onClick={() => handleTaskAction(task, 'resume')}>
            🔄 Reprendre
          </button>
        )
      }
      
      actions.push(
        <button key="edit" className="btn-task btn-task-secondary" onClick={() => handleTaskAction(task, 'edit')}>
          ✏️ Modifier
        </button>,
        <button key="delete" className="btn-task btn-task-danger-outline" onClick={() => deleteTask(task.id)}>
          🗑️ Supprimer
        </button>
      )
    }
    
    return actions
  }

  // Rendu principal du composant
  if (!isLoggedIn) {
    return (
      <AuthPage
        darkMode={darkMode}
        showRegister={showRegister}
        setShowRegister={setShowRegister}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        registerForm={registerForm}
        setRegisterForm={setRegisterForm}
        showLoginPassword={showLoginPassword}
        setShowLoginPassword={setShowLoginPassword}
        showRegisterPassword={showRegisterPassword}
        setShowRegisterPassword={setShowRegisterPassword}
        login={login}
        register={register}
      />
    )
  }

  return (
    <>
      <div className={`taskflow-app ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        <nav className="taskflow-navbar">
            <div className="navbar-content">
              <div className="navbar-brand-section">
                <span className="navbar-logo">🎯</span>
                <span className="navbar-title">TaskFlow ADHD</span>
                <span className="navbar-user">{user?.full_name}</span>
              </div>
              
              {/* Barre de recherche */}
              <div className="navbar-search">
                <input
                  type="text"
                  className="search-input"
                  placeholder="🔍 Rechercher une tâche..."
                  value={taskSearchQuery}
                  onChange={(e) => {
                    setTaskSearchQuery(e.target.value)
                    setShowSearchResults(e.target.value.trim().length > 0)
                  }}
                  onFocus={() => {
                    if (taskSearchQuery.trim().length > 0) {
                      setShowSearchResults(true)
                    }
                  }}
                />
                {taskSearchQuery && (
                  <button
                    className="search-clear"
                    onClick={() => {
                      setTaskSearchQuery('')
                      setShowSearchResults(false)
                    }}
                    title="Effacer la recherche"
                  >
                    ✕
                  </button>
                )}
                {showSearchResults && filteredTasks.length > 0 && (
                  <div className="search-results">
                    <div className="search-results-header">
                      <span>{filteredTasks.length} résultat(s) trouvé(s)</span>
                      <button onClick={() => setShowSearchResults(false)}>✕</button>
                    </div>
                    <div className="search-results-list">
                      {filteredTasks.slice(0, 10).map(task => (
                        <div
                          key={task.id}
                          className="search-result-item"
                          onClick={() => {
                            setSelectedTaskDetail(task)
                            fetchSubtasks(task.id)
                            setShowTaskDetailModal(true)
                            setTaskSearchQuery('')
                            setShowSearchResults(false)
                          }}
                        >
                          <div className="search-result-title">{task.title}</div>
                          {task.description && (
                            <div className="search-result-description">{task.description.substring(0, 60)}...</div>
                          )}
                          <div className="search-result-meta">
                            <span className={`search-result-status status-${task.status}`}>
                              {task.status === 'todo' ? '📋 À faire' :
                               task.status === 'in_progress' ? '🔄 En cours' :
                               task.status === 'done' ? '✅ Terminé' :
                               task.status === 'blocked' ? '🚫 Bloqué' :
                               task.status === 'standby' ? '⏸️ Standby' :
                               task.status === 'review' ? '⏳ Review' : task.status}
                            </span>
                            {task.trello_id && <span className="search-result-trello">🔗 {task.trello_id}</span>}
                          </div>
                        </div>
                      ))}
                      {filteredTasks.length > 10 && (
                        <div className="search-results-more">
                          + {filteredTasks.length - 10} autre(s) résultat(s)
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {showSearchResults && filteredTasks.length === 0 && taskSearchQuery.trim() && (
                  <div className="search-results search-results-empty">
                    <div className="search-results-header">
                      <span>Aucun résultat</span>
                      <button onClick={() => setShowSearchResults(false)}>✕</button>
                    </div>
                    <div className="search-no-results">
                      Aucune tâche ne correspond à "{taskSearchQuery}"
                    </div>
                  </div>
                )}
              </div>
              
              {/* Actions principales - toujours visibles */}
              <div className="navbar-actions-primary">
                {recognition && (
                  <button
                    className={`btn-nav btn-nav-icon btn-nav-voice ${isListening ? 'listening' : ''}`}
                    onClick={toggleSpeechRecognition}
                    title="Commandes vocales (Ctrl+Shift+V)"
                    disabled={!voiceCommandsEnabled}
                  >
                    <span className={isListening ? 'pulse-animation' : ''}>🎤</span>
                    <span className="btn-label">{isListening ? 'Écoute...' : 'Voix'}</span>
                    {voiceCommandText && (
                      <span className="voice-transcript" title={voiceCommandText}>
                        {voiceCommandText.length > 30 ? voiceCommandText.substring(0, 30) + '...' : voiceCommandText}
                      </span>
                    )}
                    {voiceError && (
                      <span className="voice-error" title={voiceError}>
                        ⚠️ {voiceError}
                      </span>
                    )}
                  </button>
                )}
                <button 
                  className="btn-nav btn-nav-primary btn-nav-priority" 
                  onClick={() => setShowCreateModal(true)}
                  title="Créer une tâche (Ctrl+K)"
                >
                  <span>➕</span>
                  <span className="btn-label">Tâche</span>
                </button>
              </div>

              {/* Menu hamburger - visible sur tous les écrans */}
              <button 
                className="btn-nav btn-nav-icon btn-nav-hamburger"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                title="Menu"
                aria-label="Menu"
              >
                <span>{showMobileMenu ? '✕' : '☰'}</span>
              </button>

              {/* Menu mobile déroulant avec catégories */}
              {showMobileMenu && (
                <>
                  <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}></div>
                  <div className="mobile-menu-dropdown">
                    {/* En-tête du menu */}
                    <div className="mobile-menu-header">
                      <h3 className="mobile-menu-title">Menu</h3>
                      <button 
                        className="mobile-menu-close"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Catégorie : Commandes Vocales - EN PREMIER POUR VISIBILITÉ */}
                    {voiceCommandsEnabled && (
                      <div className="mobile-menu-category mobile-menu-category-voice">
                        <div className="mobile-menu-category-title">
                          🎤 Commandes Vocales
                          {isListening && <span className="voice-status-indicator pulse-animation">●</span>}
                        </div>
                        <div style={{ 
                          padding: '12px', 
                          marginBottom: '8px',
                          backgroundColor: isListening ? 'var(--color-warning)' : 'var(--color-secondary)',
                          borderRadius: '8px',
                          border: `2px solid ${isListening ? 'var(--color-primary)' : 'var(--color-border)'}`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '1.2em' }}>{isListening ? '🎤' : '🎤'}</span>
                            <span style={{ fontWeight: 'bold' }}>
                              {isListening ? 'Écoute active...' : 'Prêt à écouter'}
                            </span>
                          </div>
                          {voiceCommandText && (
                            <div style={{ 
                              fontSize: '0.9em', 
                              color: 'var(--color-text-secondary)',
                              marginTop: '4px',
                              fontStyle: 'italic'
                            }}>
                              "{voiceCommandText}"
                            </div>
                          )}
                          {voiceError && (
                            <div style={{ 
                              fontSize: '0.85em', 
                              color: 'var(--color-error)',
                              marginTop: '4px',
                              padding: '4px',
                              backgroundColor: 'rgba(255, 0, 0, 0.1)',
                              borderRadius: '4px'
                            }}>
                              ⚠️ {voiceError}
                            </div>
                          )}
                        </div>
                        <button 
                          className={`mobile-menu-item ${isListening ? 'mobile-menu-item-active' : ''}`}
                          onClick={async () => {
                            await toggleSpeechRecognition()
                          }}
                        >
                          <span className="mobile-menu-icon">{isListening ? '⏹️' : '▶️'}</span>
                          <span className="mobile-menu-label">
                            {isListening ? 'Arrêter l\'écoute' : 'Démarrer l\'écoute'}
                          </span>
                        </button>
                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowVoiceHelpModal(true)
                            setShowMobileMenu(false)
                          }}
                        >
                          <span className="mobile-menu-icon">❓</span>
                          <span className="mobile-menu-label">Aide & Commandes</span>
                        </button>
                        <div style={{ 
                          padding: '8px', 
                          marginTop: '8px',
                          fontSize: '0.85em',
                          color: 'var(--color-text-secondary)',
                          backgroundColor: 'var(--color-secondary)',
                          borderRadius: '4px'
                        }}>
                          <div style={{ marginBottom: '4px' }}>
                            <strong>Raccourci :</strong> <kbd>Ctrl+Shift+V</kbd>
                          </div>
                          <div>
                            <strong>Exemples :</strong> "calendrier", "statistiques", "créer tâche"
                          </div>
                        </div>
                      </div>
                    )}

                    {!voiceCommandsEnabled && (
                      <div className="mobile-menu-category">
                        <div className="mobile-menu-category-title">🎤 Commandes Vocales</div>
                        <div style={{ 
                          padding: '12px', 
                          backgroundColor: 'var(--color-secondary)',
                          borderRadius: '8px',
                          color: 'var(--color-text-secondary)'
                        }}>
                          <div style={{ marginBottom: '8px' }}>
                            ⚠️ Commandes vocales non disponibles
                          </div>
                          <div style={{ fontSize: '0.85em' }}>
                            Utilisez Chrome, Edge ou Safari pour activer les commandes vocales.
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mobile-menu-divider"></div>

                    {/* Catégorie : Rapports & Résumés */}
                    <div className="mobile-menu-category">
                      <div className="mobile-menu-category-title">📊 Rapports & Résumés</div>
                      <button 
                        className="mobile-menu-item"
                        onClick={() => {
                          fetchDailySummary()
                          setShowMobileMenu(false)
                        }}
                      >
                        <span className="mobile-menu-icon">📋</span>
                        <span className="mobile-menu-label">Daily Summary</span>
                      </button>
                      <button 
                        className="mobile-menu-item"
                        onClick={() => {
                          fetchWeeklySummary()
                          setShowMobileMenu(false)
                        }}
                      >
                        <span className="mobile-menu-icon">📊</span>
                        <span className="mobile-menu-label">Weekly Summary</span>
                      </button>
                      <button 
                        className="mobile-menu-item"
                        onClick={() => {
                          fetchDashboardStats()
                          setShowStatsModal(true)
                          setShowMobileMenu(false)
                        }}
                      >
                        <span className="mobile-menu-icon">📈</span>
                        <span className="mobile-menu-label">Statistiques</span>
                      </button>
                    </div>

                    {/* Catégorie : Organisation */}
                    <div className="mobile-menu-category">
                      <div className="mobile-menu-category-title">🗂️ Organisation</div>
                      <button 
                        className="mobile-menu-item"
                        onClick={() => {
                          setShowWorkflowModal(true)
                          setShowMobileMenu(false)
                        }}
                      >
                        <span className="mobile-menu-icon">📋</span>
                        <span className="mobile-menu-label">Workflows</span>
                      </button>
                      <button 
                        className="mobile-menu-item"
                        onClick={() => {
                          setShowCalendarModal(true)
                          setShowMobileMenu(false)
                        }}
                      >
                        <span className="mobile-menu-icon">📅</span>
                        <span className="mobile-menu-label">Calendrier</span>
                      </button>
                      <button 
                        className="mobile-menu-item"
                        onClick={() => {
                          setShowTimelineModal(true)
                          setShowMobileMenu(false)
                        }}
                      >
                        <span className="mobile-menu-icon">📅</span>
                        <span className="mobile-menu-label">Timeline</span>
                      </button>
                      <button 
                        className="mobile-menu-item"
                        onClick={() => {
                          fetchTags()
                          setShowTagsModal(true)
                          setShowMobileMenu(false)
                        }}
                      >
                        <span className="mobile-menu-icon">🏷️</span>
                        <span className="mobile-menu-label">Tags</span>
                      </button>
                    </div>

                    {/* Catégorie : Productivité */}
                    <div className="mobile-menu-category">
                      <div className="mobile-menu-category-title">⚡ Productivité</div>
                      <button 
                        className="mobile-menu-item"
                        onClick={() => {
                          fetchTemplates()
                          setShowTemplatesModal(true)
                          setShowMobileMenu(false)
                        }}
                      >
                        <span className="mobile-menu-icon">📄</span>
                        <span className="mobile-menu-label">Templates</span>
                      </button>
                      <button 
                        className="mobile-menu-item"
                        onClick={() => {
                          fetchNotes()
                          setShowNotesModal(true)
                          setShowMobileMenu(false)
                        }}
                      >
                        <span className="mobile-menu-icon">📝</span>
                        <span className="mobile-menu-label">Notes</span>
                      </button>
                      <button 
                        className="mobile-menu-item"
                        onClick={() => {
                          fetchTimeComparisonStats()
                          setShowTimeAwarenessModal(true)
                          setShowMobileMenu(false)
                        }}
                      >
                        <span className="mobile-menu-icon">⏱️</span>
                        <span className="mobile-menu-label">Time Awareness</span>
                      </button>
                    </div>

                    {/* Catégorie : Bien-être */}
                    <div className="mobile-menu-category">
                      <div className="mobile-menu-category-title">💚 Bien-être</div>
                      <button 
                        className="mobile-menu-item"
                        onClick={() => {
                          fetchBreaks()
                          setShowBreaksModal(true)
                          setShowMobileMenu(false)
                        }}
                      >
                        <span className="mobile-menu-icon">☕</span>
                        <span className="mobile-menu-label">Pauses</span>
                      </button>
                      <button 
                        className="mobile-menu-item"
                        onClick={() => {
                          fetchEnergyData()
                          setShowEnergyModal(true)
                          setShowMobileMenu(false)
                        }}
                      >
                        <span className="mobile-menu-icon">⚡</span>
                        <span className="mobile-menu-label">Energy</span>
                      </button>
                      <button 
                        className="mobile-menu-item"
                        onClick={() => {
                          fetchPendingReminders()
                          setShowRemindersModal(true)
                          setShowMobileMenu(false)
                        }}
                      >
                        <span className="mobile-menu-icon">🔔</span>
                        <span className="mobile-menu-label">Rappels</span>
                      </button>
                    </div>

                    {/* Catégorie : Gestion */}
                    <div className="mobile-menu-category">
                      <div className="mobile-menu-category-title">🗑️ Gestion</div>
                      <button 
                        className="mobile-menu-item"
                        onClick={() => {
                          fetchDeletedTasks()
                          setShowTrashModal(true)
                          setShowMobileMenu(false)
                        }}
                      >
                        <span className="mobile-menu-icon">🗑️</span>
                        <span className="mobile-menu-label">Corbeille</span>
                      </button>
                    </div>

                    <div className="mobile-menu-divider"></div>

                    {/* Catégorie : Paramètres */}
                    <div className="mobile-menu-category">
                      <div className="mobile-menu-category-title">⚙️ Paramètres</div>
                      <button 
                        className="mobile-menu-item"
                        onClick={() => {
                          setShowNotificationModal(true)
                          setShowMobileMenu(false)
                        }}
                      >
                        <span className="mobile-menu-icon">🔔</span>
                        <span className="mobile-menu-label">Notifications</span>
                      </button>
                      <button 
                        className="mobile-menu-item"
                        onClick={() => {
                          setDarkMode(!darkMode)
                          setShowMobileMenu(false)
                        }}
                      >
                        <span className="mobile-menu-icon">{darkMode ? '☀️' : '🌙'}</span>
                        <span className="mobile-menu-label">{darkMode ? 'Mode clair' : 'Mode sombre'}</span>
                      </button>
                      <button 
                        className="mobile-menu-item mobile-menu-item-danger"
                        onClick={() => {
                          logout()
                          setShowMobileMenu(false)
                        }}
                      >
                        <span className="mobile-menu-icon">🚪</span>
                        <span className="mobile-menu-label">Déconnexion</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Menu utilisateur desktop */}
              <div className="navbar-user-menu">
                <button 
                  className="btn-nav btn-nav-icon btn-nav-user-menu"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title="Menu utilisateur"
                  aria-label="Menu utilisateur"
                >
                  <span>⚙️</span>
                </button>
                {showUserMenu && (
                  <>
                    <div className="user-menu-overlay" onClick={() => setShowUserMenu(false)}></div>
                    <div className="user-menu-dropdown">
                      <button 
                        className={`user-menu-item ${notificationsEnabled ? 'active' : ''}`}
                        onClick={() => {
                          setShowNotificationModal(true)
                          setShowUserMenu(false)
                        }}
                      >
                        <span className="user-menu-icon">🔔</span>
                        <span className="user-menu-label">Notifications</span>
                      </button>
                      <button 
                        className="user-menu-item"
                        onClick={() => {
                          setDarkMode(!darkMode)
                          setShowUserMenu(false)
                        }}
                      >
                        <span className="user-menu-icon">{darkMode ? '☀️' : '🌙'}</span>
                        <span className="user-menu-label">{darkMode ? 'Mode clair' : 'Mode sombre'}</span>
                      </button>
                      <div className="user-menu-divider"></div>
                      <button 
                        className="user-menu-item user-menu-item-danger"
                        onClick={() => {
                          logout()
                          setShowUserMenu(false)
                        }}
                      >
                        <span className="user-menu-icon">🚪</span>
                        <span className="user-menu-label">Déconnexion</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
        </nav>

      {tasks.filter(t => t.status === 'in_progress').length === 0 && tasks.length > 0 && (
        <div className="taskflow-alert taskflow-alert-warning">
          <div className="alert-content">
            <span className="alert-icon">⚠️</span>
            <div className="alert-text">
              <strong>Aucune tâche active !</strong> 
              <span>Pense à prendre un nouveau ticket sur Trello → Tests-Auto ou MEP Tech/Backlog/Sprint.</span>
            </div>
            </div>
            <button 
            className="btn-alert"
              onClick={() => setShowReminderModal(true)}
            >
              Détails
            </button>
        </div>
      )}

      <div className="taskflow-container">
        <div className="taskflow-grid">
          <div className="taskflow-column">
            <div className="taskflow-card taskflow-card-primary">
              <div 
                className="taskflow-card-header taskflow-card-header-clickable"
                onClick={() => toggleColumn('in_progress')}
                title={columnStates.in_progress ? 'Réduire' : 'Étendre'}
              >
                <span className="card-toggle-icon">{columnStates.in_progress ? '▼' : '▶'}</span>
                <span className="card-icon">🔄</span>
                <h3 className="card-title">En cours</h3>
                <span className="card-count">{tasks.filter(t => t.status === 'in_progress').length}</span>
              </div>
              {columnStates.in_progress && (
                <div className="taskflow-card-body">
                {(showAllTasks.in_progress 
                  ? tasks.filter(t => t.status === 'in_progress')
                  : tasks.filter(t => t.status === 'in_progress').slice(0, 3)
                ).map(task => (
                  <div key={task.id} className={`task-item task-item-clickable task-item-status-${task.status}`} onClick={() => {
                    setSelectedTaskDetail(task)
                    fetchSubtasks(task.id)
                    setShowTaskDetailModal(true)
                  }}>
                    <div className="task-header">
                      <h4 className="task-title">{task.title}</h4>
                      {task.trello_id && (
                        <span className="task-trello">🔗 {task.trello_id}</span>
                      )}
                    </div>
                      {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    {(() => {
                      const dateInfo = getTaskDateInfo(task)
                      if (dateInfo && dateInfo.date) {
                        return (
                          <div className="task-due-date">
                            {dateInfo.icon} {dateInfo.label}: {dateInfo.date.toLocaleString('fr-FR', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )
                      }
                      return null
                    })()}
                    <div className="task-badges">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                    {subtasks[task.id] && subtasks[task.id].length > 0 && (
                      <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'rgba(33, 128, 141, 0.1)', borderRadius: '4px', fontSize: '0.85em' }}>
                        <strong>Sous-tâches:</strong> {subtasks[task.id].filter((s: any) => s.status === 'done').length}/{subtasks[task.id].length} terminées
                      </div>
                    )}
                    <div className="task-actions" onClick={(e) => e.stopPropagation()}>
                        {getTaskActions(task)}
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status === 'in_progress').length > 3 && !showAllTasks.in_progress && (
                  <div 
                    className="taskflow-more taskflow-more-clickable"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAllTasks({...showAllTasks, in_progress: true})
                    }}
                  >
                    ... et {tasks.filter(t => t.status === 'in_progress').length - 3} autres
                  </div>
                )}
                {tasks.filter(t => t.status === 'in_progress').length > 3 && showAllTasks.in_progress && (
                  <button 
                    className="btn-taskflow-more"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAllTasks({...showAllTasks, in_progress: false})
                    }}
                  >
                    Voir moins
                  </button>
                )}
                {tasks.filter(t => t.status === 'in_progress').length === 0 && (
                  <div className="taskflow-empty">
                    <span>Aucune tâche en cours</span>
                  </div>
                )}
              </div>
              )}
            </div>
          </div>

          <div className="taskflow-column">
            <div className="taskflow-card taskflow-card-secondary">
              <div 
                className="taskflow-card-header taskflow-card-header-clickable"
                onClick={() => toggleColumn('todo')}
                title={columnStates.todo ? 'Réduire' : 'Étendre'}
              >
                <span className="card-toggle-icon">{columnStates.todo ? '▼' : '▶'}</span>
                <span className="card-icon">📋</span>
                <h3 className="card-title">À faire</h3>
                <span className="card-count">{tasks.filter(t => t.status === 'todo').length}</span>
              </div>
              {columnStates.todo && (
                <div className="taskflow-card-body taskflow-card-body-scrollable">
                {(showAllTasks.todo 
                  ? tasks.filter(t => t.status === 'todo')
                  : tasks.filter(t => t.status === 'todo').slice(0, 3)
                ).map(task => (
                  <div key={task.id} className={`task-item task-item-clickable task-item-status-${task.status}`} onClick={() => {
                    setSelectedTaskDetail(task)
                    fetchSubtasks(task.id)
                    setShowTaskDetailModal(true)
                  }}>
                    <div className="task-header">
                      <h4 className="task-title">{task.title}</h4>
                      {task.trello_id && (
                        <span className="task-trello">🔗 {task.trello_id}</span>
                      )}
                    </div>
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    {(() => {
                      const dateInfo = getTaskDateInfo(task)
                      if (dateInfo && dateInfo.date) {
                        return (
                          <div className="task-due-date">
                            {dateInfo.icon} {dateInfo.label}: {dateInfo.date.toLocaleString('fr-FR', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )
                      }
                      return null
                    })()}
                    <div className="task-badges">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                    {subtasks[task.id] && subtasks[task.id].length > 0 && (
                      <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'rgba(33, 128, 141, 0.1)', borderRadius: '4px', fontSize: '0.85em' }}>
                        <strong>Sous-tâches:</strong> {subtasks[task.id].filter((s: any) => s.status === 'done').length}/{subtasks[task.id].length} terminées
                      </div>
                    )}
                    <div className="task-actions" onClick={(e) => e.stopPropagation()}>
                        {getTaskActions(task)}
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status === 'todo').length > 3 && !showAllTasks.todo && (
                  <div 
                    className="taskflow-more taskflow-more-clickable"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAllTasks({...showAllTasks, todo: true})
                    }}
                  >
                    ... et {tasks.filter(t => t.status === 'todo').length - 3} autres
                  </div>
                )}
                {tasks.filter(t => t.status === 'todo').length > 3 && showAllTasks.todo && (
                  <button 
                    className="btn-taskflow-more"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAllTasks({...showAllTasks, todo: false})
                    }}
                  >
                    Voir moins
                  </button>
                )}
                {tasks.filter(t => t.status === 'todo').length === 0 && (
                  <div className="taskflow-empty">
                    <span>Aucune tâche à faire</span>
              </div>
                )}
              </div>
              )}
            </div>
          </div>

          <div className="taskflow-column">
            <div className="taskflow-card taskflow-card-warning">
              <div 
                className="taskflow-card-header taskflow-card-header-clickable"
                onClick={() => toggleColumn('standby')}
                title={columnStates.standby ? 'Réduire' : 'Étendre'}
              >
                <span className="card-toggle-icon">{columnStates.standby ? '▼' : '▶'}</span>
                <span className="card-icon">⏸️</span>
                <h3 className="card-title">Standby</h3>
                <span className="card-count">{tasks.filter(t => t.status === 'standby').length}</span>
              </div>
              {columnStates.standby && (
                <div className="taskflow-card-body">
                {(showAllTasks.standby 
                  ? tasks.filter(t => t.status === 'standby')
                  : tasks.filter(t => t.status === 'standby').slice(0, 3)
                ).map(task => (
                  <div key={task.id} className={`task-item task-item-clickable task-item-status-${task.status}`} onClick={() => {
                    setSelectedTaskDetail(task)
                    fetchSubtasks(task.id)
                    setShowTaskDetailModal(true)
                  }}>
                    <div className="task-header">
                      <h4 className="task-title">{task.title}</h4>
                      {task.trello_id && (
                        <span className="task-trello">🔗 {task.trello_id}</span>
                      )}
                    </div>
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    {(() => {
                      const dateInfo = getTaskDateInfo(task)
                      if (dateInfo && dateInfo.date) {
                        return (
                          <div className="task-due-date">
                            {dateInfo.icon} {dateInfo.label}: {dateInfo.date.toLocaleString('fr-FR', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )
                      }
                      return null
                    })()}
                    <div className="task-badges">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                    {subtasks[task.id] && subtasks[task.id].length > 0 && (
                      <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'rgba(33, 128, 141, 0.1)', borderRadius: '4px', fontSize: '0.85em' }}>
                        <strong>Sous-tâches:</strong> {subtasks[task.id].filter((s: any) => s.status === 'done').length}/{subtasks[task.id].length} terminées
                      </div>
                    )}
                    <div className="task-actions" onClick={(e) => e.stopPropagation()}>
                        {getTaskActions(task)}
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status === 'standby').length > 3 && !showAllTasks.standby && (
                  <div 
                    className="taskflow-more taskflow-more-clickable"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAllTasks({...showAllTasks, standby: true})
                    }}
                  >
                    ... et {tasks.filter(t => t.status === 'standby').length - 3} autres
              </div>
                )}
                {tasks.filter(t => t.status === 'standby').length > 3 && showAllTasks.standby && (
                  <button 
                    className="btn-taskflow-more"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAllTasks({...showAllTasks, standby: false})
                    }}
                  >
                    Voir moins
                  </button>
                )}
                {tasks.filter(t => t.status === 'standby').length === 0 && (
                  <div className="taskflow-empty">
                    <span>Aucune tâche en standby</span>
                  </div>
                )}
              </div>
              )}
            </div>
          </div>

          <div className="taskflow-column">
            <div className="taskflow-card taskflow-card-danger">
              <div 
                className="taskflow-card-header taskflow-card-header-clickable"
                onClick={() => toggleColumn('blocked')}
                title={columnStates.blocked ? 'Réduire' : 'Étendre'}
              >
                <span className="card-toggle-icon">{columnStates.blocked ? '▼' : '▶'}</span>
                <span className="card-icon">🚫</span>
                <h3 className="card-title">Bloqué</h3>
                <span className="card-count">{tasks.filter(t => t.status === 'blocked').length}</span>
              </div>
              {columnStates.blocked && (
                <div className="taskflow-card-body">
                {(showAllTasks.blocked 
                  ? tasks.filter(t => t.status === 'blocked')
                  : tasks.filter(t => t.status === 'blocked').slice(0, 3)
                ).map(task => (
                  <div key={task.id} className={`task-item task-item-clickable task-item-status-${task.status}`} onClick={() => {
                    setSelectedTaskDetail(task)
                    fetchSubtasks(task.id)
                    setShowTaskDetailModal(true)
                  }}>
                    <div className="task-header">
                      <h4 className="task-title">{task.title}</h4>
                      {task.trello_id && (
                        <span className="task-trello">🔗 {task.trello_id}</span>
                      )}
                    </div>
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                      )}
                      {task.blocked_reason && (
                      <div className="task-blocked-reason">
                          <strong>Blocage:</strong> {task.blocked_reason}
                        </div>
                      )}
                    {(() => {
                      const dateInfo = getTaskDateInfo(task)
                      if (dateInfo && dateInfo.date) {
                        return (
                          <div className="task-due-date">
                            {dateInfo.icon} {dateInfo.label}: {dateInfo.date.toLocaleString('fr-FR', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )
                      }
                      return null
                    })()}
                    <div className="task-badges">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                    {subtasks[task.id] && subtasks[task.id].length > 0 && (
                      <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'rgba(33, 128, 141, 0.1)', borderRadius: '4px', fontSize: '0.85em' }}>
                        <strong>Sous-tâches:</strong> {subtasks[task.id].filter((s: any) => s.status === 'done').length}/{subtasks[task.id].length} terminées
                      </div>
                    )}
                    <div className="task-actions" onClick={(e) => e.stopPropagation()}>
                        {getTaskActions(task)}
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status === 'blocked').length > 3 && !showAllTasks.blocked && (
                  <div 
                    className="taskflow-more taskflow-more-clickable"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAllTasks({...showAllTasks, blocked: true})
                    }}
                  >
                    ... et {tasks.filter(t => t.status === 'blocked').length - 3} autres
              </div>
                )}
                {tasks.filter(t => t.status === 'blocked').length > 3 && showAllTasks.blocked && (
                  <button 
                    className="btn-taskflow-more"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAllTasks({...showAllTasks, blocked: false})
                    }}
                  >
                    Voir moins
                  </button>
                )}
                {tasks.filter(t => t.status === 'blocked').length === 0 && (
                  <div className="taskflow-empty">
                    <span>Aucune tâche bloquée</span>
                  </div>
                )}
              </div>
              )}
            </div>
          </div>

          <div className="taskflow-column">
            <div className="taskflow-card taskflow-card-info">
              <div 
                className="taskflow-card-header taskflow-card-header-clickable"
                onClick={() => toggleColumn('review')}
                title={columnStates.review ? 'Réduire' : 'Étendre'}
              >
                <span className="card-toggle-icon">{columnStates.review ? '▼' : '▶'}</span>
                <span className="card-icon">⏳</span>
                <h3 className="card-title">En Review</h3>
                <span className="card-count">{tasks.filter(t => t.status === 'review').length}</span>
                  </div>
              {columnStates.review && (
                <div className="taskflow-card-body">
                {(showAllTasks.review 
                  ? tasks.filter(t => t.status === 'review')
                  : tasks.filter(t => t.status === 'review').slice(0, 3)
                ).map(task => (
                  <div key={task.id} className={`task-item task-item-clickable task-item-status-${task.status}`} onClick={() => {
                    setSelectedTaskDetail(task)
                    fetchSubtasks(task.id)
                    setShowTaskDetailModal(true)
                  }}>
                    <div className="task-header">
                      <h4 className="task-title">{task.title}</h4>
                          {task.trello_id && (
                        <span className="task-trello">🔗 {task.trello_id}</span>
                      )}
                    </div>
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    {(() => {
                      const dateInfo = getTaskDateInfo(task)
                      if (dateInfo && dateInfo.date) {
                        return (
                          <div className="task-due-date">
                            {dateInfo.icon} {dateInfo.label}: {dateInfo.date.toLocaleString('fr-FR', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )
                      }
                      return null
                    })()}
                    <div className="task-badges">
                            {getStatusBadge(task.status)}
                            {getPriorityBadge(task.priority)}
                          </div>
                    {subtasks[task.id] && subtasks[task.id].length > 0 && (
                      <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'rgba(33, 128, 141, 0.1)', borderRadius: '4px', fontSize: '0.85em' }}>
                        <strong>Sous-tâches:</strong> {subtasks[task.id].filter((s: any) => s.status === 'done').length}/{subtasks[task.id].length} terminées
                      </div>
                    )}
                    <div className="task-actions" onClick={(e) => e.stopPropagation()}>
                            {getTaskActions(task)}
                        </div>
                      </div>
                    ))}
                {tasks.filter(t => t.status === 'review').length > 3 && !showAllTasks.review && (
                  <div 
                    className="taskflow-more taskflow-more-clickable"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAllTasks({...showAllTasks, review: true})
                    }}
                  >
                    ... et {tasks.filter(t => t.status === 'review').length - 3} autres
                  </div>
                )}
                {tasks.filter(t => t.status === 'review').length > 3 && showAllTasks.review && (
                  <button 
                    className="btn-taskflow-more"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAllTasks({...showAllTasks, review: false})
                    }}
                  >
                    Voir moins
                  </button>
                )}
                {tasks.filter(t => t.status === 'review').length === 0 && (
                  <div className="taskflow-empty">
                    <span>Aucune tâche en review</span>
                  </div>
                )}
              </div>
              )}
                </div>
              </div>

          <div className="taskflow-column">
            <div className="taskflow-card taskflow-card-success">
              <div 
                className="taskflow-card-header taskflow-card-header-clickable"
                onClick={() => toggleColumn('done')}
                title={columnStates.done ? 'Réduire' : 'Étendre'}
              >
                <span className="card-toggle-icon">{columnStates.done ? '▼' : '▶'}</span>
                <span className="card-icon">✅</span>
                <h3 className="card-title">Terminé</h3>
                <span className="card-count">{tasks.filter(t => t.status === 'done').length}</span>
                  </div>
              {columnStates.done && (
                <div className="taskflow-card-body">
                {(showAllTasks.done 
                  ? tasks.filter(t => t.status === 'done')
                  : tasks.filter(t => t.status === 'done').slice(0, 3)
                ).map(task => (
                  <div key={task.id} className={`task-item task-item-clickable task-item-status-${task.status}`} onClick={() => {
                    setSelectedTaskDetail(task)
                    fetchSubtasks(task.id)
                    setShowTaskDetailModal(true)
                  }}>
                    <div className="task-header">
                      <h4 className="task-title">{task.title}</h4>
                          {task.trello_id && (
                        <span className="task-trello">🔗 {task.trello_id}</span>
                      )}
                    </div>
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    {(() => {
                      const dateInfo = getTaskDateInfo(task)
                      if (dateInfo && dateInfo.date) {
                        return (
                          <div className="task-due-date">
                            {dateInfo.icon} {dateInfo.label}: {dateInfo.date.toLocaleString('fr-FR', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )
                      }
                      return null
                    })()}
                    <div className="task-badges">
                              {getStatusBadge(task.status)}
                              {getPriorityBadge(task.priority)}
                            </div>
                    {subtasks[task.id] && subtasks[task.id].length > 0 && (
                      <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'rgba(33, 128, 141, 0.1)', borderRadius: '4px', fontSize: '0.85em' }}>
                        <strong>Sous-tâches:</strong> {subtasks[task.id].filter((s: any) => s.status === 'done').length}/{subtasks[task.id].length} terminées
                          </div>
                    )}
                    <div className="task-actions" onClick={(e) => e.stopPropagation()}>
                      {getTaskActions(task)}
                        </div>
                      </div>
                    ))}
                {tasks.filter(t => t.status === 'done').length > 3 && !showAllTasks.done && (
                  <div 
                    className="taskflow-more taskflow-more-clickable"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAllTasks({...showAllTasks, done: true})
                    }}
                  >
                    ... et {tasks.filter(t => t.status === 'done').length - 3} autres
                  </div>
                )}
                {tasks.filter(t => t.status === 'done').length > 3 && showAllTasks.done && (
                  <button 
                    className="btn-taskflow-more"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAllTasks({...showAllTasks, done: false})
                    }}
                  >
                    Voir moins
                  </button>
                )}
                {tasks.filter(t => t.status === 'done').length === 0 && (
                  <div className="taskflow-empty">
                    <span>Aucune tâche terminée</span>
                  </div>
                )}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>

      {/* FAB - Floating Action Button - Actions rapides uniquement */}
      <div className={`fab-container ${fabOpen ? 'open' : ''}`}>
        <div className="fab-menu">
          {/* Actions rapides principales */}
          {!fabCategory && (
            <>
              <button 
                className="fab-item fab-item-primary"
                onClick={() => {
                  setShowCreateModal(true)
                  setFabOpen(false)
                }}
              >
                <span className="fab-icon">➕</span>
                <span className="fab-label">Nouvelle tâche</span>
              </button>
              {voiceCommandsEnabled && (
                <button 
                  className={`fab-item fab-item-secondary ${isListening ? 'listening' : ''}`}
                  onClick={() => {
                    toggleSpeechRecognition()
                    setFabOpen(false)
                  }}
                >
                  <span className={`fab-icon ${isListening ? 'pulse-animation' : ''}`}>🎤</span>
                  <span className="fab-label">{isListening ? 'Écoute...' : 'Commandes vocales'}</span>
                </button>
              )}
              <button 
                className="fab-item fab-item-success"
                onClick={() => {
                  fetchDailySummary()
                  setFabOpen(false)
                }}
              >
                <span className="fab-icon">📋</span>
                <span className="fab-label">Daily Summary</span>
              </button>
              <button 
                className="fab-item fab-item-info"
                onClick={() => {
                  fetchWeeklySummary()
                  setFabOpen(false)
                }}
              >
                <span className="fab-icon">📊</span>
                <span className="fab-label">Weekly Summary</span>
              </button>
              <button 
                className="fab-item fab-item-secondary"
                onClick={() => {
                  fetchBreaks()
                  setShowBreaksModal(true)
                  setFabOpen(false)
                }}
              >
                <span className="fab-icon">☕</span>
                <span className="fab-label">Pauses</span>
              </button>
              <button 
                className="fab-item fab-item-success"
                onClick={() => {
                  fetchEnergyData()
                  setShowEnergyModal(true)
                  setFabOpen(false)
                }}
              >
                <span className="fab-icon">⚡</span>
                <span className="fab-label">Energy</span>
              </button>
              <button 
                className="fab-item fab-item-warning"
                onClick={() => {
                  fetchPendingReminders()
                  setShowRemindersModal(true)
                  setFabOpen(false)
                }}
              >
                <span className="fab-icon">🔔</span>
                <span className="fab-label">Rappels</span>
              </button>
              <button 
                className="fab-item fab-item-info fab-item-category"
                onClick={() => setFabCategory('more')}
              >
                <span className="fab-icon">⋯</span>
                <span className="fab-label">Plus d'actions</span>
              </button>
            </>
          )}
          
          {/* Sous-menu "Plus d'actions" */}
          {fabCategory === 'more' && (
            <>
              <button 
                className="fab-item fab-item-back"
                onClick={() => setFabCategory(null)}
              >
                <span className="fab-icon">←</span>
                <span className="fab-label">Retour</span>
              </button>
              <button 
                className="fab-item fab-item-warning"
                onClick={() => {
                  setShowWorkflowModal(true)
                  setFabOpen(false)
                  setFabCategory(null)
                }}
              >
                <span className="fab-icon">📋</span>
                <span className="fab-label">Workflows</span>
              </button>
              <button 
                className="fab-item fab-item-info"
                onClick={() => {
                  setShowCalendarModal(true)
                  setFabOpen(false)
                  setFabCategory(null)
                }}
              >
                <span className="fab-icon">📅</span>
                <span className="fab-label">Calendrier</span>
              </button>
              <button 
                className="fab-item fab-item-secondary"
                onClick={() => {
                  fetchDeletedTasks()
                  setShowTrashModal(true)
                  setFabOpen(false)
                  setFabCategory(null)
                }}
              >
                <span className="fab-icon">🗑️</span>
                <span className="fab-label">Corbeille</span>
              </button>
              <button 
                className="fab-item fab-item-info"
                onClick={() => {
                  fetchTimeComparisonStats()
                  setShowTimeAwarenessModal(true)
                  setFabOpen(false)
                  setFabCategory(null)
                }}
              >
                <span className="fab-icon">⏱️</span>
                <span className="fab-label">Time Awareness</span>
              </button>
              <button 
                className="fab-item fab-item-success"
                onClick={() => {
                  fetchTemplates()
                  setShowTemplatesModal(true)
                  setFabOpen(false)
                  setFabCategory(null)
                }}
              >
                <span className="fab-icon">📄</span>
                <span className="fab-label">Templates</span>
              </button>
              <button 
                className="fab-item fab-item-warning"
                onClick={() => {
                  fetchTags()
                  setShowTagsModal(true)
                  setFabOpen(false)
                  setFabCategory(null)
                }}
              >
                <span className="fab-icon">🏷️</span>
                <span className="fab-label">Tags</span>
              </button>
              <button 
                className="fab-item fab-item-info"
                onClick={() => {
                  fetchNotes()
                  setShowNotesModal(true)
                  setFabOpen(false)
                  setFabCategory(null)
                }}
              >
                <span className="fab-icon">📝</span>
                <span className="fab-label">Notes</span>
              </button>
              <button 
                className="fab-item fab-item-primary"
                onClick={() => {
                  fetchDashboardStats()
                  setShowStatsModal(true)
                  setFabOpen(false)
                  setFabCategory(null)
                }}
              >
                <span className="fab-icon">📊</span>
                <span className="fab-label">Statistiques</span>
              </button>
              <button 
                className="fab-item fab-item-info"
                onClick={() => {
                  setShowTimelineModal(true)
                  setFabOpen(false)
                  setFabCategory(null)
                }}
              >
                <span className="fab-icon">📅</span>
                <span className="fab-label">Timeline</span>
              </button>
            </>
          )}
        </div>
        <button 
          className={`fab-main ${fabOpen ? 'open' : ''}`}
          onClick={() => {
            setFabOpen(!fabOpen)
            if (!fabOpen) {
              setFabCategory(null)
            }
          }}
          aria-label="Menu actions rapides"
        >
          <span className="fab-main-icon">{fabOpen ? '✕' : '➕'}</span>
        </button>
      </div>

      {/* Modal Création tâche */}
      {showCreateModal && (
        <div className="taskflow-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="taskflow-modal" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">➕ Nouvelle tâche</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
              </div>
            <div className="taskflow-modal-body">
              <div className="form-group-modern">
                <label className="form-label-modern">Titre *</label>
                  <input
                    type="text"
                  className="form-input-modern"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    placeholder="Ex: Implémenter API Platform"
                  />
                </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Description</label>
                  <textarea
                  className="form-input-modern"
                    rows={3}
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    placeholder="Détails de la tâche..."
                  />
                </div>
              <div className="form-group-modern">
                <label className="form-label-modern">ID Ticket Trello (optionnel)</label>
                  <input
                    type="text"
                  className="form-input-modern"
                    value={newTask.trello_id}
                    onChange={(e) => setNewTask({...newTask, trello_id: e.target.value})}
                    placeholder="Ex: abc123def456"
                  />
                </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Priorité</label>
                  <select
                  className="form-input-modern"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              <div className="form-group-modern" style={{ position: 'relative' }}>
                <label className="form-label-modern">Projet (optionnel)</label>
                <input
                  type="text"
                  className="form-input-modern"
                  value={newTask.project}
                  onChange={(e) => {
                    const value = e.target.value
                    setNewTask({...newTask, project: value})
                    if (value.length > 0) {
                      const filtered = availableProjects.filter(p => 
                        p.toLowerCase().includes(value.toLowerCase())
                      )
                      setProjectSuggestions(filtered)
                      setShowProjectSuggestions(true)
                    } else {
                      setProjectSuggestions([])
                      setShowProjectSuggestions(false)
                    }
                  }}
                  onFocus={() => {
                    if (newTask.project && newTask.project.length > 0) {
                      const filtered = availableProjects.filter(p => 
                        p.toLowerCase().includes(newTask.project.toLowerCase())
                      )
                      setProjectSuggestions(filtered)
                      setShowProjectSuggestions(true)
                    } else {
                      setProjectSuggestions(availableProjects.slice(0, 10))
                      setShowProjectSuggestions(true)
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowProjectSuggestions(false), 200)
                  }}
                  placeholder="Ex: TaskFlow, PITER, Général..."
                  list="project-list"
                />
                <datalist id="project-list">
                  {availableProjects.map((project, index) => (
                    <option key={index} value={project} />
                  ))}
                </datalist>
                {showProjectSuggestions && projectSuggestions.length > 0 && (
                  <div className="project-suggestions">
                    {projectSuggestions.map((project, index) => (
                      <div
                        key={index}
                        className="project-suggestion-item"
                        onClick={() => {
                          setNewTask({...newTask, project})
                          setShowProjectSuggestions(false)
                        }}
                      >
                        {project}
              </div>
                    ))}
                  </div>
                )}
                <small className="form-hint">Pour quel projet cette tâche est-elle destinée ?</small>
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Date à faire (optionnel)</label>
                <input
                  type="datetime-local"
                  className="form-input-modern"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                />
                <small className="form-hint">Vous pouvez définir une date et heure précise, ou seulement la date</small>
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Temps estimé (optionnel)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    className="form-input-modern"
                    value={newTask.estimated_time_minutes || ''}
                    onChange={(e) => setNewTask({...newTask, estimated_time_minutes: e.target.value ? parseInt(e.target.value) : null})}
                    placeholder="Ex: 30"
                    min="1"
                    style={{ flex: 1 }}
                  />
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>minutes</span>
                </div>
                <small className="form-hint">Estimez le temps nécessaire pour compléter cette tâche</small>
              </div>
            </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => setShowCreateModal(false)}>
                  Annuler
                </button>
              <button className="btn-auth-primary" onClick={createTask} disabled={!newTask.title}>
                  Créer
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Daily Summary */}
      {showDailyModal && (
        <div className="taskflow-modal-overlay" onClick={() => setShowDailyModal(false)}>
          <div className="taskflow-modal taskflow-modal-large" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">📋 Daily Summary</h3>
              <button className="modal-close" onClick={() => setShowDailyModal(false)}>×</button>
              </div>
            <div className="taskflow-modal-body">
                <textarea
                className="form-input-modern"
                  rows={20}
                  value={dailySummary}
                  onChange={(e) => setDailySummary(e.target.value)}
                style={{fontFamily: 'monospace', minHeight: '400px'}}
                placeholder="Le résumé quotidien apparaîtra ici..."
                />
              </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-success" onClick={() => copyToClipboard(dailySummary)}>
                  📋 Copier
                </button>
              <button className="btn-auth-secondary" onClick={() => setShowDailyModal(false)}>
                  Fermer
                </button>
            </div>
          </div>
        </div>
      )}


      {showEditModal && selectedTask && (
        <div className="taskflow-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="taskflow-modal" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">✏️ Modifier la tâche</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
              </div>
            <div className="taskflow-modal-body">
              <div className="form-group-modern">
                <label className="form-label-modern">Titre *</label>
                  <input
                    type="text"
                  className="form-input-modern"
                    value={selectedTask.title}
                    onChange={(e) => setSelectedTask({...selectedTask, title: e.target.value})}
                    placeholder="Titre de la tâche"
                  />
                </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Description</label>
                  <textarea
                  className="form-input-modern"
                    rows={3}
                    value={selectedTask.description || ''}
                    onChange={(e) => setSelectedTask({...selectedTask, description: e.target.value})}
                    placeholder="Description détaillée..."
                  />
                </div>
              <div className="form-group-modern">
                <label className="form-label-modern">ID Ticket Trello</label>
                  <input
                    type="text"
                  className="form-input-modern"
                    value={selectedTask.trello_id || ''}
                    onChange={(e) => setSelectedTask({...selectedTask, trello_id: e.target.value})}
                    placeholder="Ex: abc123def456"
                  />
                </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Statut</label>
                  <select
                  className="form-input-modern"
                    value={selectedTask.status}
                    onChange={(e) => setSelectedTask({...selectedTask, status: e.target.value})}
                  >
                    <option value="todo">À faire</option>
                    <option value="in_progress">En cours</option>
                    <option value="blocked">Bloqué</option>
                    <option value="standby">Standby</option>
                    <option value="review">Review</option>
                    <option value="done">Terminé</option>
                  </select>
                </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Priorité</label>
                  <select
                  className="form-input-modern"
                    value={selectedTask.priority}
                    onChange={(e) => setSelectedTask({...selectedTask, priority: e.target.value})}
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              <div className="form-group-modern" style={{ position: 'relative' }}>
                <label className="form-label-modern">Projet (optionnel)</label>
                <input
                  type="text"
                  className="form-input-modern"
                  value={selectedTask.project || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    setSelectedTask({...selectedTask, project: value})
                    if (value.length > 0) {
                      const filtered = availableProjects.filter(p => 
                        p.toLowerCase().includes(value.toLowerCase())
                      )
                      setProjectSuggestions(filtered)
                      setShowProjectSuggestions(true)
                    } else {
                      setProjectSuggestions([])
                      setShowProjectSuggestions(false)
                    }
                  }}
                  onFocus={() => {
                    if (selectedTask.project && selectedTask.project.length > 0) {
                      const filtered = availableProjects.filter(p => 
                        p.toLowerCase().includes(selectedTask.project!.toLowerCase())
                      )
                      setProjectSuggestions(filtered)
                      setShowProjectSuggestions(true)
                    } else {
                      setProjectSuggestions(availableProjects.slice(0, 10))
                      setShowProjectSuggestions(true)
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowProjectSuggestions(false), 200)
                  }}
                  placeholder="Ex: TaskFlow, PITER, Général..."
                  list="project-list-edit"
                />
                <datalist id="project-list-edit">
                  {availableProjects.map((project, index) => (
                    <option key={index} value={project} />
                  ))}
                </datalist>
                {showProjectSuggestions && projectSuggestions.length > 0 && (
                  <div className="project-suggestions">
                    {projectSuggestions.map((project, index) => (
                      <div
                        key={index}
                        className="project-suggestion-item"
                        onClick={() => {
                          setSelectedTask({...selectedTask, project})
                          setShowProjectSuggestions(false)
                        }}
                      >
                        {project}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Date à faire (optionnel)</label>
                <input
                  type="datetime-local"
                  className="form-input-modern"
                  value={selectedTask.due_date ? new Date(selectedTask.due_date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setSelectedTask({...selectedTask, due_date: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                />
                <small className="form-hint">Vous pouvez définir une date et heure précise pour cette tâche</small>
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Temps estimé (optionnel)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    className="form-input-modern"
                    value={selectedTask.estimated_time_minutes || ''}
                    onChange={(e) => setSelectedTask({...selectedTask, estimated_time_minutes: e.target.value ? parseInt(e.target.value) : undefined})}
                    placeholder="Ex: 30"
                    min="1"
                    style={{ flex: 1 }}
                  />
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>minutes</span>
                </div>
                <small className="form-hint">Estimez le temps nécessaire pour compléter cette tâche</small>
              </div>
                {selectedTask.status === 'blocked' && (
                <div className="form-group-modern">
                  <label className="form-label-modern">Raison du blocage</label>
                    <textarea
                    className="form-input-modern"
                      rows={2}
                      value={selectedTask.blocked_reason || ''}
                      onChange={(e) => setSelectedTask({...selectedTask, blocked_reason: e.target.value})}
                      placeholder="Expliquez le blocage..."
                    />
                  </div>
                )}
              </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => setShowEditModal(false)}>
                  Annuler
                </button>
                <button 
                className="btn-auth-primary" 
                  onClick={() => {
                    updateTask(selectedTask.id, {
                      title: selectedTask.title,
                      description: selectedTask.description,
                      status: selectedTask.status,
                      priority: selectedTask.priority,
                      blocked_reason: selectedTask.blocked_reason,
                    trello_id: selectedTask.trello_id,
                    due_date: selectedTask.due_date ? new Date(selectedTask.due_date).toISOString() : null,
                    project: selectedTask.project || null,
                    estimated_time_minutes: selectedTask.estimated_time_minutes || null
                    })
                  }}
                  disabled={!selectedTask.title}
                >
                  Sauvegarder
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Weekly Summary */}
      {showWeeklyModal && (
        <div className="taskflow-modal-overlay" onClick={() => setShowWeeklyModal(false)}>
          <div className="taskflow-modal taskflow-modal-large" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">📊 Weekly Summary</h3>
              <button className="modal-close" onClick={() => setShowWeeklyModal(false)}>×</button>
              </div>
            <div className="taskflow-modal-body">
                <textarea
                className="form-input-modern"
                  rows={20}
                  value={weeklySummary}
                  onChange={(e) => setWeeklySummary(e.target.value)}
                style={{fontFamily: 'monospace', minHeight: '400px'}}
                placeholder="Le résumé hebdomadaire apparaîtra ici..."
                />
              </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-success" onClick={() => copyToClipboard(weeklySummary)}>
                  📋 Copier
                </button>
              <button className="btn-auth-secondary" onClick={() => setShowWeeklyModal(false)}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
      )}

      {/* Modal Workflows */}
      {showWorkflowModal && (
        <div className="taskflow-modal-overlay" onClick={() => setShowWorkflowModal(false)}>
          <div className="taskflow-modal taskflow-modal-large" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">📋 Workflows</h3>
              <button className="modal-close" onClick={() => setShowWorkflowModal(false)}>×</button>
        </div>
            <div className="taskflow-modal-body">
              <button 
                className="btn-auth-primary"
                onClick={() => {
                  setWorkflowSteps([''])
                  setNewWorkflow({ name: '', steps: '', category: 'dev', project: '' })
                  setEditingWorkflow(null)
                  setShowWorkflowModal(false)
                  setShowCreateWorkflowModal(true)
                }}
                style={{ marginBottom: 'var(--space-20)' }}
              >
                ➕ Créer un workflow
              </button>
              {workflows.length > 0 ? (
                <div className="workflows-list">
                  {workflows.map(workflow => (
                    <div key={workflow.id} className="workflow-item">
                      <div className="workflow-header">
                        <h4 className="workflow-name">{workflow.name}</h4>
                        <div className="workflow-actions">
                          {workflow.project && (
                            <span className="workflow-project">📁 {workflow.project}</span>
                          )}
                          <button
                            className="btn-workflow-edit"
                            onClick={() => {
                              setEditingWorkflow(workflow)
                              setNewWorkflow({
                                name: workflow.name,
                                steps: workflow.steps,
                                category: workflow.category,
                                project: workflow.project || ''
                              })
                              setWorkflowSteps(workflow.steps.split('\n').filter(s => s.trim() !== ''))
                              setShowWorkflowModal(false)
                              setShowCreateWorkflowModal(true)
                            }}
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-workflow-delete"
                            onClick={async () => {
                              if (confirm(`Supprimer le workflow "${workflow.name}" ?`)) {
                                try {
                                  const response = await fetch(`${API_URL}/workflows/${workflow.id}`, {
                                    method: 'DELETE',
                                    headers: {
                                      'Authorization': `Bearer ${token}`
                                    }
                                  })
                                  if (response.ok) {
                                    fetchWorkflows(token)
                                    sendNotification('🗑️ Workflow supprimé', `"${workflow.name}" a été supprimé`)
                                  }
                                } catch (error) {
                                  console.error('Error deleting workflow:', error)
                                }
                              }
                            }}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <p className="workflow-category">Catégorie: {workflow.category}</p>
                      <div className="workflow-steps">
                        <pre style={{whiteSpace: 'pre-wrap', wordWrap: 'break-word'}}>{workflow.steps}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="taskflow-empty">
                  <span>Aucun workflow disponible</span>
                </div>
              )}
            </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => setShowWorkflowModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Création/Modification Workflow */}
      {showCreateWorkflowModal && (
        <div className="taskflow-modal-overlay" onClick={() => {
          setShowCreateWorkflowModal(false)
          setEditingWorkflow(null)
          setWorkflowSteps([''])
          setNewWorkflow({ name: '', steps: '', category: 'dev', project: '' })
        }}>
          <div className="taskflow-modal" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">{editingWorkflow ? '✏️ Modifier le workflow' : '➕ Nouveau workflow'}</h3>
              <button className="modal-close" onClick={() => {
                setShowCreateWorkflowModal(false)
                setEditingWorkflow(null)
                setWorkflowSteps([''])
                setNewWorkflow({ name: '', steps: '', category: 'dev', project: '' })
              }}>×</button>
            </div>
            <div className="taskflow-modal-body">
              <div className="form-group-modern">
                <label className="form-label-modern">Nom *</label>
                <input
                  type="text"
                  className="form-input-modern"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({...newWorkflow, name: e.target.value})}
                  placeholder="Ex: Dev Basic"
                  required
                />
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Projet (optionnel)</label>
                <input
                  type="text"
                  className="form-input-modern"
                  value={newWorkflow.project}
                  onChange={(e) => setNewWorkflow({...newWorkflow, project: e.target.value})}
                  placeholder="Ex: TaskFlow, PITER, Général..."
                />
                <small className="form-hint">Pour quel projet ce workflow est-il destiné ?</small>
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Catégorie</label>
                <select
                  className="form-input-modern"
                  value={newWorkflow.category}
                  onChange={(e) => setNewWorkflow({...newWorkflow, category: e.target.value})}
                >
                  <option value="dev">Dev</option>
                  <option value="daily">Daily</option>
                  <option value="bugfix">Bug Fix</option>
                  <option value="reminder">Reminder</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Étapes *</label>
                <div className="workflow-steps-list">
                  {workflowSteps.map((step, index) => (
                    <div key={index} className="workflow-step-item">
                      <input
                        type="text"
                        className="form-input-modern"
                        value={step}
                        onChange={(e) => {
                          const newSteps = [...workflowSteps]
                          newSteps[index] = e.target.value
                          setWorkflowSteps(newSteps)
                        }}
                        placeholder={`Étape ${index + 1}...`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            const newSteps = [...workflowSteps]
                            newSteps.splice(index + 1, 0, '')
                            setWorkflowSteps(newSteps)
                            setTimeout(() => {
                              const nextInput = document.querySelector(`.workflow-step-item:nth-child(${index + 2}) input`) as HTMLInputElement
                              nextInput?.focus()
                            }, 0)
                          } else if (e.key === 'Backspace' && step === '' && workflowSteps.length > 1) {
                            e.preventDefault()
                            const newSteps = workflowSteps.filter((_, i) => i !== index)
                            setWorkflowSteps(newSteps)
                          }
                        }}
                      />
                      {workflowSteps.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove-step"
                          onClick={() => {
                            const newSteps = workflowSteps.filter((_, i) => i !== index)
                            setWorkflowSteps(newSteps)
                          }}
                          title="Supprimer cette étape"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-add-step"
                    onClick={() => setWorkflowSteps([...workflowSteps, ''])}
                  >
                    ➕ Ajouter une étape
                  </button>
                </div>
                <small className="form-hint">Appuyez sur Entrée pour ajouter une nouvelle étape</small>
              </div>
            </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => setShowCreateWorkflowModal(false)}>
                Annuler
              </button>
              <button 
                className="btn-auth-primary" 
                onClick={editingWorkflow ? updateWorkflow : createWorkflow}
                disabled={!newWorkflow.name || workflowSteps.filter(s => s.trim() !== '').length === 0}
              >
                {editingWorkflow ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails Tâche */}
      {showTaskDetailModal && selectedTaskDetail && (
        <div className="taskflow-modal-overlay task-detail-overlay" onClick={() => setShowTaskDetailModal(false)}>
          <div className="taskflow-modal taskflow-modal-large task-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">📋 Détails de la tâche</h3>
              <button className="modal-close" onClick={() => setShowTaskDetailModal(false)}>×</button>
            </div>
            <div className="taskflow-modal-body">
              <div className="task-detail-section">
                <h4 className="task-detail-title">{selectedTaskDetail.title}</h4>
                <div className="task-detail-badges">
                  {getStatusBadge(selectedTaskDetail.status)}
                  {getPriorityBadge(selectedTaskDetail.priority)}
                </div>
              </div>

              {selectedTaskDetail.description && (
                <div className="task-detail-section">
                  <label className="task-detail-label">Description</label>
                  <p className="task-detail-text">{selectedTaskDetail.description}</p>
                </div>
              )}

              {selectedTaskDetail.trello_id && (
                <div className="task-detail-section">
                  <label className="task-detail-label">ID Ticket Trello</label>
                  <p className="task-detail-text">
                    <code className="task-detail-code">{selectedTaskDetail.trello_id}</code>
                  </p>
                </div>
              )}

              {selectedTaskDetail.blocked_reason && (
                <div className="task-detail-section">
                  <label className="task-detail-label">Raison du blocage</label>
                  <div className="task-blocked-reason">
                    {selectedTaskDetail.blocked_reason}
                  </div>
                </div>
              )}

              <div className="task-detail-section">
                <label className="task-detail-label">Dates</label>
                <div className="task-detail-dates">
                  {selectedTaskDetail.created_at && (
                    <div className="task-detail-date">
                      <strong>Créée:</strong> {new Date(selectedTaskDetail.created_at).toLocaleString('fr-FR')}
                    </div>
                  )}
                  {selectedTaskDetail.updated_at && (
                    <div className="task-detail-date">
                      <strong>Modifiée:</strong> {new Date(selectedTaskDetail.updated_at).toLocaleString('fr-FR')}
                    </div>
                  )}
                  {selectedTaskDetail.started_at && (
                    <div className="task-detail-date">
                      <strong>Démarrée:</strong> {new Date(selectedTaskDetail.started_at).toLocaleString('fr-FR')}
                    </div>
                  )}
                  {selectedTaskDetail.completed_at && (
                    <div className="task-detail-date">
                      <strong>Terminée:</strong> {new Date(selectedTaskDetail.completed_at).toLocaleString('fr-FR')}
                    </div>
                  )}
                  {selectedTaskDetail.standby_at && (
                    <div className="task-detail-date">
                      <strong>En standby:</strong> {new Date(selectedTaskDetail.standby_at).toLocaleString('fr-FR')}
                    </div>
                  )}
                </div>
              </div>

              {(selectedTaskDetail.time_spent_seconds || selectedTaskDetail.time_in_progress_seconds || selectedTaskDetail.estimated_time_minutes) && (
                <div className="task-detail-section">
                  <label className="task-detail-label">⏱️ Statistiques de temps</label>
                  <div className="task-detail-dates">
                    {selectedTaskDetail.estimated_time_minutes && (
                      <div className="task-detail-date">
                        <strong>⏳ Temps estimé:</strong> {selectedTaskDetail.estimated_time_minutes} minutes
                      </div>
                    )}
                    {selectedTaskDetail.time_in_progress_seconds && selectedTaskDetail.time_in_progress_seconds > 0 && (
                      <div className="task-detail-date">
                        <strong>🔄 Temps en cours:</strong> {formatTime(selectedTaskDetail.time_in_progress_seconds)}
                      </div>
                    )}
                    {selectedTaskDetail.time_spent_seconds && selectedTaskDetail.time_spent_seconds > 0 && (
                      <div className="task-detail-date">
                        <strong>✅ Temps total:</strong> {formatTime(selectedTaskDetail.time_spent_seconds)}
                      </div>
                    )}
                    {selectedTaskDetail.estimated_time_minutes && selectedTaskDetail.time_spent_seconds && selectedTaskDetail.time_spent_seconds > 0 && (
                      <div className="task-detail-date" style={{
                        padding: '12px',
                        borderRadius: '8px',
                        marginTop: '8px',
                        backgroundColor: (() => {
                          const estimatedSeconds = selectedTaskDetail.estimated_time_minutes * 60
                          const actualSeconds = selectedTaskDetail.time_spent_seconds
                          const diffPercent = ((actualSeconds - estimatedSeconds) / estimatedSeconds) * 100
                          if (Math.abs(diffPercent) <= 20) return 'rgba(25, 135, 84, 0.1)'
                          if (Math.abs(diffPercent) <= 50) return 'rgba(255, 193, 7, 0.1)'
                          return 'rgba(220, 53, 69, 0.1)'
                        })(),
                        border: '1px solid',
                        borderColor: (() => {
                          const estimatedSeconds = selectedTaskDetail.estimated_time_minutes * 60
                          const actualSeconds = selectedTaskDetail.time_spent_seconds
                          const diffPercent = ((actualSeconds - estimatedSeconds) / estimatedSeconds) * 100
                          if (Math.abs(diffPercent) <= 20) return 'rgba(25, 135, 84, 0.3)'
                          if (Math.abs(diffPercent) <= 50) return 'rgba(255, 193, 7, 0.3)'
                          return 'rgba(220, 53, 69, 0.3)'
                        })()
                      }}>
                        <strong>📊 Comparaison Estimation vs Réalité:</strong>
                        <div style={{ marginTop: '8px' }}>
                          {(() => {
                            const estimatedSeconds = selectedTaskDetail.estimated_time_minutes * 60
                            const actualSeconds = selectedTaskDetail.time_spent_seconds
                            const diffSeconds = actualSeconds - estimatedSeconds
                            const diffPercent = ((actualSeconds - estimatedSeconds) / estimatedSeconds) * 100
                            const diffMinutes = Math.round(diffSeconds / 60)
                            
                            let status = '✅ Précision'
                            let emoji = '✅'
                            if (diffPercent > 50) {
                              status = '⚠️ Sous-estimation'
                              emoji = '⚠️'
                            } else if (diffPercent < -50) {
                              status = '⚡ Sur-estimation'
                              emoji = '⚡'
                            } else if (diffPercent > 20) {
                              status = '⚠️ Légère sous-estimation'
                              emoji = '⚠️'
                            } else if (diffPercent < -20) {
                              status = '⚡ Légère sur-estimation'
                              emoji = '⚡'
                            }
                            
                            return (
                              <div>
                                <div style={{ marginBottom: '4px' }}>
                                  {emoji} <strong>{status}</strong>
                                </div>
                                <div style={{ fontSize: '0.9em', color: 'var(--color-text-secondary)' }}>
                                  {diffMinutes > 0 ? `+${diffMinutes}` : diffMinutes} minutes ({diffPercent > 0 ? '+' : ''}{diffPercent.toFixed(1)}%)
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(() => {
                const taskSubtasks = subtasks[selectedTaskDetail.id]
                if (taskSubtasks && taskSubtasks.length > 0) {
                  return (
                    <div className="task-detail-section">
                      <label className="task-detail-label">🔨 Sous-tâches ({taskSubtasks.filter((s: any) => s.status === 'done').length}/{taskSubtasks.length} terminées)</label>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {taskSubtasks.map((subtask: any) => (
                          <div key={subtask.id} style={{
                            padding: '12px',
                            marginBottom: '8px',
                            backgroundColor: 'var(--color-secondary)',
                            borderRadius: '8px',
                            border: `1px solid ${subtask.status === 'done' ? 'var(--color-success)' : 'var(--color-border)'}`
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <strong>{subtask.title}</strong>
                                {subtask.description && (
                                  <div style={{ fontSize: '0.85em', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                    {subtask.description}
                                  </div>
                                )}
                              </div>
                              <span style={{ fontSize: '0.8em', color: 'var(--color-text-secondary)' }}>
                                {subtask.status === 'done' ? '✅' : '⏳'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
    </div>
  )
}
                return null
              })()}

              <div className="task-detail-section">
                <label className="task-detail-label">Actions rapides</label>
                <div className="task-detail-actions">
                  {getTaskActions(selectedTaskDetail)}
                </div>
              </div>
            </div>
            <div className="taskflow-modal-footer">
              <button 
                className="btn-auth-primary" 
                onClick={() => {
                  setSelectedTask(selectedTaskDetail)
                  setShowTaskDetailModal(false)
                  setShowEditModal(true)
                }}
              >
                ✏️ Modifier
              </button>
              <button className="btn-auth-secondary" onClick={() => setShowTaskDetailModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Calendrier */}
      {showCalendarModal && (
        <div className="taskflow-modal-overlay" onClick={() => setShowCalendarModal(false)}>
          <div className="taskflow-modal taskflow-modal-large" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">📅 Calendrier des tâches</h3>
              <button className="modal-close" onClick={() => setShowCalendarModal(false)}>×</button>
            </div>
            <div className="taskflow-modal-body">
              <CalendarView 
                tasks={tasks} 
                onTaskClick={(task) => {
                  setSelectedTaskDetail(task)
                  setShowTaskDetailModal(true)
                }}
              />
            </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => setShowCalendarModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Raison de blocage */}
      {showBlockReasonModal && taskToBlock && (
        <div className="taskflow-modal-overlay" onClick={() => {
          setShowBlockReasonModal(false)
          setTaskToBlock(null)
          setBlockReason('')
        }}>
          <div className="taskflow-modal" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">🚫 Bloquer la tâche</h3>
              <button className="modal-close" onClick={() => {
                setShowBlockReasonModal(false)
                setTaskToBlock(null)
                setBlockReason('')
              }}>×</button>
            </div>
            <div className="taskflow-modal-body">
              <div className="form-group-modern">
                <label className="form-label-modern">Tâche</label>
                <p className="task-detail-text">{taskToBlock.title}</p>
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Raison du blocage *</label>
                <textarea
                  className="form-input-modern"
                  rows={4}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Expliquez pourquoi cette tâche est bloquée..."
                  required
                />
                <small className="form-hint">Cette raison sera visible dans les détails de la tâche</small>
              </div>
            </div>
            <div className="taskflow-modal-footer">
              <button 
                className="btn-auth-secondary" 
                onClick={() => {
                  setShowBlockReasonModal(false)
                  setTaskToBlock(null)
                  setBlockReason('')
                }}
              >
                Annuler
              </button>
              <button 
                className="btn-auth-danger" 
                onClick={handleBlockTask}
                disabled={!blockReason.trim()}
              >
                Bloquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation */}
      {showConfirmModal && confirmAction && (
        <div className="taskflow-modal-overlay" onClick={() => {
          setShowConfirmModal(false)
          setConfirmAction(null)
        }}>
          <div className="taskflow-modal" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">⚠️ Confirmation</h3>
              <button className="modal-close" onClick={() => {
                setShowConfirmModal(false)
                setConfirmAction(null)
              }}>×</button>
            </div>
            <div className="taskflow-modal-body">
              <p className="task-detail-text">{confirmAction.message}</p>
            </div>
            <div className="taskflow-modal-footer">
              <button 
                className="btn-auth-secondary" 
                onClick={() => {
                  setShowConfirmModal(false)
                  setConfirmAction(null)
                }}
              >
                Annuler
              </button>
              <button 
                className={`btn-auth-primary ${confirmAction.type === 'delete' ? 'btn-auth-danger' : ''}`}
                onClick={confirmActionHandler}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Corbeille */}
      {showTrashModal && (
        <div className="taskflow-modal-overlay" onClick={() => setShowTrashModal(false)}>
          <div className="taskflow-modal taskflow-modal-large" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">🗑️ Corbeille</h3>
              <button className="modal-close" onClick={() => setShowTrashModal(false)}>×</button>
            </div>
            <div className="taskflow-modal-body">
              {deletedTasks.length > 0 ? (
                <div className="trash-tasks-list">
                  {deletedTasks.map(task => (
                    <div key={task.id} className="trash-task-item">
                      <div className="trash-task-header">
                        <h4 className="trash-task-title">{task.title}</h4>
                        <span className="trash-task-date">
                          Supprimée le {task.deleted_at ? new Date(task.deleted_at).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Date inconnue'}
                        </span>
                      </div>
                      {task.description && (
                        <p className="trash-task-description">{task.description}</p>
                      )}
                      <div className="trash-task-actions">
                        <button 
                          className="btn-auth-success"
                          onClick={() => restoreTask(task.id)}
                        >
                          ♻️ Restaurer
                        </button>
                        <button 
                          className="btn-auth-danger"
                          onClick={() => {
                            setConfirmAction({
                              type: 'delete',
                              task,
                              message: `Supprimer définitivement "${task.title}" ? Cette action est irréversible.`
                            })
                            setShowConfirmModal(true)
                          }}
                        >
                          🗑️ Supprimer définitivement
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="taskflow-empty">
                  <span>La corbeille est vide</span>
                </div>
              )}
            </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => setShowTrashModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
        )}

      {/* Modal Activité Actuelle */}
      {showCurrentActivityModal && currentActivity && (
        <div className="taskflow-modal-overlay" onClick={() => setShowCurrentActivityModal(false)}>
          <div className="taskflow-modal taskflow-modal-large" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">⚡ Activité Actuelle</h3>
              <button className="modal-close" onClick={() => setShowCurrentActivityModal(false)}>×</button>
            </div>
            <div className="taskflow-modal-body">
              <div className="task-detail-section">
                <h4 className="task-detail-label">🔄 Tâches en cours</h4>
                {currentActivity.in_progress && currentActivity.in_progress.length > 0 ? (
                  <div className="workflows-list">
                    {currentActivity.in_progress.map((task: any) => (
                      <div key={task.id} className="workflow-item">
                        <div className="workflow-header">
                          <h4 className="workflow-name">{task.title}</h4>
                          {task.project && (
                            <span className="workflow-project">📁 {task.project}</span>
                          )}
                        </div>
                        <div className="workflow-steps">
                          <p><strong>Priorité:</strong> {task.priority}</p>
                          {task.started_at && (
                            <p><strong>Démarrée:</strong> {new Date(task.started_at).toLocaleString('fr-FR')}</p>
                          )}
                          {task.time_in_progress_seconds && (
                            <p><strong>Temps en cours:</strong> {formatTime(task.time_in_progress_seconds)}</p>
                          )}
                          {task.current_session_time && (
                            <p><strong>Session actuelle:</strong> {formatTime(task.current_session_time)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="task-detail-text">Aucune tâche en cours</p>
                )}
              </div>

              {currentActivity.today_completed && (
                <div className="task-detail-section">
                  <h4 className="task-detail-label">✅ Terminées aujourd'hui</h4>
                  <p className="task-detail-text">
                    <strong>Nombre:</strong> {currentActivity.today_completed.count || 0}
                  </p>
                  {currentActivity.today_completed.total_time && (
                    <p className="task-detail-text">
                      <strong>Temps total:</strong> {formatTime(currentActivity.today_completed.total_time)}
                    </p>
                  )}
                </div>
              )}

              {currentActivity.by_project && currentActivity.by_project.length > 0 && (
                <div className="task-detail-section">
                  <h4 className="task-detail-label">📁 Par projet</h4>
                  <div className="workflows-list">
                    {currentActivity.by_project.map((proj: any, index: number) => (
                      <div key={index} className="workflow-item">
                        <div className="workflow-header">
                          <h4 className="workflow-name">{proj.project}</h4>
                          <span className="workflow-project">{proj.count} tâche(s)</span>
                        </div>
                        {proj.in_progress_count > 0 && (
                          <p className="workflow-category">{proj.in_progress_count} en cours</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => setShowCurrentActivityModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Vue par Projet */}
      {showProjectView && (
        <div className="taskflow-modal-overlay" onClick={() => setShowProjectView(false)}>
          <div className="taskflow-modal taskflow-modal-large" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">📁 Vue par Projet</h3>
              <button className="modal-close" onClick={() => setShowProjectView(false)}>×</button>
            </div>
            <div className="taskflow-modal-body">
              <div className="form-group-modern" style={{ marginBottom: 'var(--space-20)' }}>
                <label className="form-label-modern">Filtrer par projet</label>
                <select
                  className="form-input-modern"
                  value={selectedProject || ''}
                  onChange={(e) => setSelectedProject(e.target.value || null)}
                >
                  <option value="">Tous les projets</option>
                  {Array.from(new Set(tasks.map(t => t.project).filter(p => p))).map(project => (
                    <option key={project} value={project}>{project}</option>
                  ))}
                </select>
              </div>
              
              {(selectedProject ? tasks.filter(t => t.project === selectedProject) : tasks).length > 0 ? (
                <div className="taskflow-grid" style={{ display: 'block' }}>
                  {['in_progress', 'todo', 'blocked', 'standby', 'review', 'done'].map(status => {
                    const statusTasks = (selectedProject 
                      ? tasks.filter(t => t.project === selectedProject && t.status === status)
                      : tasks.filter(t => t.status === status))
                    if (statusTasks.length === 0) return null
                    
                    return (
                      <div key={status} className="taskflow-column" style={{ marginBottom: 'var(--space-24)' }}>
                        <div className="taskflow-card">
                          <div className="taskflow-card-header">
                            <span className="card-icon">
                              {status === 'in_progress' ? '🔄' : 
                               status === 'todo' ? '📋' :
                               status === 'blocked' ? '🚫' :
                               status === 'standby' ? '⏸️' :
                               status === 'review' ? '⏳' : '✅'}
                            </span>
                            <h3 className="card-title">
                              {status === 'in_progress' ? 'En cours' :
                               status === 'todo' ? 'À faire' :
                               status === 'blocked' ? 'Bloqué' :
                               status === 'standby' ? 'Standby' :
                               status === 'review' ? 'En Review' : 'Terminé'}
                            </h3>
                            <span className="card-count">{statusTasks.length}</span>
                          </div>
                          <div className="taskflow-card-body">
                            {statusTasks.map(task => (
                              <div 
                                key={task.id} 
                                className={`task-item task-item-clickable task-item-status-${task.status}`}
                                onClick={() => {
                                  setSelectedTaskDetail(task)
                                  setShowTaskDetailModal(true)
                                }}
                              >
                                <div className="task-header">
                                  <h4 className="task-title">{task.title}</h4>
                                  {task.project && (
                                    <span className="workflow-project-badge">📁 {task.project}</span>
                                  )}
                                </div>
                                <div className="task-badges">
                                  {getStatusBadge(task.status)}
                                  {getPriorityBadge(task.priority)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="taskflow-empty">
                  <span>{selectedProject ? `Aucune tâche pour le projet "${selectedProject}"` : 'Aucune tâche'}</span>
                </div>
              )}
            </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => {
                setShowProjectView(false)
                setSelectedProject(null)
              }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Time Awareness */}
      {showTimeAwarenessModal && (
        <div className="taskflow-modal-overlay" onClick={() => setShowTimeAwarenessModal(false)}>
          <div className="taskflow-modal taskflow-modal-large" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">⏱️ Time Awareness - Estimation vs Réalité</h3>
              <button className="modal-close" onClick={() => setShowTimeAwarenessModal(false)}>×</button>
            </div>
            <div className="taskflow-modal-body">
              {timeComparisonStats.length > 0 ? (
                <div>
                  <div className="task-detail-section">
                    <label className="task-detail-label">📊 Comparaisons récentes</label>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {timeComparisonStats.map((stat: any) => {
                        const diffPercent = stat.difference_minutes ? ((stat.difference_minutes / stat.estimated_minutes) * 100).toFixed(1) : '0'
                        const isOver = stat.difference_minutes > 0
                        return (
                          <div key={stat.task_id} style={{
                            padding: '12px',
                            marginBottom: '8px',
                            borderRadius: '8px',
                            backgroundColor: isOver ? 'rgba(220, 53, 69, 0.1)' : 'rgba(25, 135, 84, 0.1)',
                            border: `1px solid ${isOver ? 'rgba(220, 53, 69, 0.3)' : 'rgba(25, 135, 84, 0.3)'}`
                          }}>
                            <strong>{stat.title}</strong>
                            <div style={{ marginTop: '4px', fontSize: '0.9em', color: 'var(--color-text-secondary)' }}>
                              Estimé: {stat.estimated_minutes}min | Réel: {stat.actual_minutes}min
                              {stat.difference_minutes && (
                                <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                                  ({isOver ? '+' : ''}{stat.difference_minutes}min, {isOver ? '+' : ''}{diffPercent}%)
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="task-detail-text">Aucune donnée de comparaison disponible. Créez des tâches avec des estimations pour voir les statistiques.</p>
              )}
            </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => setShowTimeAwarenessModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Templates */}
      {showTemplatesModal && (
        <div className="taskflow-modal-overlay" onClick={() => setShowTemplatesModal(false)}>
          <div className="taskflow-modal taskflow-modal-large" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">📄 Templates de tâches</h3>
              <button className="modal-close" onClick={() => setShowTemplatesModal(false)}>×</button>
            </div>
            <div className="taskflow-modal-body">
              <div style={{ marginBottom: '16px' }}>
                <button 
                  className="btn-auth-primary"
                  onClick={() => {
                    setSelectedTemplate(null)
                    setNewTask({
                      title: '',
                      description: '',
                      priority: 'medium',
                      trello_id: '',
                      due_date: '',
                      project: '',
                      estimated_time_minutes: null
                    })
                    setShowTemplatesModal(false)
                    setShowCreateModal(true)
                  }}
                >
                  ➕ Créer un template
                </button>
              </div>
              {templates.length > 0 ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {templates.map((template: any) => (
                    <div key={template.id} style={{
                      padding: '16px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-secondary)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div>
                          <strong>{template.name}</strong>
                          {template.is_public && <span style={{ marginLeft: '8px', fontSize: '0.8em', color: 'var(--color-primary)' }}>🌐 Public</span>}
                        </div>
                        <button
                          className="btn-task btn-task-primary"
                          onClick={async () => {
                            try {
                              const response = await fetch(`${API_URL}/templates/${template.id}/create-task`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({ project: null })
                              })
                              if (response.ok) {
                                const data = await response.json()
                                fetchTasks(token)
                                setShowTemplatesModal(false)
                                sendNotification('✅ Tâche créée', `Tâche créée depuis le template "${template.name}"`)
                              }
                            } catch (error) {
                              console.error('Error creating task from template:', error)
                            }
                          }}
                        >
                          Utiliser
                        </button>
                      </div>
                      <div style={{ fontSize: '0.9em', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                        {template.title}
                      </div>
                      {template.description && (
                        <div style={{ fontSize: '0.85em', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          {template.description}
                        </div>
                      )}
                      {template.estimated_time_minutes && (
                        <div style={{ fontSize: '0.85em', color: 'var(--color-primary)', marginTop: '4px' }}>
                          ⏱️ {template.estimated_time_minutes} minutes
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="task-detail-text">Aucun template disponible. Créez-en un pour accélérer la création de tâches récurrentes.</p>
              )}
            </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => setShowTemplatesModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Breakdown */}
      {showBreakdownModal && taskToBreakdown && (
        <div className="taskflow-modal-overlay" onClick={() => {
          setShowBreakdownModal(false)
          setTaskToBreakdown(null)
          setBreakdownSteps([''])
        }}>
          <div className="taskflow-modal taskflow-modal-large" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">🔨 Décomposer la tâche</h3>
              <button className="modal-close" onClick={() => {
                setShowBreakdownModal(false)
                setTaskToBreakdown(null)
                setBreakdownSteps([''])
              }}>×</button>
            </div>
            <div className="taskflow-modal-body">
              <div className="form-group-modern">
                <label className="form-label-modern">Tâche à décomposer</label>
                <p className="task-detail-text">{taskToBreakdown.title}</p>
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Étapes de décomposition</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {breakdownSteps.map((step, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="form-input-modern"
                        value={step}
                        onChange={(e) => {
                          const newSteps = [...breakdownSteps]
                          newSteps[index] = e.target.value
                          setBreakdownSteps(newSteps)
                        }}
                        placeholder={`Étape ${index + 1}`}
                        style={{ flex: 1 }}
                      />
                      {breakdownSteps.length > 1 && (
                        <button
                          className="btn-task btn-task-danger"
                          onClick={() => {
                            setBreakdownSteps(breakdownSteps.filter((_, i) => i !== index))
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    className="btn-task btn-task-secondary"
                    onClick={() => setBreakdownSteps([...breakdownSteps, ''])}
                  >
                    ➕ Ajouter une étape
                  </button>
                </div>
              </div>
              {subtasks[taskToBreakdown.id] && subtasks[taskToBreakdown.id].length > 0 && (
                <div className="task-detail-section">
                  <label className="task-detail-label">Sous-tâches existantes</label>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {subtasks[taskToBreakdown.id].map((subtask: any) => (
                      <div key={subtask.id} style={{
                        padding: '8px',
                        marginBottom: '4px',
                        backgroundColor: 'var(--color-secondary)',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{subtask.title}</span>
                        <span style={{ fontSize: '0.8em', color: 'var(--color-text-secondary)' }}>
                          {subtask.status === 'done' ? '✅' : '⏳'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="taskflow-modal-footer">
              <button 
                className="btn-auth-secondary" 
                onClick={() => {
                  setShowBreakdownModal(false)
                  setTaskToBreakdown(null)
                  setBreakdownSteps([''])
                }}
              >
                Annuler
              </button>
              <button
                className="btn-auth-primary"
                onClick={async () => {
                  const steps = breakdownSteps.filter(s => s.trim() !== '')
                  if (steps.length === 0) {
                    alert('Veuillez ajouter au moins une étape')
                    return
                  }
                  try {
                    const response = await fetch(`${API_URL}/subtasks/auto-breakdown/${taskToBreakdown.id}`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ steps })
                    })
                    if (response.ok) {
                      fetchSubtasks(taskToBreakdown.id)
                      setShowBreakdownModal(false)
                      setTaskToBreakdown(null)
                      setBreakdownSteps([''])
                      sendNotification('✅ Tâche décomposée', `${steps.length} sous-tâches créées`)
                    }
                  } catch (error) {
                    console.error('Error breaking down task:', error)
                  }
                }}
              >
                Décomposer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tags */}
      {showTagsModal && (
        <div className="taskflow-modal-overlay" onClick={() => setShowTagsModal(false)}>
          <div className="taskflow-modal taskflow-modal-large" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">🏷️ Tags et Filtres</h3>
              <button className="modal-close" onClick={() => setShowTagsModal(false)}>×</button>
            </div>
            <div className="taskflow-modal-body">
              <div className="task-detail-section">
                <label className="task-detail-label">Créer un nouveau tag</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    className="form-input-modern"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Nom du tag"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    style={{ width: '60px', height: '38px', cursor: 'pointer' }}
                  />
                  <button
                    className="btn-auth-primary"
                    onClick={async () => {
                      if (!newTagName.trim()) return
                      try {
                        const response = await fetch(`${API_URL}/tags`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ name: newTagName.trim(), color: newTagColor })
                        })
                        if (response.ok) {
                          fetchTags()
                          setNewTagName('')
                          setNewTagColor('#6B7280')
                        }
                      } catch (error) {
                        console.error('Error creating tag:', error)
                      }
                    }}
                  >
                    Créer
                  </button>
                </div>
              </div>
              <div className="task-detail-section">
                <label className="task-detail-label">Mes tags</label>
                {tags.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {tags.map((tag: any) => (
                      <div
                        key={tag.id}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          backgroundColor: tag.color + '20',
                          border: `1px solid ${tag.color}`,
                          color: tag.color,
                          fontSize: '0.9em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span>{tag.name}</span>
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(`${API_URL}/tags/${tag.id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                              })
                              if (response.ok) fetchTags()
                            } catch (error) {
                              console.error('Error deleting tag:', error)
                            }
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: tag.color,
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '0 4px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="task-detail-text">Aucun tag créé. Créez des tags pour organiser vos tâches.</p>
                )}
              </div>
            </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => setShowTagsModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Notes / Brain Dump */}
      {showNotesModal && (
        <div className="taskflow-modal-overlay" onClick={() => setShowNotesModal(false)}>
          <div className="taskflow-modal taskflow-modal-large" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">📝 Notes et Brain Dump</h3>
              <button className="modal-close" onClick={() => setShowNotesModal(false)}>×</button>
            </div>
            <div className="taskflow-modal-body">
              <div style={{ marginBottom: '16px' }}>
                <button
                  className="btn-auth-primary"
                  onClick={() => {
                    setBrainDumpContent('')
                    setShowNotesModal(false)
                    setShowBrainDumpModal(true)
                  }}
                >
                  🧠 Nouveau Brain Dump
                </button>
              </div>
              {notes.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {notes.map((note: any) => (
                    <div key={note.id} style={{
                      padding: '12px',
                      marginBottom: '8px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-secondary)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.8em', color: 'var(--color-text-secondary)' }}>
                          {new Date(note.created_at).toLocaleString('fr-FR')}
                          {note.is_brain_dump && <span style={{ marginLeft: '8px', color: 'var(--color-primary)' }}>🧠 Brain Dump</span>}
                        </span>
                        {note.is_brain_dump && (
                          <button
                            className="btn-task btn-task-primary"
                            onClick={async () => {
                              try {
                                const response = await fetch(`${API_URL}/notes/${note.id}/convert-to-tasks`, {
                                  method: 'POST',
                                  headers: { 'Authorization': `Bearer ${token}` }
                                })
                                if (response.ok) {
                                  const data = await response.json()
                                  fetchTasks(token)
                                  fetchNotes()
                                  sendNotification('✅ Tâches créées', `${data.count} tâches créées depuis le brain dump`)
                                }
                              } catch (error) {
                                console.error('Error converting note:', error)
                              }
                            }}
                          >
                            Convertir en tâches
                          </button>
                        )}
                      </div>
                      <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="task-detail-text">Aucune note. Créez un brain dump pour capturer vos idées rapidement.</p>
              )}
            </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => setShowNotesModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Brain Dump */}
      {showBrainDumpModal && (
        <div className="taskflow-modal-overlay" onClick={() => {
          setShowBrainDumpModal(false)
          setBrainDumpContent('')
        }}>
          <div className="taskflow-modal taskflow-modal-large" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">🧠 Brain Dump</h3>
              <button className="modal-close" onClick={() => {
                setShowBrainDumpModal(false)
                setBrainDumpContent('')
              }}>×</button>
            </div>
            <div className="taskflow-modal-body">
              <div className="form-group-modern">
                <label className="form-label-modern">Capturez vos idées</label>
                <textarea
                  className="form-input-modern"
                  rows={10}
                  value={brainDumpContent}
                  onChange={(e) => setBrainDumpContent(e.target.value)}
                  placeholder="Tapez vos idées ici... (une par ligne, commencez par - ou *)"
                />
                <small className="form-hint">Commencez chaque ligne par - ou * pour faciliter la conversion en tâches</small>
              </div>
            </div>
            <div className="taskflow-modal-footer">
              <button
                className="btn-auth-secondary"
                onClick={() => {
                  setShowBrainDumpModal(false)
                  setBrainDumpContent('')
                }}
              >
                Annuler
              </button>
              <button
                className="btn-auth-primary"
                onClick={async () => {
                  if (!brainDumpContent.trim()) return
                  try {
                    const response = await fetch(`${API_URL}/notes`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        content: brainDumpContent,
                        is_brain_dump: true
                      })
                    })
                    if (response.ok) {
                      fetchNotes()
                      setShowBrainDumpModal(false)
                      setBrainDumpContent('')
                      sendNotification('✅ Brain Dump créé', 'Vous pouvez le convertir en tâches plus tard')
                    }
                  } catch (error) {
                    console.error('Error creating brain dump:', error)
                  }
                }}
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Statistiques */}
      {showStatsModal && dashboardStats && (
        <div className="taskflow-modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="taskflow-modal taskflow-modal-large" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">📊 Statistiques Motivantes</h3>
              <button className="modal-close" onClick={() => setShowStatsModal(false)}>×</button>
            </div>
            <div className="taskflow-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', backgroundColor: 'var(--color-success)', borderRadius: '8px', color: 'white', textAlign: 'center' }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{dashboardStats.tasks_completed_today}</div>
                  <div>Tâches terminées aujourd'hui</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--color-primary)', borderRadius: '8px', color: 'white', textAlign: 'center' }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{dashboardStats.tasks_in_progress}</div>
                  <div>En cours</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--color-warning)', borderRadius: '8px', color: 'white', textAlign: 'center' }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{dashboardStats.streak_days}</div>
                  <div>Jours consécutifs 🔥</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--color-info)', borderRadius: '8px', color: 'white', textAlign: 'center' }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{Math.round(dashboardStats.time_spent_today_minutes / 60)}h</div>
                  <div>Temps passé aujourd'hui</div>
                </div>
              </div>
              {dashboardStats.time_awareness && (
                <div className="task-detail-section">
                  <label className="task-detail-label">⏱️ Time Awareness</label>
                  <div style={{ padding: '12px', backgroundColor: 'var(--color-secondary)', borderRadius: '8px' }}>
                    <div>Moyenne estimée: {dashboardStats.time_awareness.avg_estimated_minutes}min</div>
                    <div>Moyenne réelle: {dashboardStats.time_awareness.avg_actual_minutes}min</div>
                    <div style={{ marginTop: '8px', fontWeight: 'bold' }}>
                      Tendance: {dashboardStats.time_awareness.tendency} ({dashboardStats.time_awareness.difference_percent > 0 ? '+' : ''}{dashboardStats.time_awareness.difference_percent}%)
                    </div>
                  </div>
                </div>
              )}
              {dashboardStats.best_day && (
                <div className="task-detail-section">
                  <label className="task-detail-label">🏆 Meilleure journée</label>
                  <div style={{ padding: '12px', backgroundColor: 'var(--color-success)', borderRadius: '8px', color: 'white' }}>
                    <div>{new Date(dashboardStats.best_day.date).toLocaleDateString('fr-FR')}</div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{dashboardStats.best_day.count} tâches terminées</div>
                  </div>
                </div>
              )}
            </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => setShowStatsModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pauses */}
      {showBreaksModal && (
        <div className="taskflow-modal-overlay" onClick={() => setShowBreaksModal(false)}>
          <div className="taskflow-modal" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">☕ Pauses Structurées</h3>
              <button className="modal-close" onClick={() => setShowBreaksModal(false)}>×</button>
            </div>
            <div className="taskflow-modal-body">
              {activeBreak ? (
                <div style={{ padding: '16px', backgroundColor: 'var(--color-warning)', borderRadius: '8px', color: 'white', textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>Pause en cours</div>
                  <div>{Math.round(activeBreak.duration_minutes)} minutes</div>
                  <button
                    className="btn-auth-primary"
                    style={{ marginTop: '12px' }}
                    onClick={async () => {
                      try {
                        const response = await fetch(`${API_URL}/breaks/${activeBreak.id}/end`, {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${token}` }
                        })
                        if (response.ok) {
                          setActiveBreak(null)
                          fetchBreaks()
                          sendNotification('✅ Pause terminée', 'Retour au travail !')
                        }
                      } catch (error) {
                        console.error('Error ending break:', error)
                      }
                    }}
                  >
                    Terminer la pause
                  </button>
                </div>
              ) : (
                <div className="form-group-modern">
                  <label className="form-label-modern">Type de pause</label>
                  <select
                    className="form-input-modern"
                    value={breakType}
                    onChange={(e) => setBreakType(e.target.value)}
                  >
                    <option value="short">Courte (5-10 min)</option>
                    <option value="long">Longue (15-30 min)</option>
                    <option value="lunch">Déjeuner</option>
                  </select>
                  <button
                    className="btn-auth-primary"
                    style={{ marginTop: '12px', width: '100%' }}
                    onClick={async () => {
                      try {
                        const response = await fetch(`${API_URL}/breaks/start`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ break_type: breakType })
                        })
                        if (response.ok) {
                          const data = await response.json()
                          setActiveBreak(data)
                          fetchBreaks()
                          sendNotification('☕ Pause démarrée', 'Prenez le temps de vous détendre')
                        }
                      } catch (error) {
                        console.error('Error starting break:', error)
                      }
                    }}
                  >
                    Démarrer une pause
                  </button>
                </div>
              )}
            </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => setShowBreaksModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Energy */}
      {showEnergyModal && (
        <div className="taskflow-modal-overlay" onClick={() => setShowEnergyModal(false)}>
          <div className="taskflow-modal" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">⚡ Energy Level Tracking</h3>
              <button className="modal-close" onClick={() => setShowEnergyModal(false)}>×</button>
            </div>
            <div className="taskflow-modal-body">
              <div className="form-group-modern">
                <label className="form-label-modern">Niveau d'énergie actuel (1-5)</label>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setEnergyLevel(level)}
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        border: `3px solid ${energyLevel === level ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        backgroundColor: energyLevel === level ? 'var(--color-primary)' : 'var(--color-secondary)',
                        color: energyLevel === level ? 'white' : 'var(--color-text)',
                        fontSize: '1.2em',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <button
                  className="btn-auth-primary"
                  style={{ width: '100%' }}
                  onClick={async () => {
                    if (!energyLevel) return
                    try {
                      const response = await fetch(`${API_URL}/energy/log`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ energy_level: energyLevel })
                      })
                      if (response.ok) {
                        fetchEnergyData()
                        sendNotification('⚡ Niveau enregistré', `Niveau d'énergie: ${energyLevel}/5`)
                      }
                    } catch (error) {
                      console.error('Error logging energy:', error)
                    }
                  }}
                  disabled={!energyLevel}
                >
                  Enregistrer
                </button>
              </div>
              {energyLogs.length > 0 && (
                <div className="task-detail-section">
                  <label className="task-detail-label">Historique (7 derniers jours)</label>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {energyLogs.map((log: any) => (
                      <div key={log.id} style={{
                        padding: '8px',
                        marginBottom: '4px',
                        backgroundColor: 'var(--color-secondary)',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span>{new Date(log.timestamp).toLocaleString('fr-FR')}</span>
                        <span style={{ fontWeight: 'bold' }}>Niveau {log.energy_level}/5</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => setShowEnergyModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rappels */}
      {showRemindersModal && (
        <div className="taskflow-modal-overlay" onClick={() => setShowRemindersModal(false)}>
          <div className="taskflow-modal taskflow-modal-large" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">🔔 Rappels Contextuels</h3>
              <button className="modal-close" onClick={() => setShowRemindersModal(false)}>×</button>
            </div>
            <div className="taskflow-modal-body">
              <div style={{ marginBottom: '16px' }}>
                <button
                  className="btn-auth-primary"
                  onClick={async () => {
                    await createAutoReminders()
                    fetchPendingReminders()
                  }}
                >
                  🔄 Créer des rappels automatiques
                </button>
              </div>
              {pendingReminders.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {pendingReminders.map((reminder: any) => {
                    const task = tasks.find(t => t.id === reminder.task_id)
                    return (
                      <div key={reminder.id} style={{
                        padding: '12px',
                        marginBottom: '8px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        backgroundColor: 'var(--color-secondary)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div>
                            <strong>{reminder.reminder_type === 'due_date' ? '📅 Échéance' : reminder.reminder_type === 'blocked_days' ? '🚫 Tâche bloquée' : '🔔 Rappel'}</strong>
                            {task && (
                              <div style={{ marginTop: '4px' }}>{task.title}</div>
                            )}
                            <div style={{ fontSize: '0.85em', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                              {new Date(reminder.reminder_time).toLocaleString('fr-FR')}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              className="btn-task btn-task-secondary"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`${API_URL}/reminders/${reminder.id}/snooze?minutes=15`, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  })
                                  if (response.ok) {
                                    fetchPendingReminders()
                                  }
                                } catch (error) {
                                  console.error('Error snoozing reminder:', error)
                                }
                              }}
                            >
                              ⏰ +15min
                            </button>
                            <button
                              className="btn-task btn-task-danger-outline"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`${API_URL}/reminders/${reminder.id}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  })
                                  if (response.ok) {
                                    fetchPendingReminders()
                                  }
                                } catch (error) {
                                  console.error('Error deleting reminder:', error)
                                }
                              }}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="task-detail-text">Aucun rappel en attente. Les rappels sont créés automatiquement pour les tâches avec échéances.</p>
              )}
            </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => setShowRemindersModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Timeline */}
      {showTimelineModal && (
        <div className="taskflow-modal-overlay" onClick={() => setShowTimelineModal(false)}>
          <div className="taskflow-modal taskflow-modal-large" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">📅 Visualisation Temporelle</h3>
              <button className="modal-close" onClick={() => setShowTimelineModal(false)}>×</button>
            </div>
            <div className="taskflow-modal-body">
              <div style={{ marginBottom: '16px' }}>
                <p className="task-detail-text">
                  Timeline horizontale montrant toutes les tâches avec leurs durées estimées et réelles.
                </p>
              </div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                maxHeight: '500px',
                overflowY: 'auto'
              }}>
                {tasks.filter(t => t.due_date || t.estimated_time_minutes).map((task) => {
                  const startDate = task.created_at ? new Date(task.created_at) : new Date()
                  const dueDate = task.due_date ? new Date(task.due_date) : null
                  const estimatedMinutes = task.estimated_time_minutes || 60
                  const actualMinutes = task.time_spent_seconds ? Math.round(task.time_spent_seconds / 60) : null
                  
                  return (
                    <div key={task.id} style={{
                      padding: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-secondary)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong>{task.title}</strong>
                        <span style={{ fontSize: '0.8em', color: 'var(--color-text-secondary)' }}>
                          {task.status}
                        </span>
                      </div>
                      <div style={{ 
                        height: '20px', 
                        backgroundColor: 'var(--color-border)', 
                        borderRadius: '4px',
                        position: 'relative',
                        marginBottom: '4px'
                      }}>
                        {dueDate && (
                          <div style={{
                            position: 'absolute',
                            left: '0',
                            top: '0',
                            height: '100%',
                            width: `${Math.min(100, (estimatedMinutes / 480) * 100)}%`,
                            backgroundColor: task.status === 'done' ? 'var(--color-success)' : 'var(--color-primary)',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7em',
                            color: 'white'
                          }}>
                            Est: {estimatedMinutes}min
                          </div>
                        )}
                        {actualMinutes && (
                          <div style={{
                            position: 'absolute',
                            left: dueDate ? `${Math.min(100, (estimatedMinutes / 480) * 100)}%` : '0',
                            top: '0',
                            height: '100%',
                            width: `${Math.min(100, (actualMinutes / 480) * 100)}%`,
                            backgroundColor: 'var(--color-warning)',
                            borderRadius: '4px',
                            marginLeft: dueDate ? '2px' : '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7em',
                            color: 'white'
                          }}>
                            Réel: {actualMinutes}min
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8em', color: 'var(--color-text-secondary)' }}>
                        {dueDate && `Échéance: ${dueDate.toLocaleDateString('fr-FR')}`}
                        {task.created_at && ` | Créée: ${new Date(task.created_at).toLocaleDateString('fr-FR')}`}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => setShowTimelineModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aide Commandes Vocales */}
      {showVoiceHelpModal && (
        <div className="taskflow-modal-overlay" onClick={() => setShowVoiceHelpModal(false)}>
          <div className="taskflow-modal taskflow-modal-large" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">🎤 Aide - Commandes Vocales</h3>
              <button className="modal-close" onClick={() => setShowVoiceHelpModal(false)}>×</button>
            </div>
            <div className="taskflow-modal-body">
              <div style={{ marginBottom: '24px' }}>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                  Utilisez les commandes vocales pour contrôler TaskFlow sans utiliser la souris. 
                  Activez l'écoute avec le bouton 🎤 ou le raccourci <kbd>Ctrl+Shift+V</kbd>.
                </p>
                {!voiceCommandsEnabled && (
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: 'var(--color-warning)', 
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    ⚠️ Les commandes vocales ne sont pas disponibles dans votre navigateur.
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gap: '24px' }}>
                {/* Création et gestion */}
                <div>
                  <h4 style={{ marginBottom: '12px', color: 'var(--color-primary)' }}>📋 Création et Gestion</h4>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <strong>"créer tâche"</strong> ou <strong>"nouvelle tâche"</strong> - Ouvre le formulaire de création
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <strong>"créer tâche [titre]"</strong> - Crée une tâche avec le titre spécifié
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div>
                  <h4 style={{ marginBottom: '12px', color: 'var(--color-primary)' }}>🧭 Navigation</h4>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <strong>"calendrier"</strong> - Ouvre le calendrier
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <strong>"statistiques"</strong> ou <strong>"stats"</strong> - Ouvre les statistiques
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <strong>"templates"</strong> ou <strong>"modèles"</strong> - Ouvre les templates
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <strong>"tags"</strong> ou <strong>"étiquettes"</strong> - Ouvre la gestion des tags
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <strong>"notes"</strong> ou <strong>"brain dump"</strong> - Ouvre les notes
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <strong>"pauses"</strong> - Ouvre la gestion des pauses
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <strong>"énergie"</strong> - Ouvre le suivi d'énergie
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <strong>"rappels"</strong> - Ouvre les rappels
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <strong>"timeline"</strong> - Ouvre la timeline
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <strong>"time awareness"</strong> - Ouvre la conscience du temps
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <strong>"corbeille"</strong> - Ouvre la corbeille
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <h4 style={{ marginBottom: '12px', color: 'var(--color-primary)' }}>⚡ Actions</h4>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <strong>"fermer"</strong> ou <strong>"annuler"</strong> - Ferme tous les modals ouverts
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <strong>"aide"</strong> ou <strong>"help"</strong> - Ouvre cette aide
                    </div>
                  </div>
                </div>

                {/* Raccourcis clavier */}
                <div>
                  <h4 style={{ marginBottom: '12px', color: 'var(--color-primary)' }}>⌨️ Raccourcis Clavier</h4>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <kbd>Ctrl+Shift+V</kbd> - Activer/désactiver l'écoute vocale
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <kbd>Ctrl+K</kbd> - Créer une tâche
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <kbd>Ctrl+C</kbd> - Ouvrir le calendrier
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <kbd>Ctrl+S</kbd> - Ouvrir les statistiques
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <kbd>Ctrl+N</kbd> - Ouvrir les notes
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                      <kbd>Escape</kbd> - Fermer les modals
                    </div>
                  </div>
                </div>

                {/* Paramètres */}
                <div>
                  <h4 style={{ marginBottom: '12px', color: 'var(--color-primary)' }}>⚙️ Paramètres</h4>
                  <div style={{ padding: '12px', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={voiceAudioFeedback}
                        onChange={(e) => setVoiceAudioFeedback(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>Feedback audio (son de confirmation lors de l'exécution des commandes)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => setShowVoiceHelpModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </>
  )
}

// CalendarView est maintenant importé depuis components/CalendarView.tsx