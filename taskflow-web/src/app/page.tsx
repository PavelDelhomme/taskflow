'use client'

import { useState, useEffect, useMemo } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import AuthPage from './components/AuthPage'
import CalendarView from './components/CalendarView'
import { User, Task, Workflow, AuthPageProps } from './types'

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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'

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
      initNotifications()
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
        if (token) {
          fetchPendingReminders()
        }
      }, 60000)
      
      return () => {
        if (reminderInterval) clearInterval(reminderInterval)
      }
      
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
    } else {
      // Pas de token valide, s'assurer que l'utilisateur est déconnecté
      setIsLoggedIn(false)
      setToken('')
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
      if (document.head && document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [])

  // 🎤 Initialiser les commandes vocales
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'fr-FR'
      
      recognition.onresult = (event: any) => {
        const command = event.results[0][0].transcript.toLowerCase()
        handleVoiceCommand(command)
      }
      
      setRecognition(recognition)
    }
  }, [])

  // 🎤 Gestion des commandes vocales
  const handleVoiceCommand = (command: string) => {
    if (command.includes('créer') || command.includes('nouvelle tâche')) {
      setShowCreateModal(true)
    } else if (command.includes('calendrier')) {
      setShowCalendarModal(true)
    } else if (command.includes('statistiques') || command.includes('stats')) {
      fetchDashboardStats()
      setShowStatsModal(true)
    } else if (command.includes('pause')) {
      fetchBreaks()
      setShowBreaksModal(true)
    } else if (command.includes('notes') || command.includes('brain dump')) {
      setShowNotesModal(true)
    } else if (command.includes('templates')) {
      fetchTemplates()
      setShowTemplatesModal(true)
    }
  }

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
        if (recognition) {
          recognition.start()
          sendNotification('🎤 Écoute active', 'Parlez votre commande...')
        }
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

  const initNotifications = async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
    }
  }

  const sendNotification = (title: string, body: string, options?: NotificationOptions) => {
    if (notificationsEnabled && 'Notification' in window) {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'taskflow-reminder',
        ...options
      })
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
        initNotifications()
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
        due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null,
        project: newTask.project || null,
        estimated_time_minutes: newTask.estimated_time_minutes || null
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
        setNewTask({ title: '', description: '', priority: 'medium', trello_id: '', due_date: '', project: '', estimated_time_minutes: null })
        setShowCreateModal(false)
        fetchTasks(token)
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
    const newStates = {
      ...columnStates,
      [status]: !columnStates[status]
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

  const getTaskActions = (task: Task) => {
    const actions = []
    
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
              <div className="navbar-actions">
                <div className="navbar-actions-desktop">
                  {recognition && (
                    <button
                      className="btn-nav btn-nav-secondary"
                      onClick={() => {
                        if (recognition) {
                          recognition.start()
                          sendNotification('🎤 Écoute active', 'Parlez votre commande...')
                        }
                      }}
                      title="Commandes vocales (Ctrl+Shift+V)"
                    >
                      <span>🎤</span>
                      <span className="btn-label">Voix</span>
                    </button>
                  )}
                  <button 
                    className="btn-nav btn-nav-primary" 
                    onClick={() => setShowCreateModal(true)}
                    title="Créer une tâche (Ctrl+K)"
                  >
                    <span>➕</span>
                    <span className="btn-label">Tâche</span>
                  </button>
                  <button 
                    className="btn-nav btn-nav-success" 
                    onClick={fetchDailySummary}
                  >
                    <span>📋</span>
                    <span className="btn-label">Daily</span>
                  </button>
                  <button 
                    className="btn-nav btn-nav-info" 
                    onClick={fetchWeeklySummary}
                  >
                    <span>📊</span>
                    <span className="btn-label">Weekly</span>
                  </button>
                  <button 
                    className="btn-nav btn-nav-warning" 
                    onClick={() => setShowWorkflowModal(true)}
                  >
                    <span>📋</span>
                    <span className="btn-label">Workflows</span>
                  </button>
                  <button 
                    className="btn-nav btn-nav-info" 
                    onClick={() => setShowCalendarModal(true)}
                  >
                    <span>📅</span>
                    <span className="btn-label">Calendrier</span>
                  </button>
                  <button 
                    className="btn-nav btn-nav-secondary" 
                    onClick={() => {
                      fetchDeletedTasks()
                      setShowTrashModal(true)
                    }}
                  >
                    <span>🗑️</span>
                    <span className="btn-label">Corbeille</span>
                  </button>
                  <button 
                    className="btn-nav btn-nav-info" 
                    onClick={() => {
                      fetchTimeComparisonStats()
                      setShowTimeAwarenessModal(true)
                    }}
                    title="Time Awareness - Comparaison estimation vs réalité"
                  >
                    <span>⏱️</span>
                    <span className="btn-label">Time</span>
                  </button>
                  <button 
                    className="btn-nav btn-nav-success" 
                    onClick={() => {
                      fetchTemplates()
                      setShowTemplatesModal(true)
                    }}
                    title="Templates de tâches"
                  >
                    <span>📄</span>
                    <span className="btn-label">Templates</span>
                  </button>
                  <button 
                    className="btn-nav btn-nav-warning" 
                    onClick={() => {
                      fetchTags()
                      setShowTagsModal(true)
                    }}
                    title="Tags et filtres"
                  >
                    <span>🏷️</span>
                    <span className="btn-label">Tags</span>
                  </button>
                  <button 
                    className="btn-nav btn-nav-info" 
                    onClick={() => {
                      fetchNotes()
                      setShowNotesModal(true)
                    }}
                    title="Notes et Brain Dump"
                  >
                    <span>📝</span>
                    <span className="btn-label">Notes</span>
                  </button>
                  <button 
                    className="btn-nav btn-nav-primary" 
                    onClick={() => {
                      fetchDashboardStats()
                      setShowStatsModal(true)
                    }}
                    title="Statistiques motivantes"
                  >
                    <span>📊</span>
                    <span className="btn-label">Stats</span>
                  </button>
                  <button 
                    className="btn-nav btn-nav-secondary" 
                    onClick={() => {
                      fetchBreaks()
                      setShowBreaksModal(true)
                    }}
                    title="Pauses structurées"
                  >
                    <span>☕</span>
                    <span className="btn-label">Pauses</span>
                  </button>
                  <button 
                    className="btn-nav btn-nav-success" 
                    onClick={() => {
                      fetchEnergyData()
                      setShowEnergyModal(true)
                    }}
                    title="Energy Level Tracking"
                  >
                    <span>⚡</span>
                    <span className="btn-label">Energy</span>
                  </button>
                  <button 
                    className="btn-nav btn-nav-warning" 
                    onClick={() => {
                      fetchPendingReminders()
                      setShowRemindersModal(true)
                    }}
                    title="Rappels contextuels"
                  >
                    <span>🔔</span>
                    <span className="btn-label">Rappels</span>
                  </button>
                  <button 
                    className="btn-nav btn-nav-info" 
                    onClick={() => setShowTimelineModal(true)}
                    title="Visualisation temporelle"
                  >
                    <span>📅</span>
                    <span className="btn-label">Timeline</span>
                  </button>
                </div>
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

      {/* FAB - Floating Action Button */}
      <div className={`fab-container ${fabOpen ? 'open' : ''}`}>
        <div className="fab-menu">
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
            className="fab-item fab-item-warning"
            onClick={() => {
              setShowWorkflowModal(true)
              setFabOpen(false)
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
            }}
          >
            <span className="fab-icon">📅</span>
            <span className="fab-label">Calendrier</span>
          </button>
        </div>
        <button 
          className={`fab-main ${fabOpen ? 'open' : ''}`}
          onClick={() => setFabOpen(!fabOpen)}
          aria-label="Menu actions"
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
                  onChange={(e) => setSelectedTask({...selectedTask, due_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
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
                    onChange={(e) => setSelectedTask({...selectedTask, estimated_time_minutes: e.target.value ? parseInt(e.target.value) : null})}
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
                          Supprimée le {new Date(task.deleted_at).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
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

      </div>
    </>
  )
}

// CalendarView est maintenant importé depuis components/CalendarView.tsx