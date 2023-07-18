const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'))

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  }
});

const modelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/model');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage
});

const modelUpload = multer({
  storage: modelStorage
});

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

app.get('/', (req, res) => {
    const sql = 'SELECT * FROM pictures'
    db.query(sql, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
      });
});

app.get('/model', (req, res) => {
    const sql = 'SELECT * FROM models'
    db.query(sql, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
      });
});

app.post('/upload/:id', upload.single('image'), async (req, res) => {
    const id = req.params.id;
    const image = req.file.filename;
    const name = req.body.name;
    const description = req.body.description;
  
    const imagePath = path.join(__dirname, 'public/images', image);
    const metadata = await sharp(imagePath).metadata();
    const width = metadata.width;
    const height = metadata.height;
  
    let newWidth, newHeight;
  
    if (width > height) {
      newWidth = 10;
      newHeight = newWidth * height / width;
    } else {
      newHeight = 10;
      newWidth = newHeight * width / height;
    }
  
    const sql = `UPDATE pictures SET imagen = ?, nombre = ?, descripcion = ?, ancho = ?, alto = ? WHERE id = ?`;
    const values = [image, name, description, newWidth, newHeight, id];
  
    db.query(sql, values, (err, result) => {
      if (err) return res.json(err);
      return res.json({ success: true });
    });
});

app.post('/uploadModel/:id', modelUpload.fields([{ name: 'model', maxCount: 1 }, { name: 'texture', maxCount: 1 }]), (req, res) => {
    const id = req.params.id;
    const model = req.files['model'][0].filename;
    const texture = req.files['texture'][0].filename;
    const name = req.body.name;
    const description = req.body.description;
    const size = req.body.size || 100;
    const tall = req.body.tall;
    const rotation = req.body.rotation;
  
    const sql = `UPDATE models SET model3D = ?, textura = ?, nombre = ?, descripcion = ?, size = ?, altura = ?, rotacion = ? WHERE id = ?`;
    const values = [model, texture, name, description, size/100, tall, rotation * (Math.PI / 180), id];
  
    db.query(sql, values, (err, result) => {
        console.log(result)
      if (err) return res.json(err);
      return res.json({ success: true });
    });
});

app.get('/pictures', (req, res) => {
  const sql = "SELECT * FROM pictures";
  db.query(sql, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.listen(8081, () => {
  console.log("listening");
});