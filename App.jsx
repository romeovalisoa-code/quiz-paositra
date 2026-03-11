import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

import Home from './components/Home';
import Dashboard from './components/Dashboard';
import QuizBuilder from './components/QuizBuilder';
import Player from './components/Player';
import Host from './components/Host';
import Settings from './components/Settings';
import History from './components/History';

// Connect to the backend
const socket = io(window.location.origin);

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [quizzes, setQuizzes] = useState([]);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [isAdminAuth, setIsAdminAuth] = useState(false);

  // Game state
  const [activeQuiz, setActiveQuiz] = useState(null); // Used by Host
  const [joinData, setJoinData] = useState({ pin: '', name: '' }); // Used by Player
  const [adminPassword, setAdminPassword] = useState('admin123'); // Default password

  // Load from Database
  useEffect(() => {
    fetch(`${window.location.origin}/api/quizzes`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setQuizzes(data);
        } else {
          // Add a default sample quiz
          const sampleQuiz = {
            id: '1',
            pin: '123456',
            title: 'Culture Générale & Tech',
            timeLimit: 15,
            questions: [
              { q: 'Quel est le langage principal pour React ?', options: ['Python', 'JavaScript', 'C++', 'Ruby'], correct: 1 },
              { q: 'Que signifie CSS ?', options: ['Cascading Style Sheets', 'Computer Style Symbols', 'Creative Style System', 'Coded Syntax Sheets'], correct: 0 },
            ]
          };
          
          fetch(`${window.location.origin}/api/quizzes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sampleQuiz)
          }).then(() => {
            setQuizzes([sampleQuiz]);
          });
        }
      })
      .catch(err => console.error("Failed to load quizzes:", err));

    // Load Admin Password
    const savedPwd = localStorage.getItem('qruiz_admin_pwd');
    if (savedPwd) {
      setAdminPassword(savedPwd);
    }
  }, []);

  // Navbar component
  const Navbar = () => (
    <nav className="navbar">
      <div className="brand" onClick={() => setCurrentView('home')}>
        <img src="/logo.png" alt="Logo Paositra Finances" className="brand-logo" />
        Quiz <span style={{ fontWeight: 300, opacity: 0.7 }}>Paositra Finances</span>
      </div>
      <div>
        {currentView === 'home' && (
          <button className="btn btn-secondary" onClick={() => {
            if (isAdminAuth) {
              setCurrentView('dashboard');
            } else {
              setCurrentView('admin-login');
            }
          }}>
            Administration Formateur
          </button>
        )}
        {(currentView === 'dashboard' || currentView === 'builder' || currentView === 'settings') && (
          <button className="btn btn-secondary" onClick={() => {
            setIsAdminAuth(false);
            setCurrentView('home');
          }}>
            Déconnexion
          </button>
        )}
      </div>
    </nav>
  );

  const isAdminView = ['dashboard', 'builder', 'settings'].includes(currentView);

  const AdminSidebar = () => (
    <aside className="admin-sidebar glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}>
      <div className="sidebar-menu">
        <div style={{ padding: '0 16px 16px', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
          Menu Formateur
        </div>
        <button className={`sidebar-btn ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
          📊 Vos quiz
        </button>
        <button className={`sidebar-btn ${currentView === 'history' ? 'active' : ''}`} onClick={() => setCurrentView('history')}>
          📜 Historique des sessions
        </button>
        <button className={`sidebar-btn`} onClick={() => alert("Médiathèque (Images) en cours de développement !")}>
          🖼️ Médiathèque
        </button>
        <button className={`sidebar-btn ${currentView === 'settings' ? 'active' : ''}`} onClick={() => setCurrentView('settings')}>
          ⚙️ Paramètres
        </button>
        <hr style={{ border: 'none', borderTop: '1px solid var(--surface-border)', margin: '16px 0' }} />
        <div style={{ padding: '0 16px 16px', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
          Outils & Améliorations
        </div>
        <button className={`sidebar-btn`} onClick={() => alert("Exporter les résultats : Fonctionnalité à venir !")}>
          📄 Export (PDF/Excel)
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {currentView !== 'player' && currentView !== 'host' && <Navbar />}

      <div className={`app-container ${isAdminView ? 'has-sidebar' : ''}`}>
        {isAdminView && <AdminSidebar />}
        <main className="main-content" style={{ padding: (currentView === 'player' || currentView === 'host') ? '0' : '40px' }}>
          {currentView === 'home' && (
          <Home
            socket={socket}
            onJoinSuccess={(pin, name, title) => {
              setJoinData({ pin, name, title });
              setCurrentView('player');
            }}
          />
        )}

        {currentView === 'admin-login' && (
          <div className="animate-slide-up" style={{ maxWidth: '400px', margin: '10vh auto', textAlign: 'center' }}>
            <div className="glass-panel">
              <h2>Accès Formateur</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Veuillez saisir le mot de passe pour continuer.</p>
              <form onSubmit={(e) => {
                e.preventDefault();
                const pwd = e.target.password.value;
                if (pwd === adminPassword) {
                  setIsAdminAuth(true);
                  setCurrentView('dashboard');
                } else {
                  alert("Mot de passe incorrect.");
                }
              }}>
                <input
                  type="password"
                  name="password"
                  className="input-field"
                  placeholder="Mot de passe"
                  style={{ marginBottom: '15px' }}
                />
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Se connecter
                </button>
                <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={() => setCurrentView('home')}>
                  Annuler
                </button>
              </form>
            </div>
          </div>
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            quizzes={quizzes}
            onCreate={() => {
              setEditingQuiz(null);
              setCurrentView('builder');
            }}
            onEdit={(quiz) => {
              setEditingQuiz(quiz);
              setCurrentView('builder');
            }}
            onDelete={(id) => {
              fetch(`${window.location.origin}/api/quizzes/${id}`, { method: 'DELETE' })
                .then(() => setQuizzes(quizzes.filter(q => q.id !== id)))
                .catch(err => console.error("Error deleting:", err));
            }}
            onHost={(quiz) => {
              setActiveQuiz(quiz);
              setCurrentView('host');
            }}
          />
        )}

        {currentView === 'builder' && (
          <QuizBuilder
            initialQuiz={editingQuiz}
            onSave={(newQuiz) => {
              if (!newQuiz.timeLimit) newQuiz.timeLimit = 15;
              
              fetch(`${window.location.origin}/api/quizzes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newQuiz)
              })
              .then(() => {
                if (editingQuiz) {
                  setQuizzes(quizzes.map(q => q.id === newQuiz.id ? newQuiz : q));
                } else {
                  setQuizzes([...quizzes, newQuiz]);
                }
                setCurrentView('dashboard');
              })
              .catch(err => {
                alert("Erreur lors de la sauvegarde dans la base de données.");
                console.error(err);
              });
            }}
            onCancel={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'settings' && (
          <Settings
            currentPassword={adminPassword}
            onChangePassword={(newPwd) => {
              setAdminPassword(newPwd);
              localStorage.setItem('qruiz_admin_pwd', newPwd);
            }}
            onBack={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'history' && (
          <History
            onBack={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'player' && (
          <Player
            socket={socket}
            joinData={joinData}
            onExit={() => setCurrentView('home')}
          />
        )}

        {currentView === 'host' && (
          <Host
            socket={socket}
            quiz={activeQuiz}
            onExit={() => setCurrentView('dashboard')}
          />
        )}
        </main>
      </div>
    </>
  );
}

export default App;
