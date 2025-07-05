// GitHub API configuration
const GITHUB_API = 'https://api.github.com';
let GITHUB_TOKEN = '';
let GITHUB_REPO = '';

// Initialize from .env file
function initializeGitHub() {
    // In a real application, you would load these from a .env file
    // For now, we'll use localStorage
    GITHUB_TOKEN = localStorage.getItem('GITHUB_TOKEN') || '';
    GITHUB_REPO = localStorage.getItem('GITHUB_REPO') || '';
}

// Upload video to GitHub
async function uploadVideoToGitHub(file, title, description) {
    if (!GITHUB_TOKEN || !GITHUB_REPO) {
        throw new Error('GitHub Token oder Repository nicht konfiguriert!');
    }

    const [owner, repo] = GITHUB_REPO.split('/');
    const timestamp = Date.now();
    const filename = `videos/${timestamp}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;

    // Convert file to base64
    const fileBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));

    try {
        // Create blob
        const blobResponse = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/blobs`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: base64,
                encoding: 'base64'
            })
        });

        if (!blobResponse.ok) {
            throw new Error('Konnte Blob nicht erstellen');
        }

        const blobData = await blobResponse.json();

        // Create tree entry
        const treeResponse = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/trees`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tree: [{
                    path: filename,
                    mode: '100644',
                    type: 'blob',
                    sha: blobData.sha
                }]
            })
        });

        if (!treeResponse.ok) {
            throw new Error('Konnte Tree nicht erstellen');
        }

        const treeData = await treeResponse.json();

        // Get latest commit
        const latestCommitResponse = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs/heads/main`);
        const latestCommitData = await latestCommitResponse.json();

        // Create new commit
        const commitResponse = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/commits`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Upload video: ${title}`,
                tree: treeData.sha,
                parents: [latestCommitData.object.sha]
            })
        });

        if (!commitResponse.ok) {
            throw new Error('Konnte Commit nicht erstellen');
        }

        const commitData = await commitResponse.json();

        // Update reference
        await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs/heads/main`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sha: commitData.sha
            })
        });

        return {
            id: timestamp,
            title: title,
            description: description,
            url: `https://raw.githubusercontent.com/${owner}/${repo}/main/${filename}`,
            uploadedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('GitHub Upload Error:', error);
        throw error;
    }
}

// Get all videos from GitHub
async function getVideosFromGitHub() {
    if (!GITHUB_REPO) return [];

    try {
        const [owner, repo] = GITHUB_REPO.split('/');
        const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/videos`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error('Konnte Videos nicht laden');
        }

        const files = await response.json();
        return files
            .filter(file => file.name.endsWith('.mp4'))
            .map(file => ({
                id: file.name.split('_')[0],
                title: file.name.replace(/^[0-9]+_/, '').replace(/\.mp4$/, ''),
                url: file.download_url,
                uploadedAt: file.name.split('_')[0]
            }));
    } catch (error) {
        console.error('Error fetching videos:', error);
        return [];
    }
}

export { initializeGitHub, uploadVideoToGitHub, getVideosFromGitHub };
