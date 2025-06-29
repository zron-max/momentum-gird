
export const formatDateISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getDaysInMonth = (year: number, month: number): Date[] => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

export const areDatesEqual = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

export const getDateForDayOfWeek = (day: number, startOfWeek: 0 | 1 = 1): Date => { // 0=Sun, 1=Mon...
    const today = new Date();
    let currentDay = today.getDay(); // 0=Sun, 1=Mon...

    if (startOfWeek === 1) { // If week starts on Monday
        currentDay = (currentDay === 0) ? 6 : currentDay - 1; // Mon=0, Sun=6
    }
    const targetDay = (startOfWeek === 1 && day === 0) ? 6 : day - startOfWeek; // Adjust target day based on week start
    
    const distance = targetDay - currentDay;
    const resultDate = new Date(today);
    resultDate.setDate(today.getDate() + distance);
    return resultDate;
};