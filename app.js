const express = require('express');
const fileUpload = require('express-fileupload');
const venom = require('venom-bot');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
const port = 3000;

venom.create({
    session: 'apizap'
})
.then((client) => start(client))
.catch((err) => console.log(err));

// Usar um arquivo SQLite persistente
const db = new sqlite3.Database('./message_history.db');

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS message_history (id INTEGER PRIMARY KEY, date TEXT, phone TEXT, message TEXT)");
});

const start = (client) => {
    app.post("/send-file", async (req, res) => {
        const { to, message, description, file, fileName } = req.body;

        console.log(`Recebido: to=${to}, message=${message}, description=${description}, fileName=${fileName}`);

        if (!isValidNumber(to)) {
            console.log(`Número inválido ou não cadastrado: ${to}`);
            res.status(400).json("Número inválido ou não cadastrado.");
            return;
        }

        try {
            if (message) {
                await client.sendText(to + "@c.us", message);
                console.log(`Para: ${to} - Mensagem enviada com sucesso!`);
            }

            if (file && fileName) {
                const filePath = path.join(__dirname, 'uploads', fileName);
                fs.writeFileSync(filePath, Buffer.from(file, 'base64'));

                await client.sendFile(to + "@c.us", filePath, fileName, description || " ");
                console.log(`Para: ${to} - Arquivo enviado com sucesso!`);

                fs.unlinkSync(filePath);
            }

            const date = new Date().toISOString();
            db.run("INSERT INTO message_history (date, phone, message) VALUES (?, ?, ?)", [date, to, message], function(err) {
                if (err) {
                    console.error('Erro ao salvar no banco de dados:', err.message);
                }
            });

            res.json("Mensagem enviada com sucesso!");
        } catch (error) {
            console.log(`Erro ao enviar mensagem ou arquivo para ${to}:`, error);
            res.status(500).json("Erro ao enviar mensagem ou arquivo.");
        }
    });

    app.get('/message-history', (req, res) => {
        db.all("SELECT * FROM message_history", [], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ messages: rows });
        });
    });

    app.delete('/delete-message/:id', (req, res) => {
        const id = req.params.id;
        db.run("DELETE FROM message_history WHERE id = ?", id, function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Mensagem deletada com sucesso!' });
        });
    });
};

const isValidNumber = (number) => {
    const regex = /^[0-9]{10,13}$/;
    return regex.test(number);
};

app.listen(port, () => console.log(`Listening on port ${port}!`));
