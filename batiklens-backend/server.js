const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const serviceAccount = require('./batiklens-capstone-project-firebase-adminsdk-kgxyt-f4ab7136c4.json');
const gcsConfig = require('./gcsConfig');
const { Storage } = require('@google-cloud/storage');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://console.firebase.google.com/u/0/project/batiklens-capstone-project/firestore/data/~2Fbatiks~2FvVK9VVIjM4AtBLxTLoQX?hl=id',
});

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const firestore = admin.firestore();
const batiksCollection = firestore.collection('batiks');

const storage = new Storage({
  projectId: gcsConfig.projectId,
  keyFilename: gcsConfig.keyFilename,
});

const bucket = storage.bucket(gcsConfig.bucketName);

// Endpoint untuk menambahkan tipe batik beserta gambar ke Firestore dan GCS
app.post('/api/addBatik', async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;

    if (!name || !description || !imageUrl) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Simpan informasi batik ke Firestore
    const batikRef = await batiksCollection.add({ name, description, imageUrl });

    // Simpan gambar ke GCS
    const file = bucket.file(batikRef.id);
    const fileStream = file.createWriteStream();

    // Download gambar dari URL dan upload ke GCS
    // (Kode untuk mengunduh gambar dan mengirimkannya ke fileStream)

    fileStream.on('error', (err) => {
      console.error('Error uploading image to GCS:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    });

    fileStream.on('finish', () => {
      console.log('Image uploaded to GCS successfully');
    });

    // ... (kode untuk mengunduh gambar dan mengirimkannya ke fileStream)

    return res.status(200).json({ message: 'Batik added successfully', id: batikRef.id });
  } catch (error) {
    console.error('Error adding batik:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint untuk mendapatkan batik berdasarkan ID
app.get('/api/batik/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Cari batik berdasarkan ID
    const batikRef = admin.firestore().collection('batiks').doc(id);
    const batikDoc = await batikRef.get();

    if (!batikDoc.exists) {
      return res.status(404).json({ error: true, message: 'Batik not found' });
    }

    const batikData = batikDoc.data();
    return res.status(200).json(batikData);
  } catch (error) {
    console.error('Error getting batik by ID:', error);
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});


// Endpoint untuk mendapatkan semua tipe batik dari Firestore
app.get('/api/allBatiks', async (req, res) => {
  try {
    const snapshot = await batiksCollection.get();
    const batiks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(batiks);
  } catch (error) {
    console.error('Error getting batiks from Firestore:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
