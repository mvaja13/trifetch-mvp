const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const db = require('./db');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// API Endpoints

// 1. Upload CSV
app.post('/upload-csv', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            // Process rows
            // transactional wrapper would be better but keeping simple for MVP
            const processRow = async (row) => {
                const { patient_id, gestational_age_weeks, risk_score, risk_type, timestamp } = row;

                // Upsert patient
                await new Promise((resolve, reject) => {
                    db.run(`INSERT INTO patients (patient_id, gestational_age_weeks, updated_at) 
                  VALUES (?, ?, ?) 
                  ON CONFLICT(patient_id) DO UPDATE SET 
                  gestational_age_weeks = excluded.gestational_age_weeks,
                  updated_at = excluded.updated_at`,
                        [patient_id, gestational_age_weeks, timestamp || new Date().toISOString()],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });

                // Insert risk score
                await new Promise((resolve, reject) => {
                    db.run(`INSERT INTO risk_scores (patient_id, risk_score, risk_type, timestamp) VALUES (?, ?, ?, ?)`,
                        [patient_id, risk_score, risk_type, timestamp],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            };

            // Execute all sequentially to avoid potential locking issues in simple sqlite setup
            (async () => {
                try {
                    for (const row of results) {
                        await processRow(row);
                    }
                    // Cleanup file
                    fs.unlinkSync(req.file.path);
                    res.json({ message: `Processed ${results.length} rows successfully` });
                } catch (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Failed to process CSV data' });
                }
            })();
        });
});

// 2. GET /patients (aggregated)
app.get('/patients', (req, res) => {
    const { sort, filter } = req.query;
    // Get latest risk score for each patient
    // We need to group by patient_id and order by timestamp desc to pick latest.
    // SQLite specific distinct/group by trick or window function.
    // Simple approach: get all patients, then get their latest risk score.

    const query = `
    SELECT p.patient_id, p.gestational_age_weeks, 
           rs.risk_score, rs.risk_type, rs.timestamp
    FROM patients p
    JOIN risk_scores rs ON p.patient_id = rs.patient_id
    WHERE rs.id IN (
        SELECT id FROM risk_scores rs2 
        WHERE rs2.patient_id = p.patient_id 
        ORDER BY rs2.timestamp DESC LIMIT 1
    )
  `;

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Calculate flags and filter/sort in JS for simplicity or extend SQL
        // To calculate 'rising', we need the PREVIOUS score too. 
        // For MVP efficiency, let's fetch the last TWO scores for everyone or just do a secondary lookup?
        // Let's do a secondary lookup for "rising" check if we want to be precise, 
        // OR just fetch all risk scores and process in memory (small dataset).
        // Let's stick to simple: fetch this list. Then for each, we might need to check 'rising'.
        // Actually, let's try to get rising status in a more clever SQL or just separate calls?
        // Let's iterate and get previous score.

        // Better: Fetch ALL risk scores sorted by time, group by patient in JS.
        db.all(`SELECT * FROM risk_scores ORDER BY patient_id, timestamp ASC`, [], (err, allScores) => {
            if (err) return res.status(500).json({ error: err.message });

            const patientMap = {};

            // Group scores
            allScores.forEach(s => {
                if (!patientMap[s.patient_id]) patientMap[s.patient_id] = [];
                patientMap[s.patient_id].push(s);
            });

            const finalResults = rows.map(patient => {
                const scores = patientMap[patient.patient_id];
                let flag = '';

                if (scores && scores.length >= 2) {
                    const latest = scores[scores.length - 1];
                    const prev = scores[scores.length - 2];
                    // Check diff
                    if (latest.risk_score - prev.risk_score > 20) {
                        flag = 'rising';
                    }
                }
                return {
                    ...patient,
                    flag
                };
            });

            let processed = finalResults;

            // Filter
            if (filter === 'high') {
                processed = processed.filter(p => p.risk_score > 70);
            }

            // Sort
            if (sort === 'risk_desc') {
                processed.sort((a, b) => b.risk_score - a.risk_score);
            }

            res.json(processed);
        });
    });
});

// 3. GET /patients/:id
app.get('/patients/:id', (req, res) => {
    const { id } = req.params;

    // Get patient details
    db.get(`SELECT * FROM patients WHERE patient_id = ?`, [id], (err, patient) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        // Get last 5 scores
        db.all(`SELECT * FROM risk_scores WHERE patient_id = ? ORDER BY timestamp DESC LIMIT 5`, [id], (err, scores) => {
            if (err) return res.status(500).json({ error: err.message });

            // Get notes
            db.all(`SELECT * FROM notes WHERE patient_id = ? ORDER BY created_at DESC`, [id], (err, notes) => {
                if (err) return res.status(500).json({ error: err.message });

                res.json({
                    ...patient,
                    history: scores.reverse(), // send chronological for chart? or just desc. Let's send desc as requested but chart might want asc.
                    // Request said "last up to 5". Let's send them.
                    notes: notes
                });
            });
        });
    });
});

// 4. POST /patients/:id/notes
app.post('/patients/:id/notes', (req, res) => {
    const { id } = req.params;
    const { note, created_by } = req.body;

    db.run(`INSERT INTO notes (patient_id, note_text, created_by) VALUES (?, ?, ?)`,
        [id, note, created_by || 'clinician'],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Note added' });
        }
    );
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
