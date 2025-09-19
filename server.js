const express = require('express');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

// --- SUPABASE CONFIG ---
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- CLOUDINARY CONFIG ---
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- MULTER USES CLOUDINARY STORAGE ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio_projects',
    resource_type: 'auto',
    public_id: (req, file) => 'project-' + Date.now(),
  },
});
const upload = multer({ storage: storage });

// --- API ROUTES NOW USE SUPABASE ---

// GET all projects from the database
app.get('/api/projects', async (req, res) => {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false }); // Show newest first

    if (error) {
        console.error('Error fetching projects:', error);
        return res.status(500).json({ message: 'Could not fetch projects.' });
    }
    res.json(data);
});

// POST a new project to Cloudinary and the database
app.post('/api/projects', upload.fields([{ name: 'thumbnailFile', maxCount: 1 }, { name: 'downloadableFile', maxCount: 1 }]), async (req, res) => {
    const { title, software } = req.body;
    const thumbnailFile = req.files.thumbnailFile[0];
    const downloadableFile = req.files.downloadableFile[0];

    if (!title || !thumbnailFile || !downloadableFile) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const newProjectData = {
        title,
        software,
        thumbnailURL: thumbnailFile.path,
        downloadableURL: downloadableFile.path,
        downloadableFileName: downloadableFile.originalname,
        downloadableFileType: downloadableFile.mimetype,
        thumbnail_id: thumbnailFile.filename,
        downloadable_id: downloadableFile.filename
    };

    const { data, error } = await supabase
        .from('projects')
        .insert([newProjectData]);

    if (error) {
        console.error('Error inserting project:', error);
        return res.status(500).json({ message: 'Could not save project to database.' });
    }

    res.status(201).json(data);
});

// DELETE a project from the database and its files from Cloudinary
app.delete('/api/projects/:id', async (req, res) => {
    const { id } = req.params;

    // First, get the project details from Supabase to find the file IDs
    const { data: projectToDelete, error: fetchError } = await supabase
        .from('projects')
        .select('thumbnail_id, downloadable_id')
        .eq('id', id)
        .single(); // We expect only one result

    if (fetchError || !projectToDelete) {
        return res.status(404).json({ message: 'Project not found.' });
    }

    try {
        // Delete files from Cloudinary
        await cloudinary.uploader.destroy(projectToDelete.thumbnail_id, { resource_type: "image" });
        await cloudinary.uploader.destroy(projectToDelete.downloadable_id, { resource_type: "raw" });
    } catch (err) {
        console.error("Error deleting files from Cloudinary:", err);
        // Don't stop; still try to delete the database record
    }

    // Now, delete the project record from the Supabase table
    const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

    if (deleteError) {
        console.error('Error deleting project from database:', deleteError);
        return res.status(500).json({ message: 'Could not delete project from database.' });
    }

    res.status(200).json({ message: 'Project deleted successfully.' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});