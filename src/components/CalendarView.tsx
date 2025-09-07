
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  status?: 'complete' | 'incomplete' | 'partial';
  data?: any;
}

interface CalendarViewProps {
  onDayClick?: (date: Date) => void;
  getDayStatus?: (date: Date) => 'complete' | 'incomplete' | 'partial' | undefined;
  getDayData?: (date: Date) => any;
  statusColors?: {
    complete: string;
    incomplete: string;
    partial: string;
  };
}

const CalendarView = ({ 
  onDayClick, 
  getDayStatus, 
  getDayData,
  statusColors = {
    complete: 'bg-green-500',
    incomplete: 'bg-red-500',
    partial: 'bg-yellow-500'
  }
}: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const status = getDayStatus ? getDayStatus(date) : undefined;
      const data = getDayData ? getDayData(date) : undefined;
      
      days.push({
        date,
        isCurrentMonth,
        isToday,
        status,
        data
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const calendarDays = getCalendarDays();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
      </div>

      {/* Day Names Header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => (
          <button
            key={index}
            onClick={() => onDayClick && onDayClick(day.date)}
            className={`
              relative h-12 rounded-lg transition-all duration-200 hover:scale-105
              ${day.isCurrentMonth 
                ? 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800' 
                : 'text-gray-400 dark:text-gray-600'
              }
              ${day.isToday 
                ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900' 
                : ''
              }
            `}
          >
            <span className="text-sm font-medium">
              {day.date.getDate()}
            </span>
            
            {/* Status Indicator */}
            {day.status && (
              <div className={`
                absolute bottom-1 left-1/2 transform -translate-x-1/2
                w-2 h-2 rounded-full
                ${statusColors[day.status]}
              `} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
