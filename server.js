const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

//app.get('/', (req, res) => {
// res.send('Portfolio API is running.');
//});


// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To parse JSON bodies
app.use(express.static('public')); // Serve static files from the 'public' directory

const PROJECTS_FILE = path.join(__dirname, 'projects.json');
const UPLOADS_DIR = path.join(__dirname, 'public/uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// --- Helper Functions ---
const readProjects = () => {
    if (!fs.existsSync(PROJECTS_FILE)) {
        return [];
    }
    const data = fs.readFileSync(PROJECTS_FILE);
    return JSON.parse(data);
};

const writeProjects = (projects) => {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
};

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        // Create a unique filename to avoid overwrites
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- API Routes ---

// GET all projects
app.get('/api/projects', (req, res) => {
    res.json(readProjects());
});

// POST a new project
// 'thumbnail' and 'downloadable' are the field names from the form
app.post('/api/projects', upload.fields([{ name: 'thumbnailFile' }, { name: 'downloadableFile' }]), (req, res) => {
    const { title, software } = req.body;
    
    if (!title || !req.files.thumbnailFile || !req.files.downloadableFile) {
        return res.status(400).json({ message: 'Title and both files are required.' });
    }

    const projects = readProjects();
    const newProject = {
        id: Date.now(),
        title,
        software,
        thumbnailURL: `/uploads/${req.files.thumbnailFile[0].filename}`,
        downloadableURL: `/uploads/${req.files.downloadableFile[0].filename}`,
        downloadableFileName: req.files.downloadableFile[0].originalname,
        downloadableFileType: req.files.downloadableFile[0].mimetype
    };

    projects.push(newProject);
    writeProjects(projects);

    res.status(201).json(newProject);
});

// DELETE a project
app.delete('/api/projects/:id', (req, res) => {
    const { id } = req.params;
    let projects = readProjects();
    const projectToDelete = projects.find(p => p.id == id);

    if (!projectToDelete) {
        return res.status(404).json({ message: 'Project not found.' });
    }

    try {
        // Delete files from server
        fs.unlinkSync(path.join(__dirname, 'public', projectToDelete.thumbnailURL));
        fs.unlinkSync(path.join(__dirname, 'public', projectToDelete.downloadableURL));
    } catch (err) {
        console.error("Error deleting project files:", err);
        // Don't stop the process, just log the error. The JSON entry will still be removed.
    }

    const updatedProjects = projects.filter(p => p.id != id);
    writeProjects(updatedProjects);

    res.status(200).json({ message: 'Project deleted successfully.' });
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});