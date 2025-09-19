document.addEventListener('DOMContentLoaded', () => {
    // Login elements
    const loginContainer = document.getElementById('login-container');
    const loginForm = document.getElementById('login-form');
    // ... (rest of login elements are the same)

    // Admin panel elements
    const adminPanel = document.getElementById('admin-panel');
    const logoutButton = document.getElementById('logout-button');
    const thumbnailFileEl = document.getElementById('thumbnailFile');
    const downloadableFileEl = document.getElementById('downloadableFile');
    const titleEl = document.getElementById('projectTitle');
    const softwareEl = document.getElementById('projectSoftware');
    const uploadButton = document.getElementById('uploadButton');
    const adminProjectGrid = document.getElementById('adminProjectGrid');

    let projects = JSON.parse(localStorage.getItem('portfolioProjects')) || [];
    let editingProjectId = null;

    // --- LOGIN LOGIC (Same as before) ---
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    function checkLogin(){if(sessionStorage.getItem("isAdminLoggedIn")==="true"){loginContainer.style.display="none";adminPanel.style.display="block";renderAdminProjects()}else{loginContainer.style.display="flex";adminPanel.style.display="none"}}
    loginForm.addEventListener("submit",e=>{e.preventDefault();const t=usernameInput.value,o=passwordInput.value;"admin"===t&&"123"===o?(sessionStorage.setItem("isAdminLoggedIn","true"),checkLogin()):(loginError.textContent="Invalid username or password.",setTimeout(()=>{loginError.textContent=""},3e3))});
    logoutButton.addEventListener("click",()=>{sessionStorage.removeItem("isAdminLoggedIn");checkLogin()});

    const readFileAsDataURL = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };
    
    function renderAdminProjects() {
        adminProjectGrid.innerHTML = '';
        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <div class="project-thumbnail">
                    <img src="${project.thumbnailURL}" alt="${project.title} Thumbnail">
                </div>
                <div class="project-info">
                    <h3>${project.title}</h3>
                    <div class="project-actions">
                        <button class="edit-btn"><i class="fas fa-edit"></i> Edit</button>
                        <button class="delete-btn"><i class="fas fa-trash-alt"></i> Delete</button>
                    </div>
                </div>
            `;
            adminProjectGrid.appendChild(card);
            card.querySelector('.edit-btn').addEventListener('click', () => handleEdit(project));
            card.querySelector('.delete-btn').addEventListener('click', () => handleDelete(project.id));
        });
    }

    function handleEdit(project) {
        titleEl.value = project.title;
        softwareEl.value = project.software || '';
        editingProjectId = project.id;
        uploadButton.textContent = 'Save Changes';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        alert('Editing: Change any field. New files are only required if you want to replace the existing ones.');
    }

    function handleDelete(projectId) {
        if (confirm('Are you sure you want to delete this project?')) {
            projects = projects.filter(p => p.id !== projectId);
            saveAndRerender();
        }
    }

    uploadButton.addEventListener('click', async () => {
        const title = titleEl.value.trim();
        const software = softwareEl.value.trim();
        const thumbFile = thumbnailFileEl.files[0];
        const downloadFile = downloadableFileEl.files[0];

        if (!title) {
            alert('A project title is required.');
            return;
        }

        let projectData = {};

        if (editingProjectId) {
            projectData = projects.find(p => p.id === editingProjectId);
        } else {
            // For new projects, BOTH files are required
            if (!thumbFile || !downloadFile) {
                alert('Both a thumbnail image and a downloadable file are required for new projects.');
                return;
            }
        }
        
        try {
            // Update text fields
            projectData.title = title;
            projectData.software = software;

            // If a new thumbnail is provided, update it
            if (thumbFile) {
                projectData.thumbnailURL = await readFileAsDataURL(thumbFile);
            }

            // If a new downloadable file is provided, update it
            if (downloadFile) {
                projectData.downloadableURL = await readFileAsDataURL(downloadFile);
                projectData.downloadableFileType = downloadFile.type;
                projectData.downloadableFileName = downloadFile.name;
            }

            if (editingProjectId) {
                projects = projects.map(p => p.id === editingProjectId ? projectData : p);
            } else {
                projectData.id = Date.now();
                projects.push(projectData);
            }

            saveAndRerender();
            resetForm();
        } catch (error) {
            console.error("Error reading file:", error);
            alert("There was an error processing your files.");
        }
    });

    function saveAndRerender() {
        localStorage.setItem('portfolioProjects', JSON.stringify(projects));
        renderAdminProjects();
    }

    function resetForm() {
        thumbnailFileEl.value = '';
        downloadableFileEl.value = '';
        titleEl.value = '';
        softwareEl.value = '';
        editingProjectId = null;
        uploadButton.textContent = 'Upload Project';
    }

    checkLogin();
});