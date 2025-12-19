'use client'

import { useState } from 'react'
import { Task } from '../types'

export default function CalendarView({ tasks }: { tasks: Task[] }) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')

  const month = currentDate.getMonth()
  const year = currentDate.getFullYear()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return tasks.filter(task => {
      // Tâches terminées ce jour
      if (task.completed_at) {
        const completedDate = new Date(task.completed_at).toISOString().split('T')[0]
        if (completedDate === dateStr) return true
      }
      // Tâches créées ce jour
      if (task.created_at) {
        const createdDate = new Date(task.created_at).toISOString().split('T')[0]
        if (createdDate === dateStr) return true
      }
      // Tâches démarrées ce jour
      if (task.started_at) {
        const startedDate = new Date(task.started_at).toISOString().split('T')[0]
        if (startedDate === dateStr) return true
      }
      // Tâches mises en standby ce jour
      if (task.standby_at) {
        const standbyDate = new Date(task.standby_at).toISOString().split('T')[0]
        if (standbyDate === dateStr) return true
      }
      return false
    })
  }

  const getDaysArray = () => {
    const days = []
    // Jours du mois précédent
    const prevMonthDays = new Date(year, month, 0).getDate()
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      })
    }
    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      })
    }
    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      })
    }
    return days
  }

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Lundi
    startOfWeek.setDate(diff)
    
    const days = []
    for (let i = 0; i < 4; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push(date)
    }
    return days
  }

  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1))
    } else if (viewMode === 'week') {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() - 4)
      setCurrentDate(newDate)
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() - 1)
      setCurrentDate(newDate)
    }
  }

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1))
    } else if (viewMode === 'week') {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 4)
      setCurrentDate(newDate)
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 1)
      setCurrentDate(newDate)
    }
  }

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : []
  const weekDays = getWeekDays()

  const getPeriodTitle = () => {
    if (viewMode === 'month') {
      return `${monthNames[month]} ${year}`
    } else if (viewMode === 'week') {
      const start = weekDays[0]
      const end = weekDays[weekDays.length - 1]
      return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    }
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-view-selector">
          <button 
            className={`calendar-view-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Mois
          </button>
          <button 
            className={`calendar-view-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            4 Jours
          </button>
          <button 
            className={`calendar-view-btn ${viewMode === 'day' ? 'active' : ''}`}
            onClick={() => setViewMode('day')}
          >
            Jour
          </button>
        </div>
        <button className="btn-calendar-nav" onClick={prevPeriod}>‹</button>
        <h4 className="calendar-month">{getPeriodTitle()}</h4>
        <button className="btn-calendar-nav" onClick={nextPeriod}>›</button>
      </div>

      {viewMode === 'month' && (
        <div className="calendar-grid">
          {dayNames.map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
          {getDaysArray().map((dayObj, index) => {
            const dayTasks = getTasksForDate(dayObj.date)
            const isToday = dayObj.date.toDateString() === new Date().toDateString()
            const isSelected = selectedDate && dayObj.date.toDateString() === selectedDate.toDateString()

            return (
              <div
                key={index}
                className={`calendar-day ${!dayObj.isCurrentMonth ? 'calendar-day-other-month' : ''} ${isToday ? 'calendar-day-today' : ''} ${isSelected ? 'calendar-day-selected' : ''}`}
                onClick={() => setSelectedDate(dayObj.date)}
              >
                <div className="calendar-day-number">{dayObj.date.getDate()}</div>
                {dayTasks.length > 0 && (
                  <div className="calendar-day-tasks">
                    {dayTasks.slice(0, 3).map(task => (
                      <div
                        key={task.id}
                        className={`calendar-task-dot calendar-task-${task.status}`}
                        title={task.title}
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="calendar-task-more">+{dayTasks.length - 3}</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {viewMode === 'week' && (
        <div className="calendar-week-view">
          {weekDays.map((date, index) => {
            const dayTasks = getTasksForDate(date)
            const isToday = date.toDateString() === new Date().toDateString()
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()

            return (
              <div
                key={index}
                className={`calendar-week-day ${isToday ? 'calendar-day-today' : ''} ${isSelected ? 'calendar-day-selected' : ''}`}
                onClick={() => setSelectedDate(date)}
              >
                <div className="calendar-week-day-header">
                  <div className="calendar-week-day-name">{dayNames[date.getDay()]}</div>
                  <div className="calendar-week-day-number">{date.getDate()}</div>
                </div>
                <div className="calendar-week-day-tasks">
                  {dayTasks.length > 0 ? (
                    dayTasks.map(task => (
                      <div
                        key={task.id}
                        className={`calendar-week-task-item calendar-task-${task.status}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDate(date)
                        }}
                      >
                        <div className="calendar-week-task-title">{task.title}</div>
                        {task.trello_id && (
                          <div className="calendar-week-task-trello">🔗 {task.trello_id}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="calendar-week-day-empty">Aucune tâche</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewMode === 'day' && (
        <div className="calendar-day-view">
          <div className="calendar-day-view-header">
            <div className="calendar-day-view-date">
              <div className="calendar-day-view-day-name">{dayNames[currentDate.getDay()]}</div>
              <div className="calendar-day-view-day-number">{currentDate.getDate()}</div>
              <div className="calendar-day-view-month-year">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</div>
            </div>
          </div>
          <div className="calendar-day-view-tasks">
            {getTasksForDate(currentDate).length > 0 ? (
              getTasksForDate(currentDate).map(task => {
                const dateStr = currentDate.toISOString().split('T')[0]
                const isCompleted = task.completed_at && new Date(task.completed_at).toISOString().split('T')[0] === dateStr
                const isCreated = task.created_at && new Date(task.created_at).toISOString().split('T')[0] === dateStr
                const isStarted = task.started_at && new Date(task.started_at).toISOString().split('T')[0] === dateStr
                const isStandby = task.standby_at && new Date(task.standby_at).toISOString().split('T')[0] === dateStr

                return (
                  <div key={task.id} className={`calendar-day-view-task calendar-task-${task.status}`}>
                    <div className="calendar-day-view-task-header">
                      <div className="calendar-day-view-task-title">{task.title}</div>
                      <div className="calendar-day-view-task-badges">
                        <span className={`badge badge-${task.status}`}>{task.status}</span>
                        <span className={`badge badge-priority-${task.priority}`}>{task.priority}</span>
                      </div>
                    </div>
                    {task.description && (
                      <div className="calendar-day-view-task-description">{task.description}</div>
                    )}
                    <div className="calendar-day-view-task-dates">
                      {isCreated && (
                        <div className="calendar-task-date-item">
                          <span className="calendar-date-icon">📅</span>
                          <span>Créée: {new Date(task.created_at!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {isStarted && (
                        <div className="calendar-task-date-item">
                          <span className="calendar-date-icon">▶️</span>
                          <span>Démarrée: {new Date(task.started_at!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {isStandby && (
                        <div className="calendar-task-date-item">
                          <span className="calendar-date-icon">⏸️</span>
                          <span>En standby: {new Date(task.standby_at!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {isCompleted && (
                        <div className="calendar-task-date-item">
                          <span className="calendar-date-icon">✅</span>
                          <span>Terminée: {new Date(task.completed_at!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {task.trello_id && (
                        <div className="calendar-task-date-item">
                          <span className="calendar-date-icon">🔗</span>
                          <span>Trello: {task.trello_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="calendar-day-view-empty">Aucune tâche pour ce jour</div>
            )}
          </div>
        </div>
      )}

      {selectedDate && (
        <div className="calendar-selected-date">
          <h5 className="calendar-selected-title">
            Tâches du {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h5>
          {selectedDateTasks.length > 0 ? (
            <div className="calendar-tasks-list">
              {selectedDateTasks.map(task => {
                const dateStr = selectedDate.toISOString().split('T')[0]
                const isCompleted = task.completed_at && new Date(task.completed_at).toISOString().split('T')[0] === dateStr
                const isCreated = task.created_at && new Date(task.created_at).toISOString().split('T')[0] === dateStr
                const isStarted = task.started_at && new Date(task.started_at).toISOString().split('T')[0] === dateStr
                const isStandby = task.standby_at && new Date(task.standby_at).toISOString().split('T')[0] === dateStr

                return (
                  <div key={task.id} className={`calendar-task-item calendar-task-${task.status}`}>
                    <div className="calendar-task-header">
                      <div>
                        <strong>{task.title}</strong>
                        {task.description && (
                          <p className="calendar-task-description-small">{task.description}</p>
                        )}
                      </div>
                      <div className="calendar-task-badges">
                        <span className={`badge badge-${task.status}`}>{task.status}</span>
                        <span className={`badge badge-priority-${task.priority}`}>{task.priority}</span>
                      </div>
                    </div>
                    <div className="calendar-task-dates">
                      {isCreated && (
                        <div className="calendar-task-date-item">
                          <span className="calendar-date-icon">📅</span>
                          <span>Créée: {new Date(task.created_at!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {isStarted && (
                        <div className="calendar-task-date-item">
                          <span className="calendar-date-icon">▶️</span>
                          <span>Démarrée: {new Date(task.started_at!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {isStandby && (
                        <div className="calendar-task-date-item">
                          <span className="calendar-date-icon">⏸️</span>
                          <span>En standby: {new Date(task.standby_at!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {isCompleted && (
                        <div className="calendar-task-date-item">
                          <span className="calendar-date-icon">✅</span>
                          <span>Terminée: {new Date(task.completed_at!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {task.trello_id && (
                        <div className="calendar-task-date-item">
                          <span className="calendar-date-icon">🔗</span>
                          <span>Trello: {task.trello_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="calendar-no-tasks">Aucune tâche pour cette date</div>
          )}
        </div>
      )}
    </div>
  )
}

