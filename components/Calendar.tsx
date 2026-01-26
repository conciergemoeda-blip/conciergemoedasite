import React, { useState } from 'react';

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface CalendarProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onDateSelect: (date: Date) => void;
  className?: string;
  mini?: boolean;
}

export const Calendar: React.FC<CalendarProps> = ({ checkIn, checkOut, onDateSelect, className = "", mini = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const today = new Date();
  today.setHours(0,0,0,0);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Prevent going back to past months
  const isPrevDisabled = year === today.getFullYear() && month === today.getMonth();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPrevDisabled) {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(year, month, day);
    return date < today;
  };

  const getDateStatus = (day: number) => {
    const date = new Date(year, month, day);
    date.setHours(0,0,0,0);
    
    if (isDateDisabled(day)) return 'disabled';

    const checkInTime = checkIn ? new Date(checkIn).setHours(0,0,0,0) : null;
    const checkOutTime = checkOut ? new Date(checkOut).setHours(0,0,0,0) : null;
    const hoverTime = hoverDate ? hoverDate.getTime() : null;
    const dateTime = date.getTime();

    if (dateTime === checkInTime || dateTime === checkOutTime) return 'selected';
    
    // Existing range
    if (checkInTime && checkOutTime && dateTime > checkInTime && dateTime < checkOutTime) return 'in-range';
    
    // Hover preview range (only if we have checkIn but no checkOut)
    if (checkInTime && !checkOutTime && hoverTime && dateTime > checkInTime && dateTime <= hoverTime) return 'preview-range';
    
    return 'available';
  };

  const days = [];
  // Empty slots for days before the 1st
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className={mini ? "h-8 w-8" : "h-10 w-10"} />);
  }

  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const status = getDateStatus(d);
    let baseSize = mini ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
    let className = `${baseSize} flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer relative z-10 font-bold `;
    
    if (status === 'disabled') {
      className += "text-gray-300 cursor-not-allowed font-normal";
    } else if (status === 'selected') {
      className += "bg-black text-white shadow-md transform scale-105"; // Airbnb style: black selected
    } else if (status === 'in-range') {
      // Changed from gray-100 to primary/10 for better visual feedback
      className = `${mini ? "h-8" : "h-10"} w-full flex items-center justify-center ${mini ? "text-xs" : "text-sm"} bg-primary/10 text-primary-dark font-medium rounded-none`; 
    } else if (status === 'preview-range') {
      className = `${mini ? "h-8" : "h-10"} w-full flex items-center justify-center ${mini ? "text-xs" : "text-sm"} bg-gray-50 text-gray-900 font-medium rounded-none`; 
    } else {
      className += "text-gray-700 hover:border hover:border-black hover:bg-white"; // Airbnb style: hollow hover
    }

    // Connectors for range edges
    const dateTimestamp = new Date(year, month, d).setHours(0,0,0,0);
    const checkInTime = checkIn ? new Date(checkIn).setHours(0,0,0,0) : null;
    const checkOutTime = checkOut ? new Date(checkOut).setHours(0,0,0,0) : null;
    
    const isCheckIn = dateTimestamp === checkInTime;
    const isCheckOut = dateTimestamp === checkOutTime;
    
    // Determine if we should show a connector background for visual continuity
    const showRightConnector = (isCheckIn && (checkOutTime || (status === 'selected' && hoverDate && hoverDate.getTime() > dateTimestamp)));
    const showLeftConnector = isCheckOut;

    // Determine connector color - match the 'in-range' style (primary/10)
    const connectorColor = checkOutTime ? 'bg-primary/10' : 'bg-gray-50';

    days.push(
      <div 
        key={d} 
        className="flex justify-center items-center w-full aspect-square relative"
        onMouseEnter={() => !isDateDisabled(d) && setHoverDate(new Date(year, month, d))}
        onMouseLeave={() => setHoverDate(null)}
      >
          {/* Visual Connectors */}
          {showRightConnector && <div className={`absolute right-0 top-0 bottom-0 w-1/2 -z-0 ${connectorColor}`} />}
          {showLeftConnector && <div className={`absolute left-0 top-0 bottom-0 w-1/2 -z-0 bg-primary/10`} />}
          
          <button 
            onClick={(e) => { e.stopPropagation(); !isDateDisabled(d) && onDateSelect(new Date(year, month, d)); }}
            disabled={status === 'disabled'}
            className={className}
          >
            {d}
          </button>
      </div>
    );
  }

  return (
    <div className={`bg-white select-none ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <button 
            onClick={handlePrevMonth} 
            disabled={isPrevDisabled}
            className={`p-1.5 rounded-full transition-colors ${isPrevDisabled ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-900'}`}
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        <span className="font-serif font-bold text-lg text-gray-900 capitalize">
          {MONTH_NAMES[month]} {year}
        </span>
        <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-900">
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {days}
      </div>
    </div>
  );
};