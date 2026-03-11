import React, { useState, useEffect } from 'react';

const History = ({ onBack }) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${window.location.origin}/api/results`)
            .then(res => res.json())
            .then(data => {
                setResults(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching history:", err);
                setLoading(false);
            });
    }, []);

    const formatDate = (isoStr) => {
        const date = new Date(isoStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="animate-slide-up" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="dashboard-header" style={{ marginBottom: '20px' }}>
                <div>
                    <h2>Historique des Sessions</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Consultez les résultats passés</p>
                </div>
                <button className="btn btn-secondary" onClick={onBack}>Retour</button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Chargement de l'historique...</div>
            ) : results.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
                    <h3>Aucune session archivée.</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Terminez un quiz pour voir son classement ici.</p>
                </div>
            ) : (
                <div className="builder-layout">
                    {results.map((res, idx) => (
                        <div key={idx} className="glass-panel" style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>{res.quizTitle}</h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(res.date)}</span>
                                </div>
                                <div className="quiz-pin" style={{ background: 'var(--success)', color: 'white' }}>Terminé</div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left' }}>
                                        <th style={{ padding: '8px' }}>Rang</th>
                                        <th style={{ padding: '8px' }}>Joueur</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {res.leaderboard.slice(0, 5).map((player, pIdx) => (
                                        <tr key={pIdx} style={{ borderBottom: 'px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '8px' }}>#{pIdx + 1}</td>
                                            <td style={{ padding: '8px', fontWeight: 600 }}>{player.name}</td>
                                            <td style={{ padding: '8px', textAlign: 'right', color: 'var(--accent-color)', fontWeight: 700 }}>{player.score}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {res.leaderboard.length > 5 && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '10px', textAlign: 'center' }}>
                                    + {res.leaderboard.length - 5} autres participants
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default History;
