import React, { useState, useEffect } from 'react';

const Player = ({ socket, joinData, onExit }) => {
    const [gameState, setGameState] = useState('lobby'); // lobby, getready, question, result, end
    const [questionData, setQuestionData] = useState(null);
    const [roundResult, setRoundResult] = useState(null);
    const [finalScore, setFinalScore] = useState(0);

    const [selectedOption, setSelectedOption] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(15);
    const [timerId, setTimerId] = useState(null);

    useEffect(() => {
        socket.on('new-question', (data) => {
            setGameState('getready');
            setQuestionData(data);
            setSelectedOption(null);
            setRoundResult(null);

            // Auto transition to question after 3s
            setTimeout(() => {
                setGameState('question');
                setTimeRemaining(data.timeLimit);
            }, 3000);
        });

        socket.on('round-over', (data) => {
            setRoundResult(data);
            setGameState('result');
            if (timerId) clearInterval(timerId);
        });

        socket.on('answer-received', () => {
            setGameState('waiting-result');
            if (timerId) clearInterval(timerId);
        });

        socket.on('update-scores', (players) => {
            const me = players.find(p => p.id === socket.id);
            if (me) setFinalScore(me.score);
        });

        socket.on('game-over', (players) => {
            const me = players.find(p => p.id === socket.id);
            if (me) setFinalScore(me.score);
            setGameState('end');
        });

        socket.on('host-disconnected', () => {
            alert("L'hôte a quitté la partie.");
            onExit();
        });

        return () => {
            socket.off('new-question');
            socket.off('round-over');
            socket.off('answer-received');
            socket.off('update-scores');
            socket.off('game-over');
            socket.off('host-disconnected');
            if (timerId) clearInterval(timerId);
        };
    }, [joinData.pin]);

    // Player Timer Visual Sync
    useEffect(() => {
        if (gameState === 'question' && timeRemaining > 0) {
            const id = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
            setTimerId(id);
            return () => clearTimeout(id);
        }
    }, [gameState, timeRemaining]);

    const handleAnswerSelect = (index) => {
        if (gameState !== 'question') return;
        setSelectedOption(index);
        socket.emit('submit-answer', {
            pin: joinData.pin,
            answerIndex: index,
            timeRemaining: timeRemaining
        });
    };

    const shapes = ['triangle', 'diamond', 'circle', 'square'];
    const colors = ['#e21b3c', '#1368ce', '#d89e00', '#26890c']; // Kahoot-like colors

    if (gameState === 'lobby') {
        return (
            <div className="player-container animate-slide-up" style={{ textAlign: 'center', paddingTop: '20vh' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Vous êtes dans la partie !</h2>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px' }}>Regardez l'écran principal en attendant que le quiz commence...</p>
                <div className="player-badge" style={{ fontSize: '1.5rem', padding: '15px 30px' }}>{joinData.name}</div>
            </div>
        );
    }

    if (gameState === 'getready') {
        return (
            <div className="player-container animate-slide-up" style={{ textAlign: 'center', paddingTop: '20vh' }}>
                <h1 style={{ fontSize: '3rem' }}>Préparez-vous !</h1>
                <p style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>Question {questionData.questionIndex + 1}</p>
            </div>
        );
    }

    if (gameState === 'waiting-result') {
        return (
            <div className="player-container animate-slide-up" style={{ textAlign: 'center', paddingTop: '20vh' }}>
                <h2 style={{ fontSize: '2rem' }}>Réponse envoyée !</h2>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>En attente des autres joueurs pour afficher le résultat...</p>
            </div>
        );
    }

    if (gameState === 'result' && roundResult) {
        const isCorrect = selectedOption === roundResult.correctIndex;
        return (
            <div className="player-container animate-slide-up" style={{
                textAlign: 'center',
                paddingTop: '15vh',
                backgroundColor: isCorrect ? 'var(--success)' : 'var(--danger)',
                height: '100vh',
                width: '100vw',
                position: 'fixed',
                top: 0, left: 0,
                zIndex: 1000,
                color: 'white'
            }}>
                <h1 style={{ fontSize: '4rem', marginBottom: '20px' }}>{isCorrect ? 'Correct 🎉' : 'Faux ❌'}</h1>
                <p style={{ fontSize: '1.5rem' }}>Votre score : {finalScore}</p>
                <p style={{ fontSize: '1.2rem', marginTop: '40px', opacity: 0.8 }}>Regardez l'écran pour la question suivante.</p>
            </div>
        );
    }

    if (gameState === 'end') {
        return (
            <div className="player-container animate-slide-up" style={{ textAlign: 'center', paddingTop: '15vh' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>Fin du Quiz !</h1>
                <div className="glass-panel" style={{ display: 'inline-block', padding: '40px 60px' }}>
                    <p style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>Votre score final</p>
                    <div className="score-display gradient-text">{finalScore} points</div>
                </div>
                <div style={{ marginTop: '50px' }}>
                    <button className="btn btn-secondary" onClick={onExit}>Quitter la session</button>
                </div>
            </div>
        );
    }

    // Active Question view (Shows only shapes/colors for Kahoot-like feel)
    return (
        <div className="player-container" style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="player-timer" style={{ marginBottom: '20px' }}>
                <div
                    className="timer-fill"
                    style={{ width: `${(timeRemaining / questionData.timeLimit) * 100}%` }}
                ></div>
            </div>

            <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Question {questionData.questionIndex + 1}</h3>

            {questionData.question.image && (
                <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto 20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
                    <img src={questionData.question.image} alt="Question" style={{ width: '100%', height: 'auto', maxHeight: '180px', objectFit: 'contain' }} />
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', flex: 1, paddingBottom: '40px' }}>
                {questionData.question.options.map((_, index) => (
                    <button
                        key={index}
                        style={{
                            backgroundColor: colors[index],
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            boxShadow: '0 8px 0 rgba(0,0,0,0.2)',
                            transition: 'transform 0.1s'
                        }}
                        onClick={() => handleAnswerSelect(index)}
                        onMouseDown={e => e.currentTarget.style.transform = 'translateY(8px)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {/* Could render proper shapes here using CSS/SVG */}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Player;
