import React, { useState } from 'react';

const QuizBuilder = ({ initialQuiz, onSave, onCancel }) => {
    const [title, setTitle] = useState(initialQuiz ? initialQuiz.title : '');
    const [timeLimit, setTimeLimit] = useState(initialQuiz ? initialQuiz.timeLimit : 15);
    const [questions, setQuestions] = useState(initialQuiz ? initialQuiz.questions : [
        { q: '', options: ['', '', '', ''], correct: 0 }
    ]);

    const handleQuestionChange = (index, value) => {
        const newQs = [...questions];
        newQs[index].q = value;
        setQuestions(newQs);
    };

    const handleImageUpload = (index, file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        
        fetch(`${window.location.origin}/api/upload`, {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            const newQs = [...questions];
            newQs[index].image = data.imageUrl;
            setQuestions(newQs);
        })
        .catch(err => alert("Erreur lors de l'envoi de l'image"));
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQs = [...questions];
        newQs[qIndex].options[oIndex] = value;
        setQuestions(newQs);
    };

    const handleCorrectChoice = (qIndex, oIndex) => {
        const newQs = [...questions];
        newQs[qIndex].correct = oIndex;
        setQuestions(newQs);
    };

    const addQuestion = () => {
        setQuestions([...questions, { q: '', options: ['', '', '', ''], correct: 0 }]);
    };

    const handleSave = () => {
        if (!title.trim()) {
            alert("Veuillez donner un titre au quiz.");
            return;
        }

        const pin = initialQuiz ? initialQuiz.pin : Math.floor(100000 + Math.random() * 900000).toString();
        const id = initialQuiz ? initialQuiz.id : Date.now().toString();

        onSave({ id, pin, title, timeLimit, questions });
    };

    return (
        <div className="animate-slide-up" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            <div className="dashboard-header" style={{ marginBottom: '20px' }}>
                <h2>{initialQuiz ? 'Modifier le Quiz' : 'Créer un nouveau Quiz'}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-secondary" onClick={onCancel}>Annuler</button>
                    <button className="btn btn-primary" onClick={handleSave}>Enregistrer</button>
                </div>
            </div>

            <div className="glass-panel" style={{ marginBottom: '30px' }}>
                <input
                    type="text"
                    className="input-field"
                    placeholder="Titre du Quiz (ex: Formation Microfinance)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '15px' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ color: 'var(--text-secondary)' }}>Temps limite par question (secondes) :</label>
                    <input
                        type="number"
                        className="input-field"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                        style={{ width: '100px' }}
                        min="5" max="60"
                    />
                </div>
            </div>

            <div className="builder-layout">
                {questions.map((q, qIndex) => (
                    <div key={qIndex} className="glass-panel question-block">
                        <div className="question-header">
                            <h3>Question {qIndex + 1}</h3>
                            {questions.length > 1 && (
                                <button
                                    className="btn btn-danger"
                                    style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                    onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}
                                >
                                    Retirer
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div style={{ flex: 1 }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Saisissez votre question ici..."
                                    value={q.q}
                                    onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                                    style={{ marginBottom: '10px' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <label className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem', cursor: 'pointer' }}>
                                        📷 {q.image ? 'Changer l\'image' : 'Ajouter une image'}
                                        <input 
                                            type="file" 
                                            hidden 
                                            accept="image/*" 
                                            onChange={(e) => handleImageUpload(qIndex, e.target.files[0])} 
                                        />
                                    </label>
                                    {q.image && (
                                        <button 
                                            className="btn btn-danger" 
                                            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                                            onClick={() => {
                                                const newQs = [...questions];
                                                delete newQs[qIndex].image;
                                                setQuestions(newQs);
                                            }}
                                        >
                                            Effacer
                                        </button>
                                    )}
                                </div>
                            </div>
                            {q.image && (
                                <div style={{ width: '150px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
                                    <img src={q.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            )}
                        </div>

                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '20px' }}>
                            Options de réponse (Cochez la bonne réponse) :
                        </p>
                        <div className="options-grid">
                            {q.options.map((opt, oIndex) => (
                                <div key={oIndex} className={`option-input-wrapper ${q.correct === oIndex ? 'correct-option' : ''}`}>
                                    <input
                                        type="radio"
                                        name={`q-${qIndex}`}
                                        className="option-radio"
                                        checked={q.correct === oIndex}
                                        onChange={() => handleCorrectChoice(qIndex, oIndex)}
                                    />
                                    <input
                                        type="text"
                                        className="input-field option-input"
                                        placeholder={`Option ${oIndex + 1}`}
                                        value={opt}
                                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '20px' }} onClick={addQuestion}>
                + Ajouter une question
            </button>

        </div>
    );
};

export default QuizBuilder;
