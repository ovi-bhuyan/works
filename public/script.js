document.addEventListener('DOMContentLoaded', () => {
    const projectGrid = document.getElementById('projectGrid');
    const projectModal = document.getElementById('projectModal');
    const closeButton = document.querySelector('.close-button');
    const modalTitle = document.getElementById('modalTitle');
    const modalPreview = document.getElementById('modalPreview');
    const downloadButton = document.getElementById('downloadButton');

    const projects = JSON.parse(localStorage.getItem('portfolioProjects')) || [];

    function getFileIconClass(type) {
        if (type.includes('word')) return 'fa-file-word';
        if (type.includes('powerpoint')) return 'fa-file-powerpoint';
        if (type.includes('excel')) return 'fa-file-excel';
        if (type.includes('pdf')) return 'fa-file-pdf';
        // Fallback for other non-image/pdf downloadable types
        return 'fa-file-zipper'; 
    }

    function renderProjects() {
        projectGrid.innerHTML = '';
        if (projects.length === 0) {
            projectGrid.innerHTML = '<p class="subtitle" style="grid-column: 1 / -1;">No projects have been uploaded yet.</p>';
            return;
        }

        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            
            // Thumbnail is now always the user-uploaded thumbnailURL
            const thumbnailContent = `<img src="${project.thumbnailURL}" alt="${project.title} Thumbnail">`;

            const softwareInfo = project.software
                ? `<p class="project-software"><i class="fas fa-microchip"></i> ${project.software}</p>`
                : '';

            projectCard.innerHTML = `
                <div class="project-thumbnail">${thumbnailContent}</div>
                <div class="project-info">
                    <h3>${project.title}</h3>
                    ${softwareInfo}
                </div>
            `;
            projectGrid.appendChild(projectCard);
            projectCard.addEventListener('click', () => openModal(project));
        });
    }

    function openModal(project) {
        modalTitle.textContent = project.title;
        modalPreview.innerHTML = '';
        const fileType = project.downloadableFileType;

        // The modal preview is based on the DOWNLOADABLE file's type
        if (fileType.startsWith('image/')) {
            modalPreview.innerHTML = `<img src="${project.downloadableURL}" alt="${project.title}">`;
        } else if (fileType === 'application/pdf') {
            modalPreview.innerHTML = `<iframe src="${project.downloadableURL}"></iframe>`;
        } else {
            // For Word, Excel, etc., show an icon
            modalPreview.innerHTML = `<i class="fas ${getFileIconClass(fileType)} file-icon-large"></i>`;
        }
        
        downloadButton.href = project.downloadableURL;
        downloadButton.download = project.downloadableFileName;

        projectModal.style.display = 'flex';
    }

    function closeModal() {
        projectModal.style.display = 'none';
    }

    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === projectModal) closeModal();
    });

    renderProjects();
});