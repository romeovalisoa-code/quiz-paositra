import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const SUPABASE_URL = 'https://nniwntrugmpvahnvoihb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4fiz5S8e7t5lzxp_jvEDhw_KcV4oT4H';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'))); // Serve uploaded images
app.use(express.static(path.join(__dirname, 'dist'))); // Serve the React build
const server = createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

// Configure Multer for image uploads (Memory storage for Supabase)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload Endpoint
app.post('/api/upload', upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    try {
        const file = req.file;
        const fileName = `${Date.now()}-${file.originalname.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`;
        
        const { data, error } = await supabase.storage
            .from('quiz-images')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('quiz-images')
            .getPublicUrl(fileName);

        res.json({ imageUrl: publicUrl });
    } catch (err) {
        console.error("Supabase Upload Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// === API REST Endpoints (Supabase) ===
app.get('/api/quizzes', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('*');
        
        if (error) throw error;
        
        const formatted = data.map(q => ({
            ...q,
            questions: typeof q.questions === 'string' ? JSON.parse(q.questions) : q.questions
        }));
        res.json(formatted);
    } catch (err) {
        console.error("Supabase Get Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/quizzes', async (req, res) => {
    try {
        const { id, pin, title, timeLimit, questions } = req.body;
        
        const { data, error } = await supabase
            .from('quizzes')
            .upsert({ 
                id, 
                pin, 
                title, 
                timeLimit, 
                questions: questions // Supabase handles JSON objects directly if column is jsonb
            });
            
        if (error) throw error;
        res.json({ success: true, id });
    } catch (err) {
        console.error("Supabase Post Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/quizzes/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('quizzes')
            .delete()
            .eq('id', req.params.id);
            
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ==========================

io.on('connection', (socket) => {
    // Host creates a listening room for a specific quiz
    socket.on('host-join', (quizData) => {
        const pin = quizData.pin;
        rooms[pin] = {
            quiz: quizData,
            hostId: socket.id,
            players: [],
            currentQuestionIndex: -1,
            hasStarted: false,
            answersReceived: 0,
            answerStats: []
        };
        socket.join(pin);
        console.log(`Room created: ${pin}`);
    });

    // Player joins a room using the PIN and a nickname
    socket.on('player-join', (data) => {
        const { pin, name } = data;
        if (rooms[pin] && !rooms[pin].hasStarted) {
            socket.join(pin);
            const newPlayer = { id: socket.id, name, score: 0 };
            rooms[pin].players.push(newPlayer);
            // Notify Host
            io.to(rooms[pin].hostId).emit('update-players', rooms[pin].players);
            // Notify Player
            socket.emit('join-success', { title: rooms[pin].quiz.title, playerId: socket.id });
            console.log(`${name} joined room: ${pin}`);
        } else if (rooms[pin] && rooms[pin].hasStarted) {
            socket.emit('join-error', 'La partie a déjà commencé.');
        } else {
            socket.emit('join-error', 'Code PIN invalide.');
        }
    });

    // Host starts the game
    socket.on('start-game', (pin) => {
        if (rooms[pin]) {
            rooms[pin].hasStarted = true;
            rooms[pin].currentQuestionIndex = 0;
            rooms[pin].answersReceived = 0;

            const q = rooms[pin].quiz.questions[0];
            rooms[pin].answerStats = new Array(q.options.length).fill(0);

            const timeLimit = rooms[pin].quiz.timeLimit || 15;

            // Clean up sensitive data before sending to player
            const safeQuestion = { ...q };
            delete safeQuestion.correct;

            io.to(pin).emit('new-question', {
                questionIndex: 0,
                question: safeQuestion,
                timeLimit: timeLimit
            });
        }
    });

    // Player submits an answer
    socket.on('submit-answer', (data) => {
        const { pin, answerIndex, timeRemaining } = data;
        if (rooms[pin]) {
            const room = rooms[pin];
            const q = room.quiz.questions[room.currentQuestionIndex];
            const player = room.players.find(p => p.id === socket.id);

            if (!player) return;

            room.answersReceived++;
            room.answerStats[answerIndex]++;

            // Calculate score based on Qruiz/Kahoot logic
            if (q.correct === answerIndex) {
                const timeLimit = room.quiz.timeLimit || 15;
                // Maximum 1000 points, decreasing as time runs out
                const points = Math.round((timeRemaining / timeLimit) * 500) + 500;
                player.score += points;
            }

            // Tell host someone answered
            io.to(room.hostId).emit('player-answered', {
                answersCount: room.answersReceived,
                totalPlayers: room.players.length
            });

            socket.emit('answer-received');

            // If everyone answered, auto-show results
            if (room.answersReceived >= room.players.length) {
                clearTimeout(room.roundTimer);
                io.to(pin).emit('round-over', {
                    correctIndex: q.correct,
                    stats: room.answerStats
                });
                io.to(room.hostId).emit('update-scores', room.players.sort((a, b) => b.score - a.score));
            }
        }
    });

    // Host ends round manually (e.g. Timer ran out)
    socket.on('time-up', (pin) => {
        if (rooms[pin]) {
            const room = rooms[pin];
            const q = room.quiz.questions[room.currentQuestionIndex];
            io.to(pin).emit('round-over', {
                correctIndex: q.correct,
                stats: room.answerStats
            });
            io.to(room.hostId).emit('update-scores', room.players.sort((a, b) => b.score - a.score));
        }
    });

    // Host moves to next question
    socket.on('next-question', (pin) => {
        if (rooms[pin]) {
            const room = rooms[pin];
            room.currentQuestionIndex++;

            if (room.currentQuestionIndex < room.quiz.questions.length) {
                room.answersReceived = 0;
                const q = room.quiz.questions[room.currentQuestionIndex];
                room.answerStats = new Array(q.options.length).fill(0);

                const safeQuestion = { ...q };
                delete safeQuestion.correct;

                io.to(pin).emit('new-question', {
                    questionIndex: room.currentQuestionIndex,
                    question: safeQuestion,
                    timeLimit: room.quiz.timeLimit || 15
                });
            } else {
                const leaderboard = room.players.sort((a, b) => b.score - a.score);
                
                // Save results to Supabase
                (async () => {
                    try {
                        const { error } = await supabase
                            .from('results')
                            .insert({
                                quizId: room.quiz.id,
                                quizTitle: room.quiz.title,
                                leaderboard: leaderboard,
                                date: new Date().toISOString()
                            });
                        if (error) throw error;
                        console.log(`Résultats sauvegardés sur Supabase pour: ${room.quiz.title}`);
                    } catch (e) {
                        console.error("Erreur de sauvegarde Supabase:", e);
                    }
                })();

                io.to(pin).emit('game-over', leaderboard);
            }
        }
    });

    // Endpoint for history
    app.get('/api/results', async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('results')
                .select('*')
                .order('date', { ascending: false });
                
            if (error) throw error;
            
            const formatted = data.map(r => ({
                ...r,
                leaderboard: typeof r.leaderboard === 'string' ? JSON.parse(r.leaderboard) : r.leaderboard
            }));
            res.json(formatted);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    socket.on('disconnect', () => {
        for (const pin in rooms) {
            if (rooms[pin].hostId === socket.id) {
                // Host disconnected
                io.to(pin).emit('host-disconnected');
                delete rooms[pin];
            } else {
                // Player disconnected
                const idx = rooms[pin].players.findIndex(p => p.id === socket.id);
                if (idx !== -1) {
                    const pName = rooms[pin].players[idx].name;
                    rooms[pin].players.splice(idx, 1);
                    if (rooms[pin].hostId) {
                        io.to(rooms[pin].hostId).emit('update-players', rooms[pin].players);
                    }
                    console.log(`${pName} left room ${pin}`);
                }
            }
        }
    });
});

// Fallback for SPA routing: send all other requests to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});
