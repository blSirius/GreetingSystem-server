const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 5000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

const secretKey = 'PeemSecert';

//db connect
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'GreetingSystemDB',
  password: '12345678',
  port: 5432,
  charset: 'UTF8',
});

app.post('/register', async (req, res) => {
  const { username, password, status } = req.body;

  try {
    // const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO authentication (username, password, status) VALUES ($1, $2, $3) RETURNING *',
      [username, password, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM authentication WHERE username = $1 AND password = $2', [username, password]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ username: username }, secretKey, { expiresIn: '1h' });

    res.json({ message: 'Login successful', token: token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/decodeToken', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token not provided' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.json({ message: 'decoded success', decoded: decoded });
  });
});

//folder api
app.use('/getImageFolder', express.static('labels'));

app.get('/getLabelFolder', (req, res) => {
  try {
    const folders = fs.readdirSync('labels', { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    res.json({ folders });
  } catch (error) {
    console.error('Error getting folder names:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/updateImageFolder', upload.single('labels'), async (req, res) => {
  try {
    const folderName = req.body.folderName || req.query.folderName || 'defaultFolder';
    const folderPath = `labels/${folderName}`;
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    const files = fs.readdirSync(folderPath);
    const newImageName = `${files.length + 1}.png`;
    const imagePath = path.join(folderPath, newImageName);
    fs.writeFileSync(imagePath, req.file.buffer);
    res.json('Successfully uploaded');
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});