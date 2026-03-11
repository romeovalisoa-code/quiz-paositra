import React, { useState, useEffect } from 'react';

const Host = ({ socket, quiz, onExit }) => {
    const [players, setPlayers] = useState([]);
    const [gameState, setGameState] = useState('lobby'); // lobby, question, leaderboard, end
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answersCount, setAnswersCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(quiz.timeLimit || 15);
    const [timerId, setTimerId] = useState(null);

    // Stats for the current round
    const [roundStats, setRoundStats] = useState(null);
    const [correctIndex, setCorrectIndex] = useState(null);

    useEffect(() => {
        // Initiate room creation
        socket.emit('host-join', quiz);

        socket.on('update-players', (updatedPlayers) => {
            setPlayers(updatedPlayers);
        });

        socket.on('player-answered', (data) => {
            setAnswersCount(data.answersCount);
        });

        socket.on('round-over', (data) => {
            setGameState('leaderboard');
            setCorrectIndex(data.correctIndex);
            setRoundStats(data.stats);
            if (timerId) clearInterval(timerId);
        });

        socket.on('update-scores', (scoredPlayers) => {
            setPlayers(scoredPlayers);
        });

        socket.on('game-over', (finalPlayers) => {
            setPlayers(finalPlayers);
            setGameState('end');
            if (timerId) clearInterval(timerId);
        });

        return () => {
            socket.off('update-players');
            socket.off('player-answered');
            socket.off('round-over');
            socket.off('update-scores');
            socket.off('game-over');
            if (timerId) clearInterval(timerId);
        };
    }, [quiz]);

    // Handle local Host Timer
    useEffect(() => {
        if (gameState === 'question' && timeLeft > 0) {
            const id = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            setTimerId(id);
            return () => clearTimeout(id);
        } else if (gameState === 'question' && timeLeft === 0) {
            // Tell backend time is up
            socket.emit('time-up', quiz.pin);
            setGameState('leaderboard');
        }
    }, [gameState, timeLeft]);

    const startGame = () => {
        socket.emit('start-game', quiz.pin);
        setGameState('question');
        setCurrentQuestion(0);
        setAnswersCount(0);
        setTimeLeft(quiz.timeLimit || 15);
    };

    const nextQuestion = () => {
        socket.emit('next-question', quiz.pin);
        setGameState('question');
        setCurrentQuestion(currentQuestion + 1);
        setAnswersCount(0);
        setTimeLeft(quiz.timeLimit || 15);
    };

    if (gameState === 'lobby') {
        return (
            <div className="host-container animate-slide-up" style={{ textAlign: 'center', paddingTop: '10vh' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>{quiz.title}</h1>
                <div className="glass-panel" style={{ display: 'inline-block', marginBottom: '40px', padding: '40px 80px' }}>
                    <p style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>Rejoignez avec le code PIN :</p>
                    <div className="gradient-text" style={{ fontSize: '6rem', fontWeight: '800', letterSpacing: '8px' }}>
                        {quiz.pin}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
                    <div style={{ fontSize: '1.5rem' }}>
                        👥 <strong>{players.length}</strong> Joueur(s) dans le salon
                    </div>
                    <button className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.25rem' }} onClick={startGame} disabled={players.length === 0}>
                        Démarrer la Partie
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', maxWidth: '800px', margin: '40px auto', justifyContent: 'center' }}>
                    {players.map(p => (
                        <div key={p.id} className="player-badge">
                            {p.name}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (gameState === 'question') {
        const q = quiz.questions[currentQuestion];
        return (
            <div className="host-container animate-slide-up" style={{ textAlign: 'center', paddingTop: '5vh' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 40px', fontSize: '1.5rem' }}>
                    <div>Question {currentQuestion + 1} / {quiz.questions.length}</div>
                    <div style={{ color: 'var(--success)' }}>Réponses : {answersCount} / {players.length}</div>
                </div>

                <div className="timer-circle" style={{ margin: '40px auto' }}>
                    {timeLeft}
                </div>

                <h2 style={{ fontSize: (q.image ? '2.5rem' : '3.5rem'), margin: '20px' }}>{q.q}</h2>

                {q.image && (
                    <div style={{ maxWidth: '600px', margin: '0 auto 30px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
                        <img src={q.image} alt="Question" style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain' }} />
                    </div>
                )}

                <div className="options-grid" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    {q.options.map((opt, i) => (
                        <div key={i} className="host-option-card"> {/* CSS to be added */}
                            <div className="host-option-shape shape-0"></div>
                            {opt}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (gameState === 'leaderboard') {
        return (
            <div className="host-container animate-slide-up" style={{ textAlign: 'center', paddingTop: '10vh', maxWidth: '800px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Classement Actuel</h2>

                <div className="glass-panel" style={{ marginBottom: '40px' }}>
                    {players.slice(0, 5).map((p, i) => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid var(--surface-border)', fontSize: '1.2rem' }}>
                            <div><strong>{i + 1}.</strong> {p.name}</div>
                            <div style={{ fontWeight: 'bold' }}>{p.score} pts</div>
                        </div>
                    ))}
                </div>

                <button className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.25rem' }} onClick={nextQuestion}>
                    Question Suivante
                </button>
            </div>
        );
    }

    if (gameState === 'end') {
        const winner = players[0];
        return (
            <div className="host-container animate-slide-up confetti" style={{ textAlign: 'center', paddingTop: '15vh' }}>
                <h1 style={{ fontSize: '4rem', marginBottom: '10px' }}>Podium Final</h1>
                <p style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', marginBottom: '40px' }}>Félicitations pour cette session !</p>

                {winner && (
                    <div className="glass-panel" style={{ display: 'inline-block', padding: '40px 80px', border: '2px solid var(--accent-color)', boxShadow: '0 0 40px var(--accent-glow)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🥇</div>
                        <h2 style={{ fontSize: '3rem' }}>{winner.name}</h2>
                        <p style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>{winner.score} points</p>
                    </div>
                )}

                <div style={{ marginTop: '50px' }}>
                    <button className="btn btn-secondary" onClick={onExit}>Retourner au Dashboard</button>
                </div>
            </div>
        );
    }

    return null;
};

export default Host;
