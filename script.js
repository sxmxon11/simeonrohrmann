// Video storage (in real application, this would be a backend database)
let videos = [];

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const uploadForm = document.getElementById('uploadForm');
const videoGrid = document.getElementById('videoGrid');

// Toggle upload modal
uploadBtn.addEventListener('click', () => {
    uploadModal.style.display = 'block';
});

// Close upload modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === uploadModal) {
        uploadModal.style.display = 'none';
    }
});

// Handle video upload
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const file = document.getElementById('videoFile').files[0];
    const title = document.getElementById('videoTitle').value;
    const description = document.getElementById('videoDescription').value;

    if (!file) {
        alert('Bitte wähle ein Video aus!');
        return;
    }

    // File validation
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
        alert('Video ist zu groß! Bitte wähle ein Video unter 100MB aus.');
        return;
    }

    if (!['video/mp4', 'video/webm', 'video/ogg'].includes(file.type)) {
        alert('Nur MP4, WebM und OGG Videos sind erlaubt!');
        return;
    }

    if (!title.trim()) {
        alert('Bitte gib einen Titel für das Video an!');
        return;
    }

    try {
        const video = await processVideoUpload(file, title, description);
        videos.push(video);
        updateVideoGrid();
        uploadModal.style.display = 'none';
        uploadForm.reset();
        alert('Video wurde erfolgreich hochgeladen!');
    } catch (error) {
        console.error('Upload failed:', error);
        alert('Video konnte nicht hochgeladen werden: ' + error.message);
    }
});

// Process video upload
async function processVideoUpload(file, title, description) {
    return new Promise((resolve, reject) => {
        try {
            // In a real application, this would upload to a server
            // Here we'll just create a mock video object
            const video = {
                id: Date.now(),
                title: title,
                description: description,
                url: URL.createObjectURL(file),
                thumbnail: createThumbnail(file),
                uploadedAt: new Date().toISOString()
            };
            resolve(video);
        } catch (error) {
            reject(error);
        }
    });
}

// Create thumbnail from video
async function createThumbnail(videoFile) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(videoFile);
        video.onloadedmetadata = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 180;
            const ctx = canvas.getContext('2d');
            video.currentTime = 0;
            video.onseeked = () => {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg'));
            };
        };
    });
}

// Update video grid
function updateVideoGrid() {
    videoGrid.innerHTML = '';
    
    videos.slice(0, 12).forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.innerHTML = `
            <div class="video-thumbnail" style="background-image: url('${video.thumbnail}')"></div>
            <div class="video-info">
                <h3>${video.title}</h3>
                <p>${video.description}</p>
                <div class="video-meta">
                    <span>${formatDate(video.uploadedAt)}</span>
                </div>
            </div>
        `;
        videoCard.addEventListener('click', () => playVideo(video));
        videoGrid.appendChild(videoCard);
    });
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Search functionality
searchBtn.addEventListener('click', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredVideos = videos.filter(video => 
        video.title.toLowerCase().includes(searchTerm) ||
        video.description.toLowerCase().includes(searchTerm)
    );
    videos = filteredVideos;
    updateVideoGrid();
});

// Play video function
function playVideo(video) {
    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.innerHTML = `
        <div class="video-player">
            <video controls>
                <source src="${video.url}" type="video/mp4">
                Dein Browser unterstützt kein Video.
            </video>
            <div class="video-details">
                <h2>${video.title}</h2>
                <p>${video.description}</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Initialize
loadFromLocalStorage();

// Add event listeners
uploadBtn.addEventListener('click', () => {
    uploadModal.style.display = 'block';
});

// Load videos when GitHub API is initialized
initializeGitHub().then(() => {
    loadVideos();
});

searchBtn.addEventListener('click', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredVideos = videos.filter(video => 
        video.title.toLowerCase().includes(searchTerm) ||
        video.description.toLowerCase().includes(searchTerm)
    );
    videos = filteredVideos;
    updateVideoGrid();
});

// Update video grid
function updateVideoGrid() {
    videoGrid.innerHTML = '';
    
    videos.slice(0, 12).forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.innerHTML = `
            <div class="video-thumbnail" style="background-image: url('${video.thumbnail}')"></div>
            <div class="video-info">
                <h3>${video.title}</h3>
                <p>${video.description}</p>
                <div class="video-meta">
                    <span>${formatDate(video.uploadedAt)}</span>
                </div>
            </div>
        `;
        videoCard.addEventListener('click', () => playVideo(video));
        videoGrid.appendChild(videoCard);
    });
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Play video function
function playVideo(video) {
    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.innerHTML = `
        <div class="video-player">
            <video controls>
                <source src="${video.url}" type="video/mp4">
                Dein Browser unterstützt kein Video.
            </video>
            <div class="video-details">
                <h2>${video.title}</h2>
                <p>${video.description}</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}
