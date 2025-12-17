import React, { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import type { EventReceiveArg } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { getEventos, createEvento, updateEvento, deleteEvento, type Evento } from '@/services/eventService';
import { getTareas, createTarea, deleteTarea, toggleTareaCompletada, type Tarea } from '@/services/taskService';
import { useAuth } from '@/context/AuthProvider';
import type { EventInput, DateSelectArg, EventClickArg, EventChangeArg, DatesSetArg } from '@fullcalendar/core';
import EventModal from '@/components/modals/EventModal';
import { Plus, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import '@/styles/NewCalendar.css';

const NewCalendar: React.FC = () => {
  const calendarRef = useRef<FullCalendar>(null);
  const [calendarTitle, setCalendarTitle] = useState('');
  const [events, setEvents] = useState<EventInput[]>([]);
  const [externalEvents, setExternalEvents] = useState<Tarea[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null);
  const { user } = useAuth();
  const externalEventsRef = useRef<HTMLDivElement>(null);

  // Track events being processed to prevent duplicates
  const processingEvents = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (externalEventsRef.current) {
      new Draggable(externalEventsRef.current, {
        itemSelector: '.draggable-event',
        eventData: function (eventEl) {
          return {
            title: eventEl.getAttribute('data-title'),
            color: eventEl.getAttribute('data-color'),
            id: eventEl.getAttribute('data-id'),
            create: true
          };
        }
      });
    }
  }, [externalEvents]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      try {
        console.log('📥 Fetching initial calendar data...');
        const [fetchedTasks, fetchedEvents] = await Promise.all([
          getTareas(user.id),
          getEventos(),
        ]);

        console.log('✅ Fetched tasks:', fetchedTasks.length);
        console.log('✅ Fetched events:', fetchedEvents.length);
        console.log('   Event details:', fetchedEvents.map(e => ({ id: e.id, title: e.titulo })));

        setExternalEvents(fetchedTasks.filter(t => !t.completada));
        const formattedEvents = fetchedEvents.map(event => ({
          id: event.id,
          title: event.titulo,
          start: event.fechaInicio,
          end: event.fechaFin,
          allDay: event.todoElDia,
          color: event.color,
          extendedProps: { description: event.descripcion, location: event.ubicacion }
        }));

        console.log('🔄 Setting initial events state:', formattedEvents.map(e => ({ id: e.id, title: e.title })));
        setEvents(formattedEvents);
      } catch (error) {
        console.error('❌ Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, [user]);

  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      setCalendarTitle(calendarApi.view.title);
    }
  }, []);

  const handleAddTask = async () => {
    if (newTaskTitle.trim() === '' || !user) return;
    try {
      const newTareaData = { titulo: newTaskTitle, color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`, creadoPorId: user.id };
      const createdTask = await createTarea(newTareaData);
      setExternalEvents([...externalEvents, createdTask]);
      setNewTaskTitle('');
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleEventReceive = async (info: EventReceiveArg) => {
    if (!user) return;

    const { id, title, start, end, allDay, backgroundColor } = info.event;
    console.log('🔄 handleEventReceive called with:', { id, title, start, end, allDay, backgroundColor });

    // Prevent duplicate processing of the same event
    if (processingEvents.current.has(id)) {
      console.log('⚠️ Event already being processed, skipping duplicate:', id);
      return;
    }

    // Mark this event as being processed
    processingEvents.current.add(id);

    try {
      const newEventData = {
        titulo: title,
        fechaInicio: start?.toISOString() || new Date().toISOString(),
        fechaFin: end?.toISOString() || start?.toISOString() || new Date().toISOString(),
        todoElDia: allDay,
        color: backgroundColor,
        creadoPorId: user.id
      };

      console.log('📝 Creating event with data:', newEventData);
      const newDbEvent = await createEvento(newEventData as Omit<Evento, 'id'>);
      console.log('✅ Event created successfully:', newDbEvent);

      // Update the events state with the new database event
      const newEventForCalendar = {
        id: newDbEvent.id,
        title: newDbEvent.titulo,
        start: newDbEvent.fechaInicio,
        end: newDbEvent.fechaFin,
        allDay: newDbEvent.todoElDia,
        color: newDbEvent.color,
        extendedProps: { description: newDbEvent.descripcion, location: newDbEvent.ubicacion }
      };

      console.log('🔄 Updating calendar events state');
      console.log('   Old event ID to remove:', id);
      console.log('   New event to add:', newEventForCalendar);

      setEvents(prev => {
        const filtered = prev.filter(e => e.id !== id);
        console.log('   Events after filtering:', filtered.map(e => ({ id: e.id, title: e.title })));
        const updated = [...filtered, newEventForCalendar];
        console.log('   Final events state:', updated.map(e => ({ id: e.id, title: e.title })));
        return updated;
      });

      // Note: We don't delete the task here anymore since the user should manage tasks separately
      // The task remains in the external events list for potential reuse
      console.log('✅ Event creation completed, task remains available for reuse');
    } catch (error) {
      console.error('❌ Error creating event from drop:', error);
      // Don't update the calendar if event creation failed
    } finally {
      // Remove from processing set after a delay to allow for cleanup
      setTimeout(() => {
        processingEvents.current.delete(id);
      }, 1000);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedEvent({ start: selectInfo.startStr, end: selectInfo.endStr, allDay: selectInfo.allDay });
    setIsModalOpen(true);
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    console.log('🖱️ Event clicked:', {
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.startStr,
      end: clickInfo.event.endStr
    });

    const eventData = {
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.startStr,
      end: clickInfo.event.endStr,
      allDay: clickInfo.event.allDay,
      color: clickInfo.event.backgroundColor,
      extendedProps: clickInfo.event.extendedProps
    };

    console.log('📤 Setting selected event for modal:', eventData);
    setSelectedEvent(eventData);
    setIsModalOpen(true);
  };

  const handleEventChange = async (changeInfo: EventChangeArg) => {
    try {
      const { id, title, start, end, allDay } = changeInfo.event;
      const updatedEventData = { titulo: title, fechaInicio: start?.toISOString(), fechaFin: end?.toISOString() || start?.toISOString(), todoElDia: allDay };
      await updateEvento(id, updatedEventData);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleModalSave = (savedEvent: EventInput) => {
    const newEvents = [...events];
    const eventIndex = newEvents.findIndex(e => e.id === savedEvent.id);
    if (eventIndex > -1) {
      newEvents[eventIndex] = savedEvent;
    } else {
      newEvents.push(savedEvent);
    }
    setEvents(newEvents);
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleModalDelete = async (eventId: string) => {
    console.log('🗑️ Calendar: Deleting event with ID:', eventId);
    console.log('   Current events in state:', events.map(e => ({ id: e.id, title: e.title })));

    try {
      await deleteEvento(eventId);
      console.log('✅ Calendar: Event deleted from database, updating local state');
      setEvents(prev => {
        const filtered = prev.filter(e => e.id !== eventId);
        console.log('   Events after deletion:', filtered.map(e => ({ id: e.id, title: e.title })));
        return filtered;
      });
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('❌ Calendar: Error deleting event:', error);
    }
  };

  const handleNext = () => calendarRef.current?.getApi().next();
  const handlePrev = () => calendarRef.current?.getApi().prev();
  const handleToday = () => calendarRef.current?.getApi().today();
  const handleViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => calendarRef.current?.getApi().changeView(e.target.value);
  const handleDatesSet = (arg: DatesSetArg) => setCalendarTitle(arg.view.title);

  const handleAddNewEventClick = () => {
    setSelectedEvent({ start: new Date().toISOString(), end: new Date().toISOString(), allDay: false });
    setIsModalOpen(true);
  };



  return (
    <div className="page-container calendar-page-container">
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">Calendario</h1>
          <p className="dashboard-subtitle">Organiza tus eventos y tareas.</p>
        </div>
      </div>
      <div className="calendar-layout-container">
        <div className="tasks-container">
          <h2 className="container-title">Tareas Arrastrables</h2>
          <div className="add-task-form">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Nueva tarea..."
              className="add-task-input"
            />
            <button onClick={handleAddTask} className="add-task-btn">
              <Plus size={18} />
              <span>Añadir Tarea</span>
            </button>
          </div>
          <div id="external-events" ref={externalEventsRef} className="task-list">
            {externalEvents.map(task => (
              <div key={task.id} className="task-item">
                <div className="task-checkbox-container">
                  <input
                    type="checkbox"
                    className="task-checkbox"
                    onChange={async (e) => {
                      if (e.target.checked) {
                        try {
                          await toggleTareaCompletada(task.id, true);
                          setExternalEvents(prev => prev.filter(t => t.id !== task.id));

                          // Optional: Toast notification
                          const Toast = (await import('sweetalert2')).default.mixin({
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 3000,
                            timerProgressBar: true,
                          });
                          Toast.fire({
                            icon: 'success',
                            title: 'Tarea completada'
                          });
                        } catch (error) {
                          console.error('Error completing task:', error);
                        }
                      }
                    }}
                  />
                </div>
                <div
                  className="draggable-event"
                  style={{ backgroundColor: task.color }}
                  data-id={task.id}
                  data-title={task.titulo}
                  data-color={task.color}
                >
                  {task.titulo}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="calendar-main-container">
          <div className="calendar-header">
            <div className="header-left">
              <Calendar size={22} />
              <h2>{calendarTitle}</h2>
            </div>
            <div className="header-right">
              <button className="header-btn add-event-btn" onClick={handleAddNewEventClick}><Plus size={16} /> Añadir Evento</button>
              <div className="today-nav">
                <button className="header-btn nav-btn" onClick={handlePrev}><ChevronLeft size={16} /></button>
                <button className="header-btn today-btn" onClick={handleToday}>Hoy</button>
                <button className="header-btn nav-btn" onClick={handleNext}><ChevronRight size={16} /></button>
              </div>
              <select className="header-btn view-switcher" onChange={handleViewChange} defaultValue="dayGridMonth">
                <option value="dayGridMonth">Mes</option>
                <option value="timeGridWeek">Semana</option>
                <option value="timeGridDay">Día</option>
              </select>
            </div>
          </div>
          <div className="calendar-wrapper">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              headerToolbar={false}
              initialView='dayGridMonth'
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              events={events}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventChange={handleEventChange}
              droppable={true}
              eventReceive={handleEventReceive}
              datesSet={handleDatesSet}
              height="100%"
              allDaySlot={false}
              locale='es'
              buttonText={{
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día'
              }}
            />
          </div>
        </div>
      </div>
      <EventModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
        eventData={selectedEvent}
      />
    </div>
  );
};

export default NewCalendar;
