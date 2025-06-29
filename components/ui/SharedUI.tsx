import React, { useState, useEffect } from 'react';
import { getDaysInMonth, getFirstDayOfMonth, formatDateISO, areDatesEqual } from '../../utils/dateUtils';
import { IconChevronLeft, IconChevronRight, IconHelpCircle } from './Icons';

// --- HELLO PANEL & TOUR ---
interface HelloPanelProps {
    userName: string;
    onStartTour: () => void;
}
export const HelloPanel: React.FC<HelloPanelProps> = ({ userName, onStartTour }) => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="relative bg-primary-500/10 dark:bg-primary-500/20 text-primary-800 dark:text-primary-200 p-4 rounded-lg mb-6 flex items-center justify-between">
            <div>
                <h2 className="font-bold text-lg">Welcome back, {userName}!</h2>
                <p className="text-sm">Ready to build some momentum?</p>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="secondary" onClick={onStartTour} className="!py-1 !px-3">
                    <IconHelpCircle className="w-5 h-5 mr-2" />
                    Take a Tour
                </Button>
                <button onClick={() => setIsVisible(false)} className="absolute top-2 right-2 p-1 rounded-full hover:bg-primary-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>
    );
};

const tourSteps = [
    { title: "Welcome to Momentum Grid!", content: "This quick tour will walk you through the key features of the app." },
    { title: "Navigation Sidebar", content: "On the left is your main navigation. Switch between different trackers like Habits, Routines, and more." },
    { title: "The Calendar View", content: "The main area shows a calendar. This gives you a bird's-eye view of your activity for the selected tracker." },
    { title: "Daily Log", content: "Below the calendar, you can log your activity for the selected day. Just check the box or fill in the details." },
    { title: "Adding New Items", content: "Use the plus (+) button in the top-left panel to add new habits, routines, or other items to track." },
    { title: "You're All Set!", content: "That's all you need to know to get started. Enjoy building momentum!" },
];

export const TourModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setStep(0);
        }
    }, [isOpen]);

    const handleNext = () => setStep(prev => Math.min(prev + 1, tourSteps.length - 1));
    const handleBack = () => setStep(prev => Math.max(prev - 1, 0));
    
    const isLastStep = step === tourSteps.length - 1;

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Quick Tour (${step + 1}/${tourSteps.length})`}
            footer={<>
                <Button variant="secondary" onClick={handleBack} disabled={step === 0}>Back</Button>
                {isLastStep ? (
                    <Button onClick={onClose}>Finish</Button>
                ) : (
                    <Button onClick={handleNext}>Next</Button>
                )}
            </>}
        >
            <div className="text-center p-4">
                <h3 className="text-xl font-bold mb-4 text-text-light dark:text-text-dark">{tourSteps[step].title}</h3>
                <p className="text-text-muted-light dark:text-text-muted-dark">{tourSteps[step].content}</p>
            </div>
        </Modal>
    );
};


// --- MODAL ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-xl font-semibold text-text-light dark:text-text-dark">{title}</h2>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="p-4 bg-bkg-light dark:bg-bkg-dark/50 rounded-b-lg flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

// --- CALENDAR ---
interface CalendarViewProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  renderDayContent: (date: Date) => React.ReactNode;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ selectedDate, setSelectedDate, renderDayContent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4 bg-card-light dark:bg-card-dark rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-bkg-light dark:hover:bg-bkg-dark">
          <IconChevronLeft className="w-6 h-6 text-text-muted-light dark:text-text-muted-dark" />
        </button>
        <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-bkg-light dark:hover:bg-bkg-dark">
          <IconChevronRight className="w-6 h-6 text-text-muted-light dark:text-text-muted-dark" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map(day => (
          <div key={day} className="font-medium text-text-muted-light dark:text-text-muted-dark text-sm">{day}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
        {daysInMonth.map(day => {
          const isSelected = areDatesEqual(day, selectedDate);
          const isToday = areDatesEqual(day, new Date());
          return (
            <div
              key={formatDateISO(day)}
              onClick={() => setSelectedDate(day)}
              className={`relative cursor-pointer w-full aspect-square flex flex-col justify-center items-center rounded-lg transition-colors 
                ${isSelected ? 'bg-primary-500 text-white' : 'hover:bg-bkg-light dark:hover:bg-bkg-dark'}`}
            >
              <span className={`absolute top-1 right-1 text-xs ${isToday ? 'bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center' : ''} ${isSelected && isToday ? 'bg-white text-red-500' : ''}`}>
                {day.getDate()}
              </span>
              <div className="w-full h-full flex items-center justify-center">{renderDayContent(day)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// --- FORM ELEMENTS ---
export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {variant?: 'primary' | 'secondary' | 'danger'}>
  (({ className, variant = 'primary', ...props }, ref) => {
    const baseClasses = "px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };
    return <button ref={ref} className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props} />;
});

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
export const Input: React.FC<InputProps> = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-1">{label}</label>
    <input id={id} className="w-full px-3 py-2 bg-bkg-light dark:bg-bkg-dark border border-border-light dark:border-border-dark rounded-md focus:ring-primary-500 focus:border-primary-500 text-text-light dark:text-text-dark" {...props} />
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}
export const Select: React.FC<SelectProps> = ({ label, id, children, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-1">{label}</label>
    <select id={id} className="w-full px-3 py-2 bg-bkg-light dark:bg-bkg-dark border border-border-light dark:border-border-dark rounded-md focus:ring-primary-500 focus:border-primary-500 text-text-light dark:text-text-dark" {...props}>
        {children}
    </select>
  </div>
);

// --- FEEDBACK MODAL ---
interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedbackText: string) => Promise<void>;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) return;
        setIsSubmitting(true);
        try {
            await onSubmit(content);
            setContent('');
            onClose();
        } catch (error) {
            console.error("Feedback submission failed:", error);
            // Optionally show an error to the user
        } finally {
            setIsSubmitting(false);
        }
    };
    
    useEffect(() => {
        if (!isOpen) {
            setContent('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Share Your Feedback"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
                        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <p className="text-text-muted-light dark:text-text-muted-dark">
                    We'd love to hear your thoughts! What's working well? What could be better?
                </p>
                <textarea
                    id="feedback-content"
                    rows={5}
                    className="w-full px-3 py-2 bg-bkg-light dark:bg-bkg-dark border border-border-light dark:border-border-dark rounded-md focus:ring-primary-500 focus:border-primary-500 text-text-light dark:text-text-dark"
                    placeholder="Describe your experience, suggest improvements, or report issues..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            </div>
        </Modal>
    );
};