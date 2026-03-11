import React from 'react';

const Dashboard = ({ quizzes, onCreate, onEdit, onDelete, onHost }) => {
    return (
        <div className="animate-slide-up" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="dashboard-header">
                <div>
                    <h2>Espace Formateur</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Gérez et animez vos sessions</p>
                </div>
                <button className="btn btn-primary" onClick={onCreate}>
                    + Nouveau Quiz
                </button>
            </div>

            {quizzes.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <h3>Vous n'avez pas encore créé de quiz.</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Commencez dès maintenant en créant votre premier contenu interactif.</p>
                    <button className="btn btn-primary" onClick={onCreate}>Créer mon premier Quiz</button>
                </div>
            ) : (
                <div className="quiz-grid">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="glass-panel quiz-card">
                            <div>
                                <div className="quiz-pin">PIN: {quiz.pin}</div>
                                <h3 className="quiz-card-title">{quiz.title}</h3>
                                <p className="quiz-card-meta">
                                    {quiz.questions?.length || 0} questions • {quiz.timeLimit || 15}s par question
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onHost(quiz)}>
                                    Animer (Host)
                                </button>
                                <button className="btn btn-secondary" style={{ padding: '8px 12px' }} title="Copier le lien direct vers le Quiz" onClick={() => {
                                    const link = `${window.location.origin}/?pin=${quiz.pin}`;
                                    navigator.clipboard.writeText(link).then(() => {
                                        alert("Lien direct copié : " + link);
                                    }).catch(err => {
                                        alert("Erreur lors de la copie du lien.");
                                    });
                                }}>
                                    🔗 Lien
                                </button>
                            </div>
                            <div className="quiz-actions" style={{ marginTop: '15px' }}>
                                <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => onEdit(quiz)}>
                                    Modifier
                                </button>
                                <button className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => onDelete(quiz.id)}>
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
