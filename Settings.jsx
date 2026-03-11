import React, { useState } from 'react';

const Settings = ({ currentPassword, onChangePassword, onBack }) => {
    const [oldPwd, setOldPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (oldPwd !== currentPassword) {
            setError('Ancien mot de passe incorrect.');
            return;
        }

        if (newPwd.length < 4) {
            setError('Le nouveau mot de passe doit contenir au moins 4 caractères.');
            return;
        }

        if (newPwd !== confirmPwd) {
            setError('La confirmation du mot de passe ne correspond pas.');
            return;
        }

        onChangePassword(newPwd);
        setMessage('Mot de passe mis à jour avec succès !');
        setOldPwd('');
        setNewPwd('');
        setConfirmPwd('');
    };

    return (
        <div className="animate-slide-up" style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            <div className="dashboard-header" style={{ marginBottom: '20px' }}>
                <h2>Paramètres Formateur</h2>
                <button className="btn btn-secondary" onClick={onBack}>Retour</button>
            </div>

            <div className="glass-panel">
                <h3>Sécurité et Accès</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
                    Mettez à jour le mot de passe d'administration global pour protéger l'accès à vos quiz.
                </p>

                {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}
                {message && <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>{message}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Ancien mot de passe :</label>
                        <input
                            type="password"
                            className="input-field"
                            value={oldPwd}
                            onChange={(e) => setOldPwd(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Nouveau mot de passe :</label>
                        <input
                            type="password"
                            className="input-field"
                            value={newPwd}
                            onChange={(e) => setNewPwd(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Confirmer le nouveau mot de passe :</label>
                        <input
                            type="password"
                            className="input-field"
                            value={confirmPwd}
                            onChange={(e) => setConfirmPwd(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', alignSelf: 'flex-start' }}>
                        Mettre à jour le mot de passe
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Settings;
