import React, { useState, useEffect } from 'react';

const Home = ({ socket, onJoinSuccess }) => {
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const pinQuery = params.get('pin');
        if (pinQuery) {
            setCode(pinQuery.toUpperCase());
        }

        socket.on('join-success', (data) => {
            onJoinSuccess(code, name, data.title);
        });

        socket.on('join-error', (msg) => {
            setError(msg);
        });

        return () => {
            socket.off('join-success');
            socket.off('join-error');
        };
    }, [socket, code, name, onJoinSuccess]);

    const handleJoin = (e) => {
        e.preventDefault();
        if (!code || !name) {
            setError('Veuillez entrer un code et un pseudo.');
            return;
        }
        socket.emit('player-join', { pin: code, name });
    };

    return (
        <div className="hero-section animate-slide-up">
            <h1 className="hero-title">
                Engagez votre audience avec <span className="gradient-text">Quiz Paositra Finances</span>
            </h1>
            <p className="hero-subtitle">
                Temps réel • Quiz Chronométrés • Podium Dynamique
            </p>

            <div className="glass-panel" style={{ marginTop: '20px' }}>
                <form className="join-form" onSubmit={handleJoin} style={{ flexDirection: 'column' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Code PIN"
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value.toUpperCase());
                            setError('');
                        }}
                        maxLength={6}
                    />
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Votre Pseudo"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setError('');
                        }}
                        maxLength={15}
                        style={{ letterSpacing: 'normal' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                        Rejoindre la partie
                    </button>
                </form>
                {error && <p style={{ color: 'var(--danger)', marginTop: '12px', textAlign: 'center', fontWeight: 'bold' }}>{error}</p>}
            </div>
        </div>
    );
};

export default Home;
