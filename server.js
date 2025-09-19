const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// --- NEW: CLOUDINARY CONFIGURATION ---
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config(); // To read local .env file for development

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// We still need a local JSON file until we add a database
// This will still have the reset problem, but we'll fix files first.
const PROJECTS_FILE = path.join(__dirname, 'projects.json');
if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, '[]');
}
// --- END NEW CONFIG ---

const app = express();
const PORT = process.env.PORT || 3000; // Render uses a variable PORT

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- Helper Functions (Unchanged) ---
const readProjects = () => {
    const data = fs.readFileSync(PROJECTS_FILE);
    return JSON.parse(data);
};
const writeProjects = (projects) => {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
};

// --- NEW: MULTER USES CLOUDINARY STORAGE ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio_projects', // A folder name in your Cloudinary account
    resource_type: 'auto', // Let Cloudinary detect if it's an image, video, or raw file
    public_id: (req, file) => 'project-' + Date.now(), // Create a unique file name
  },
});

const upload = multer({ storage: storage });
// --- END NEW MULTER ---

// --- API Routes (Updated) ---
app.get('/api/projects', (req, res) => {
    res.json(readProjects());
});

app.post('/api/projects', upload.fields([{ name: 'thumbnailFile', maxCount: 1 }, { name: 'downloadableFile', maxCount: 1 }]), (req, res) => {
    const { title, software } = req.body;
    const thumbnailFile = req.files.thumbnailFile[0];
    const downloadableFile = req.files.downloadableFile[0];

    if (!title || !thumbnailFile || !downloadableFile) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const projects = readProjects();
    const newProject = {
        id: Date.now(),
        title,
        software,
        // Get the secure URLs directly from Cloudinary's response
        thumbnailURL: thumbnailFile.path,
        downloadableURL: downloadableFile.path,
        downloadableFileName: downloadableFile.originalname,
        downloadableFileType: downloadableFile.mimetype,
        // Store cloudinary public_ids so we can delete them later
        thumbnail_id: thumbnailFile.filename,
        downloadable_id: downloadableFile.filename
    };
    
    projects.push(newProject);
    writeProjects(projects);
    res.status(201).json(newProject);
});

app.delete('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    let projects = readProjects();
    const projectToDelete = projects.find(p => p.id == id);

    if (!projectToDelete) {
        return res.status(404).json({ message: 'Project not found.' });
    }

    try {
        // Delete files from Cloudinary
        await cloudinary.uploader.destroy(projectToDelete.thumbnail_id, { resource_type: "image" });
        await cloudinary.uploader.destroy(projectToDelete.downloadable_id, { resource_type: "raw" });

    } catch (err) {
        console.error("Error deleting files from Cloudinary:", err);
    }

    const updatedProjects = projects.filter(p => p.id != id);
    writeProjects(updatedProjects);
    res.status(200).json({ message: 'Project deleted successfully.' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});