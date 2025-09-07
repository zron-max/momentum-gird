import React, { useState } from 'react';
// In a real app, you would use a router library like react-router-dom.
// For this standalone example, we'll simulate navigation.
// import { useNavigate } from 'react-router-dom';

// --- HELPER COMPONENTS ---

// Loading spinner for API calls
const LoadingSpinner = () => (
    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// Modal component to display Gemini's response
const Modal = ({ title, content, onClose, isLoading }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in-fast">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 transform animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-gray-100 dark:bg-gray-900 p-4 rounded-lg max-h-[60vh] overflow-y-auto">
                {isLoading ? <div className="flex justify-center items-center h-40"><LoadingSpinner /></div> : <p>{content}</p>}
            </div>
        </div>
    </div>
);


// --- SVG & COMPONENT DEFINITIONS ---

// A more dynamic and modern logo
const Logo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="12" fill="url(#logo-gradient)" />
    <g style={{ transformOrigin: 'center', animation: 'logo-spin 8s linear infinite' }}>
      <rect x="7" y="7" width="11" height="11" rx="3" fill="white" fillOpacity="0.9" />
      <rect x="22" y="7" width="11" height="11" rx="3" fill="white" fillOpacity="0.6" />
      <rect x="7" y="22" width="11" height="11" rx="3" fill="white" fillOpacity="0.6" />
      <rect x="22" y="22" width="11" height="11" rx="3" fill="white" fillOpacity="0.9" />
    </g>
    <defs>
      <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#818cf8" />
      </linearGradient>
    </defs>
  </svg>
);

// --- SVGs for Alternating Features ---

const HabitTrackingSVG = () => (
    <svg width="400" height="200" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl">
        <rect x="20" y="30" width="360" height="140" rx="16" fill="url(#habit-bg)" />
        <g>
            {[...Array(5)].map((_, row) => [...Array(10)].map((_, col) => (
                <rect key={`${row}-${col}`} x={40 + col * 32} y={50 + row * 20} width="24" height="12" rx="3" fill="#fff" opacity="0.2" />
            )))}
            <rect x={40} y={90} width="24" height="12" rx="3" fill="#34d399" />
            <rect x={72} y={90} width="24" height="12" rx="3" fill="#34d399" />
            <rect x={104} y={90} width="24" height="12" rx="3" fill="#34d399" />
            <rect x={136} y={90} width="24" height="12" rx="3" fill="#fff" opacity="0.2" />
            <rect x={168} y={90} width="24" height="12" rx="3" fill="#34d399" />
        </g>
        <polyline points="60,150 110,130 160,140 210,120 260,125 310,110 360,115" fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" />
        <defs><linearGradient id="habit-bg" x1="20" y1="30" x2="380" y2="170" gradientUnits="userSpaceOnUse"><stop stopColor="#a5b4fc" /><stop offset="1" stopColor="#6ee7b7" /></linearGradient></defs>
    </svg>
);

const ProjectManagementSVG = () => (
    <svg width="400" height="160" viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl">
        <rect x="20" y="20" width="360" height="120" rx="16" fill="url(#proj-bg)" />
        <rect x="40" y="40" width="80" height="16" rx="8" fill="#fff" opacity=".9" />
        <rect x="40" y="68" width="120" height="8" rx="4" fill="#fff" opacity=".7" />
        <rect x="40" y="84" width="100" height="8" rx="4" fill="#fff" opacity=".7" />
        <rect x="220" y="40" width="140" height="80" rx="8" fill="#fff" opacity=".1" />
        <rect x="236" y="56" width="108" height="10" rx="5" fill="#fff" opacity=".8" />
        <rect x="236" y="74" width="80" height="10" rx="5" fill="#6ee7b7" />
        <defs><linearGradient id="proj-bg" x1="20" y1="20" x2="380" y2="140" gradientUnits="userSpaceOnUse"><stop stopColor="#f472b6" /><stop offset="1" stopColor="#818cf8" /></linearGradient></defs>
    </svg>
);

const LearningGoalSVG = () => (
    <svg width="400" height="200" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl">
        <rect x="20" y="30" width="360" height="140" rx="16" fill="url(#learn-bg)" />
        <path d="M80 140 C 100 150, 280 150, 300 140 L 320 50 L 60 50 Z" fill="#fff" opacity="0.2" transform="rotate(-5 190 95)" />
        <rect x="100" y="60" width="200" height="10" rx="5" fill="#fff" opacity="0.5" />
        <rect x="100" y="80" width="150" height="10" rx="5" fill="#fff" opacity="0.5" />
        <rect x="100" y="100" width="180" height="10" rx="5" fill="#fff" opacity="0.5" />
        <rect x="100" y="120" width="120" height="10" rx="5" fill="#0ea5e9" />
        <defs><linearGradient id="learn-bg" x1="20" y1="30" x2="380" y2="170" gradientUnits="userSpaceOnUse"><stop stopColor="#38bdf8" /><stop offset="1" stopColor="#34d399" /></linearGradient></defs>
    </svg>
);

const TimeBlockingSVG = () => (
    <svg width="400" height="180" viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl">
        <rect x="20" y="20" width="360" height="140" rx="16" fill="url(#time-bg)" />
        <rect x="40" y="40" width="320" height="40" rx="8" fill="#fff" opacity="0.1" />
        <text x="50" y="65" fill="white" fontSize="14" fontWeight="bold">09:00 - 11:00 Deep Work</text>
        <rect x="40" y="90" width="150" height="50" rx="8" fill="#fff" opacity="0.1" />
        <text x="50" y="118" fill="white" fontSize="14" fontWeight="bold">12:00 Lunch</text>
        <rect x="210" y="90" width="150" height="50" rx="8" fill="#fff" opacity="0.1" />
        <text x="220" y="118" fill="white" fontSize="14" fontWeight="bold">14:00 Meeting</text>
        <defs><linearGradient id="time-bg" x1="20" y1="20" x2="380" y2="160" gradientUnits="userSpaceOnUse"><stop stopColor="#c084fc" /><stop offset="1" stopColor="#f87171" /></linearGradient></defs>
    </svg>
);


// --- MAIN PAGE COMPONENT ---

const HomePage = () => {
  // const navigate = useNavigate(); // Use this in a real React Router app
  const [modalState, setModalState] = useState({ isOpen: false, title: '', content: '', prompt: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');

  const callGeminiAPI = async (prompt) => {
      setIsLoading(true);
      setModalState(prev => ({ ...prev, content: '' })); 

      const apiKey = ""; // API key will be injected by the environment
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      
      const payload = {
          contents: [{ role: "user", parts: [{ text: prompt }] }]
      };

      try {
          const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (!response.ok) {
              let userFriendlyMessage = `An error occurred. Status: ${response.status}`;
              if (response.status === 403) {
                  userFriendlyMessage = "Authentication Error (403 Forbidden).\n\nThis usually means there's an issue with the API key.\n\nPlease check the following:\n1. Ensure your Gemini API key is correct and active.\n2. Make sure the Generative Language API is enabled in your Google Cloud project.\n3. Verify that your project has billing enabled.\n4. Check for any API key restrictions (like HTTP referrers) that might be blocking this request.";
              } else {
                  try {
                      const errorBody = await response.json();
                      const message = errorBody?.error?.message || JSON.stringify(errorBody);
                      userFriendlyMessage += `\nDetails: ${message}`;
                  } catch (e) {
                      userFriendlyMessage += `\nCould not parse error response.`;
                  }
              }
              throw new Error(userFriendlyMessage);
          }

          const result = await response.json();
          
          if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
              const text = result.candidates[0].content.parts[0].text;
              setModalState(prev => ({ ...prev, content: text }));
          } else {
              const finishReason = result.candidates?.[0]?.finishReason;
              let message = "Sorry, I couldn't generate a response. Please try again.";
              if (finishReason === 'SAFETY') {
                  message = "The response was blocked due to safety settings. Please adjust your prompt and try again.";
              } else if (finishReason) {
                  message = `The request finished for an unexpected reason: ${finishReason}. Please try again.`;
              }
              setModalState(prev => ({ ...prev, content: message }));
          }
      } catch (error) {
          console.error("Gemini API call error:", error);
          setModalState(prev => ({ ...prev, content: error.message }));
      } finally {
          setIsLoading(false);
      }
  };
  
  // This function is kept for potential future use but is not currently triggered by any UI element.
  const handleAIFeatureClick = (type) => {
      let title = '';
      let promptGenerator = (input) => input;

      if (type === 'recipe') {
          title = '✨ AI Recipe Generator';
          promptGenerator = (input) => `Generate a creative recipe based on the following ingredients: ${input}. Provide a catchy name for the recipe, a short description, a list of ingredients, and step-by-step instructions.`;
      } else if (type === 'learning') {
          title = '✨ AI Learning Planner';
          promptGenerator = (input) => `I want to learn "${input}". Break this down into a structured, step-by-step learning plan. Include key topics, suggested resources (like books, online courses, or projects), and a logical progression from beginner to advanced.`;
      } else if (type === 'schedule') {
          title = '✨ AI Day Planner';
          promptGenerator = (input) => `Generate a time-blocked daily schedule for me. My main tasks for today are: ${input}. Be sure to include breaks, and organize the tasks logically (e.g., deep work in the morning). Present it in a clear, easy-to-read format.`;
      }

      setModalState({ isOpen: true, title, content: '', prompt: promptGenerator, type });
  };

  const handleModalSubmit = () => {
      if (userInput && typeof modalState.prompt === 'function') {
          const fullPrompt = modalState.prompt(userInput);
          callGeminiAPI(fullPrompt);
      }
  };

  const closeModal = () => {
      setModalState({ isOpen: false, title: '', content: '', prompt: '', type: '' });
      setUserInput('');
      setIsLoading(false);
  };
  
  // Expanded feature data
  const alternatingFeatures = [
    {
      title: 'Habit Tracking',
      desc: 'Build daily routines, track your streaks, and visualize your progress with beautiful charts.',
      points: [ 'Customizable habit categories', 'Daily, weekly, or monthly tracking', 'Progress streaks and reminders' ],
      svg: <HabitTrackingSVG />,
      direction: 'ltr',
    },
    {
      title: 'Project Management',
      desc: 'Organize your projects and milestones visually. Stay on top of deadlines and collaborate with ease.',
      points: [ 'Milestone tracking', 'Color-coded project status', 'Visual dashboard overview' ],
      svg: <ProjectManagementSVG />,
      direction: 'rtl',
    },
    {
      title: 'Learning Goals',
      desc: 'Set and track your learning objectives, from reading books to completing courses. Visualize your educational journey.',
      points: [ 'Track progress by pages or modules', 'Set deadlines and reminders', 'Organize resources and notes' ],
      svg: <LearningGoalSVG />,
      direction: 'ltr',
    },
    {
      title: 'Time Blocking',
      desc: 'Plan your day with intention. Allocate specific blocks of time to your most important tasks and goals.',
      points: [ 'Create focused work sessions', 'Schedule breaks and personal time', 'Visualize your daily schedule' ],
      svg: <TimeBlockingSVG />,
      direction: 'rtl',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col items-center font-sans">
      
      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 md:px-10 py-4 absolute top-0 left-0 z-20">
        <div className="flex items-center space-x-3">
          <Logo />
          <span className="text-xl font-bold text-gray-900 dark:text-white">MomentumGrid</span>
        </div>
        <button
          className="px-5 py-2 rounded-lg bg-gray-800 text-white font-semibold text-sm shadow-md hover:bg-gray-950 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          onClick={() => { window.location.href = '/auth'; }}
        >
          Get Started
        </button>
      </header>

      {/* NEW Hero/Feature Section (from screenshot) */}
      <section className="w-full max-w-5xl mx-auto px-4 pt-40 pb-16 flex flex-col items-center text-center animate-fade-in">
        <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-500 via-pink-400 to-emerald-400 bg-clip-text text-transparent mb-4">
          Transform Your Day, One Habit at a Time
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          The ultimate productivity platform to help you build routines, achieve your goals, and become the best version of yourself.
        </p>
        {/* Build Momentum Button */}
        <button
          className="px-12 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out transform mb-8"
          onClick={() => { window.location.href = '/auth'; }}
        >
          Build Momentum
        </button>
      </section>

      {/* Restored Two-Column Feature Section */}
      <section className="w-full max-w-6xl mx-auto px-4 pt-32 pb-16 flex flex-col md:flex-row items-center gap-12 md:gap-24">
        {/* Left: Calendar Mockup with Habits and Routines */}
        <div className="flex-1 flex flex-col items-center md:items-start relative mb-8 md:mb-0">
          {/* Habits Checklist (top-left) */}
          <div className="absolute -top-8 -left-4 z-10 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700 w-56">
            <div className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Habits</div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-green-600 font-medium line-through">
                <input type="checkbox" checked readOnly className="accent-green-500 w-5 h-5 rounded" />
                Make bed
              </label>
              <label className="flex items-center gap-2 text-blue-600 font-medium line-through">
                <input type="checkbox" checked readOnly className="accent-blue-500 w-5 h-5 rounded" />
                Drink water
              </label>
              <label className="flex items-center gap-2 text-purple-600 font-medium">
                <input type="checkbox" readOnly className="accent-purple-500 w-5 h-5 rounded" />
                Meditate
              </label>
              <label className="flex items-center gap-2 text-gray-500 font-medium">
                <input type="checkbox" readOnly className="accent-gray-400 w-5 h-5 rounded" />
                Review daily goals
              </label>
            </div>
          </div>
          {/* Calendar Mockup */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 pt-20 pb-16 flex flex-col items-center border border-gray-200 dark:border-gray-700 w-full max-w-md relative">
            <div className="font-bold text-lg text-gray-800 dark:text-white mb-2">July 2025</div>
            <table className="w-full text-center text-xs text-gray-700 dark:text-gray-300 mb-2 select-none">
              <thead>
                <tr className="text-gray-400 dark:text-gray-500">
                  <th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th><th>Sun</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, row) => (
                  <tr key={row}>
                    {[...Array(7)].map((_, col) => {
                      const day = row * 7 + col - 0 + 1; // July 2025 starts on a Tuesday
                      const isHabitDay = [2, 3, 8, 9, 10, 15, 17, 18, 22, 23, 24, 29, 30].includes(day);
                      const isToday = day === 10;
                      return (
                        <td key={col} className={`py-1 px-2 rounded-lg ${isToday ? 'bg-blue-100 dark:bg-blue-900 font-bold' : ''} ${isHabitDay ? 'text-green-600 font-bold' : ''}`}>{(row === 0 && col === 0) ? '' : (day > 31 ? '' : day)}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Routines Card (bottom-right) */}
            <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-orange-200 dark:border-orange-700 px-4 py-3 w-56">
              <div className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Your Routines</div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 text-sm">
                  <span className="w-2 h-2 rounded-full bg-orange-400 inline-block"></span>
                  Morning Routine
                  <span className="ml-auto text-xs text-orange-400">4 tasks</span>
                </div>
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
                  Evening Wind-down
                  <span className="ml-auto text-xs text-red-400">4 tasks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Right: Track Progress Text Block */}
        <div className="flex-1 flex flex-col items-start justify-center max-w-md w-full mt-12 md:mt-0">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Track progress</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            Build habits, track your goals, and organize your life with Momentum Grid.<br />
            Visualize your progress, stay motivated, and craft your ideal day—habit by habit.
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
            <li>Beautiful calendar and habit tracking</li>
            <li>Custom routines and daily checklists</li>
            <li>All-in-one dashboard for your goals</li>
          </ul>
        </div>
      </section>

      {/* NEW Alternating Features Section */}
      <section className="w-full max-w-6xl mx-auto px-4 py-16 flex flex-col gap-24">
        {alternatingFeatures.map((feature, index) => (
          <div
            key={feature.title}
            className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${feature.direction === 'rtl' ? 'md:flex-row-reverse' : ''} animate-fade-in-up`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* SVG Illustration */}
            <div className="flex-1 flex justify-center items-center">
              {feature.svg}
            </div>
            {/* Text Content */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
                {feature.title}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                {feature.desc}
              </p>
              <ul className="space-y-2">
                {feature.points.map((point) => (
                  <li key={point} className="flex items-center justify-center md:justify-start">
                    <svg className="w-5 h-5 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    <span className="text-gray-700 dark:text-gray-300">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>
      
      {/* Modal for AI interaction (kept in code, but no longer triggered from UI) */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in-fast" onClick={closeModal}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl w-full mx-4 transform animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{modalState.title}</h2>
                    <button onClick={closeModal} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                {isLoading ? (
                    <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>
                ) : modalState.content ? (
                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-100 dark:bg-gray-900 p-4 rounded-lg max-h-[60vh] overflow-y-auto">
                        <p>{modalState.content}</p>
                    </div>
                ) : (
                    <div>
                        <textarea
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            className="w-full h-28 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder={
                                modalState.type === 'recipe' ? "e.g., chicken breast, rice, broccoli, soy sauce" :
                                modalState.type === 'learning' ? "e.g., Learn Python for Data Science" :
                                "e.g., Finish report, Team meeting at 2pm, Workout"
                            }
                        />
                        <button onClick={handleModalSubmit} disabled={!userInput} className="mt-4 w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                            Generate
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Global Styles & Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.390, 0.575, 0.565, 1.000) both; }
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-fast { animation: fade-in-fast 0.3s ease both; }
        @keyframes fade-in-fast { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes logo-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default HomePage;
