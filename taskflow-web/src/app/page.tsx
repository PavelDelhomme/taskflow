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
    trello_id: ''
  })

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
    
    let interval: NodeJS.Timeout | null = null
    
    if (savedToken) {
      setToken(savedToken)
      setIsLoggedIn(true)
      fetchTasks(savedToken)
      fetchWorkflows(savedToken)
      checkForReminders(savedToken)
      initNotifications()
      
      interval = setInterval(() => {
        checkForReminders(savedToken)
      }, 30 * 60 * 1000)
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

  const fetchTasks = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/tasks/`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchWorkflows = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/workflows`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data)
      }
    } catch (error) {
      console.error('Error fetching workflows:', error)
    }
  }

  const checkForReminders = async (authToken: string) => {
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
      const response = await fetch(`${API_URL}/tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      })

      if (response.ok) {
        setNewTask({ title: '', description: '', priority: 'medium', trello_id: '' })
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
      const response = await fetch(`${API_URL}/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newWorkflow.name,
          steps: newWorkflow.steps,
          category: newWorkflow.category,
          project: newWorkflow.project || null
        })
      })

      if (response.ok) {
        setNewWorkflow({ name: '', steps: '', category: 'dev', project: '' })
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
                  <button 
                    className="btn-nav btn-nav-primary" 
                    onClick={() => setShowCreateModal(true)}
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
                </div>
                <button 
                  className={`btn-nav btn-nav-icon ${notificationsEnabled ? 'active' : ''}`} 
                  onClick={() => setShowNotificationModal(true)}
                  title="Notifications"
                >
                  🔔
                </button>
                <button 
                  className="btn-nav btn-nav-icon" 
                  onClick={() => setDarkMode(!darkMode)}
                  title={darkMode ? 'Mode clair' : 'Mode sombre'}
                  aria-label={darkMode ? 'Mode clair' : 'Mode sombre'}
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
                <button 
                  className="btn-nav btn-nav-danger btn-nav-logout" 
                  onClick={logout}
                  title="Déconnexion"
                  aria-label="Déconnexion"
                >
                  <span className="btn-icon-mobile">🚪</span>
                  <span className="btn-label">Déconnexion</span>
                </button>
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
                    <div className="task-badges">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
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
                    setShowTaskDetailModal(true)
                  }}>
                    <div className="task-header">
                      <h4 className="task-title">{task.title}</h4>
                      {task.trello_id && (
                        <span className="task-trello">🔗 {task.trello_id}</span>
                      )}
                    </div>
                    <div className="task-badges">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
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
                    setShowTaskDetailModal(true)
                  }}>
                    <div className="task-header">
                      <h4 className="task-title">{task.title}</h4>
                      {task.trello_id && (
                        <span className="task-trello">🔗 {task.trello_id}</span>
                      )}
                    </div>
                    <div className="task-badges">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
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
                    setShowTaskDetailModal(true)
                  }}>
                    <div className="task-header">
                      <h4 className="task-title">{task.title}</h4>
                      {task.trello_id && (
                        <span className="task-trello">🔗 {task.trello_id}</span>
                      )}
                    </div>
                    {task.blocked_reason && (
                      <div className="task-blocked-reason">
                        <strong>Blocage:</strong> {task.blocked_reason}
                      </div>
                    )}
                    <div className="task-badges">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
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
                    setShowTaskDetailModal(true)
                  }}>
                    <div className="task-header">
                      <h4 className="task-title">{task.title}</h4>
                      {task.trello_id && (
                        <span className="task-trello">🔗 {task.trello_id}</span>
                      )}
                    </div>
                    <div className="task-badges">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
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
                    setShowTaskDetailModal(true)
                  }}>
                    <div className="task-header">
                      <h4 className="task-title">{task.title}</h4>
                      {task.trello_id && (
                        <span className="task-trello">🔗 {task.trello_id}</span>
                      )}
                    </div>
                    <div className="task-badges">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
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
                    trello_id: selectedTask.trello_id
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
                        {workflow.project && (
                          <span className="workflow-project">📁 {workflow.project}</span>
                        )}
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

      {/* Modal Création Workflow */}
      {showCreateWorkflowModal && (
        <div className="taskflow-modal-overlay" onClick={() => setShowCreateWorkflowModal(false)}>
          <div className="taskflow-modal" onClick={e => e.stopPropagation()}>
            <div className="taskflow-modal-header">
              <h3 className="modal-title">➕ Nouveau workflow</h3>
              <button className="modal-close" onClick={() => setShowCreateWorkflowModal(false)}>×</button>
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
                <textarea
                  className="form-input-modern"
                  rows={10}
                  value={newWorkflow.steps}
                  onChange={(e) => setNewWorkflow({...newWorkflow, steps: e.target.value})}
                  placeholder="1. Première étape
2. Deuxième étape
3. Troisième étape"
                  required
                />
                <small className="form-hint">Une étape par ligne, numérotée ou non</small>
              </div>
            </div>
            <div className="taskflow-modal-footer">
              <button className="btn-auth-secondary" onClick={() => setShowCreateWorkflowModal(false)}>
                Annuler
              </button>
              <button 
                className="btn-auth-primary" 
                onClick={createWorkflow}
                disabled={!newWorkflow.name || !newWorkflow.steps}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails Tâche */}
      {showTaskDetailModal && selectedTaskDetail && (
        <div className="taskflow-modal-overlay" onClick={() => setShowTaskDetailModal(false)}>
          <div className="taskflow-modal taskflow-modal-large" onClick={e => e.stopPropagation()}>
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
                      <strong>En standby depuis:</strong> {new Date(selectedTaskDetail.standby_at).toLocaleString('fr-FR')}
                    </div>
                  )}
                </div>
              </div>

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
              <CalendarView tasks={tasks} />
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
      </div>
    </>
  )
}

// CalendarView est maintenant importé depuis components/CalendarView.tsx