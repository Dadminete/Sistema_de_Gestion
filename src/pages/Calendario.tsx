import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { getEventos, createEvento, updateEvento, deleteEvento, type Evento } from '@/services/eventService';
import { getTareas, createTarea, deleteTarea, type Tarea } from '@/services/taskService';
import { useAuth } from '@/context/AuthProvider';
import type { EventInput, DateSelectArg, EventClickArg, EventChangeArg } from '@fullcalendar/core';
import type { EventReceiveArg } from '@fullcalendar/interaction';
import EventModal from '@/components/modals/EventModal';
import Button from '@/components/ui/Button'; // Import Button component
import Swal from 'sweetalert2';
import '@/styles/Calendar.css';
import '@/styles/custom/calendario-custom.css'; // Importar estilos personalizados

const Calendario: React.FC = () => {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [externalEvents, setExternalEvents] = useState<Tarea[]>([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null);
  const { user } = useAuth();
  const externalEventsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalEventsRef.current) {
      new Draggable(externalEventsRef.current, {
        itemSelector: '.draggable-event',
        eventData: function(eventEl) {
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
        const [fetchedTasks, fetchedEvents] = await Promise.all([
          getTareas(user.id),
          getEventos(),
        ]);
        setExternalEvents(fetchedTasks);
        const formattedEvents = fetchedEvents.map(event => ({
          id: event.id,
          title: event.titulo,
          start: event.fechaInicio,
          end: event.fechaFin,
          allDay: event.todoElDia,
          color: event.color,
          extendedProps: { description: event.descripcion, location: event.ubicacion }
        }));
        setEvents(formattedEvents);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, [user]);

  const handleAddTask = async () => {
    if (newEventTitle.trim() === '' || !user) return;
    try {
      const newTareaData = { titulo: newEventTitle, color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`, creadoPorId: user.id };
      const createdTask = await createTarea(newTareaData);
      setExternalEvents([...externalEvents, createdTask]);
      setNewEventTitle('');
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleEventReceive = async (info: EventReceiveArg) => {
    if (!user) return;
    const { id, title, start, end, allDay, backgroundColor } = info.event;
    try {
      const newEventData = { titulo: title, fechaInicio: start?.toISOString() || new Date().toISOString(), fechaFin: end?.toISOString() || start?.toISOString() || new Date().toISOString(), todoElDia: allDay, color: backgroundColor, creadoPorId: user.id };
      const newDbEvent = await createEvento(newEventData as Omit<Evento, 'id'>);
      setEvents(prev => [...prev.filter(e => e.id !== id), { id: newDbEvent.id, title: newDbEvent.titulo, start: newDbEvent.fechaInicio, end: newDbEvent.fechaFin, allDay: newDbEvent.todoElDia, color: newDbEvent.color, extendedProps: { description: newDbEvent.descripcion, location: newDbEvent.ubicacion } }]);
      // Note: We don't delete the task here anymore since the user should manage tasks separately
      // The task remains in the external events list for potential reuse
      console.log('✅ Event creation completed, task remains available for reuse');
    } catch (error) {
      console.error('Error creating event from drop:', error);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedEvent({ start: selectInfo.startStr, end: selectInfo.endStr, allDay: selectInfo.allDay });
    setIsModalOpen(true);
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.startStr,
      end: clickInfo.event.endStr,
      allDay: clickInfo.event.allDay,
      color: clickInfo.event.backgroundColor,
      extendedProps: clickInfo.event.extendedProps
    });
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
    try {
      await deleteEvento(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-white min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/4 w-full bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Tareas Arrastrables</h2>
          <div className="space-y-2 mb-4">
            <input 
              type="text" 
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="Nueva tarea..."
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white"
            />
            <Button
              onClick={handleAddTask}
              className="primary custom-add-task w-full" // Apply primary style, custom shadow, and full width
            >
              Añadir Tarea
            </Button>
          </div>
          <div id="external-events" ref={externalEventsRef} className="h-96 overflow-y-auto pr-2">
            {externalEvents.map(task => (
              <div
                key={task.id}
                className="draggable-event p-3 mb-2 rounded-lg cursor-move text-white font-semibold shadow-md flex justify-between items-center" // Added flex for alignment
                style={{ backgroundColor: task.color }}
                data-id={task.id}
                data-title={task.titulo}
                data-color={task.color}
              >
                {task.titulo}
                <button 
                  className="action-btn delete-btn" // Styling from Users.tsx
                  onClick={async (e) => {
                    e.stopPropagation(); // Prevent dragging when deleting
                    const result = await Swal.fire({
                      title: '¿Estás seguro?',
                      text: '¿Está seguro de que desea eliminar esta tarea?',
                      icon: 'warning',
                      showCancelButton: true,
                      confirmButtonColor: '#d33',
                      cancelButtonColor: '#3085d6',
                      confirmButtonText: 'Sí, eliminar',
                      cancelButtonText: 'Cancelar'
                    });

                    if (result.isConfirmed) {
                      try {
                        await deleteTarea(task.id);
                        setExternalEvents(prev => prev.filter(t => t.id !== task.id));
                      } catch (error) {
                        console.error('Error deleting task:', error);
                      }
                    }
                  }}
                  title="Eliminar Tarea"
                >
                  <span className="material-icons">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:w-3/4 w-full">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">CALENDARIO</h2>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,dayGridDay'
              }}
              buttonText={{
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día'
              }}
              locale='es'
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

export default Calendario;
