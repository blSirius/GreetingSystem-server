// server.js
const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const cors = require('cors');
const fs = require('fs');
const path = require('path')

const app = express();
const port = 5000;

app.use(cors());

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'GreetingSystemDB',
    password: '12345678',
    port: 5432,
    charset: 'UTF8',
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        // Get the folder name from the request body or query parameters
        const folderName = req.body.folderName || req.query.folderName || 'defaultFolder';
        const folderPath = `img/${folderName}`;

        // Check if the folder exists, create it if not
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        // Get the list of files in the folder
        const files = fs.readdirSync(folderPath);

        // Calculate the new image name
        const newImageName = `${files.length + 1}.png`;
        const imagePath = path.join(folderPath, newImageName);

        fs.writeFileSync(imagePath, req.file.buffer);
        res.json('Successfully uploaded');
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.use('/images', express.static('img'));

app.get('/folders', (req, res) => {
    try {
        const imgFolder = 'img';

        // Get the list of folders in the 'img' directory
        const folders = fs.readdirSync(imgFolder, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        res.json({ folders });
    } catch (error) {
        console.error('Error getting folder names:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});