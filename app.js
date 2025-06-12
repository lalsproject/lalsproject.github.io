// Data lagu dari file JSON
let songs = [];
let currentBook = 'KJ';
let filteredSongs = [];

// Fungsi untuk mengambil data dari file JSON
async function loadSongs(bookName) {
    try {
        const response = await fetch(`${bookName}.json`);
        const data = await response.json();
        songs = data;
        displaySongs(songs);
    } catch (error) {
        console.error('Error loading songs:', error);
        document.getElementById('songList').innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Error loading songs. Please try again later.</div>';
    }
}

// Fungsi untuk menampilkan daftar lagu
function displaySongs(songsToDisplay) {
    const songList = document.getElementById('songList');
    songList.innerHTML = '';
    filteredSongs = songsToDisplay; // Simpan urutan lagu yang sedang ditampilkan

    songsToDisplay.forEach(song => {
        const songElement = document.createElement('div');
        songElement.className = 'song-item';
        songElement.innerHTML = `
            <div class="song-info">
                <div class="song-title">${currentBook} ${song.code} - ${song.title}</div>
                <div class="song-details">
                    <span class="song-key">${song.keySignature}</span>
                </div>
            </div>
            <button class="view-button">Lihat Lirik</button>
        `;
        
        // Tambahkan event listener untuk menampilkan lirik
        songElement.querySelector('.view-button').addEventListener('click', () => showLyrics(song));
        
        songList.appendChild(songElement);
    });
}

let currentLyricsIndex = 0;
function showLyrics(song) {
    const modal = document.getElementById('lyricsModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMetadata = document.getElementById('modalMetadata');
    const modalLyrics = document.getElementById('modalLyrics');
    
    // Simpan index lagu yang sedang dibuka
    currentLyricsIndex = filteredSongs.findIndex(s => s.code === song.code);

    // Judul lagu
    modalTitle.textContent = `${currentBook} ${song.code} - ${song.title}`;
    
    // Info nada dan birama
    let metadataHtml = '';
    if (song.keySignature) {
        metadataHtml += `<div class="metadata-item">🎵 ${song.keySignature}</div>`;
    }
    if (song.timeSignature) {
        metadataHtml += `<div class="metadata-item">⏱️ ${song.timeSignature}</div>`;
    }

    // Tambahkan audio player jika tersedia
    if (currentBook === 'KJ' || currentBook === 'NKB' || currentBook === 'PKJ') {
        let codeNum = String(song.code).padStart(3, '0');
        let audioUrl = `https://media.sabda.org/gema/himne/${currentBook.toLowerCase()}/${currentBook}${codeNum}.mp3`;
        metadataHtml += `
            <div class="metadata-item" style="width: 100%; margin-top: 16px;">
                <audio controls style="width: 100%;">
                    <source src="${audioUrl}" type="audio/mpeg">
                    Browser Anda tidak mendukung audio player.
                </audio>
            </div>
        `;
    } else if (currentBook === 'NNBT') {
        let codeNum = String(song.code).padStart(1, '0');
        let audioUrl = `https://boafiles.kejut.com/addon/audio/songs/v2/NNBT_${codeNum}.mp3`;
        metadataHtml += `
            <div class="metadata-item" style="width: 100%; margin-top: 16px;">
                <audio controls style="width: 100%;">
                    <source src="${audioUrl}" type="audio/mpeg">
                    Browser Anda tidak mendukung audio player.
                </audio>
            </div>
        `;
    }
    
    modalMetadata.innerHTML = metadataHtml;
    
    // Layout lirik
    let lyricsHtml = '';
    song.lyrics.forEach((section, sectionIdx) => {
        // Label versi jika ada lebih dari satu section
        if (song.lyrics.length > 1) {
            lyricsHtml += `<div class="lyrics-section-label">VERSI ${sectionIdx + 1}</div>`;
        }
        
        section.verses.forEach((verse, verseIdx) => {
            if (verse.kind === 'REFRAIN') {
                lyricsHtml += `
                    <div class="lyrics-section-label">Refrein</div>
                    <div class="lyrics-verse">
                        <div class="lyrics-lines lyrics-refrain-lines">
                            ${verse.lines.map(line => `<div class="lyrics-line">${line}</div>`).join('')}
                        </div>
                    </div>
                `;
            } else {
                lyricsHtml += `
                    <div class="lyrics-verse">
                        <div class="lyrics-verse-number">${verse.ordering}</div>
                        <div class="lyrics-lines">
                            ${verse.lines.map(line => `<div class="lyrics-line">${line}</div>`).join('')}
                        </div>
                    </div>
                `;
            }
        });
    });
    
    modalLyrics.innerHTML = lyricsHtml;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Scroll ke atas modal
    modal.scrollTop = 0;
}

// Fungsi untuk menutup modal
function closeModal() {
    const modal = document.getElementById('lyricsModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Mengaktifkan kembali scroll pada body
    // Hapus elemen audio agar audio berhenti
    const modalMetadata = document.getElementById('modalMetadata');
    if (modalMetadata) {
        modalMetadata.innerHTML = '';
    }
}

// Event listener untuk tombol close modal
document.getElementById('closeModal').addEventListener('click', closeModal);

// Event listener untuk menutup modal ketika mengklik di luar modal
window.addEventListener('click', (e) => {
    const modal = document.getElementById('lyricsModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Fungsi pencarian
function searchSongs(query) {
    const filteredSongs = songs.filter(song => 
        song.title.toLowerCase().includes(query.toLowerCase()) ||
        song.code.includes(query) || currentBook.includes(query)
    );
    displaySongs(filteredSongs);
}

// Event listener untuk input pencarian
document.getElementById('searchInput').addEventListener('input', (e) => {
    searchSongs(e.target.value);
});

// =====================
// FUNGSI PINCH/ZOOM LIRIK
// =====================
let lyricsFontSize = parseFloat(localStorage.getItem('lyricsFontSize')) || 1.1; // em
function applyLyricsFontSize() {
    const modalLyrics = document.getElementById('modalLyrics');
    modalLyrics.style.fontSize = lyricsFontSize + 'em';
}

// Pinch gesture (mobile)
let lastDistance = null;
const modalLyrics = document.getElementById('modalLyrics');
modalLyrics.addEventListener('touchstart', function(e) {
    if (e.touches.length === 2) {
        e.preventDefault(); // Cegah zoom default browser
        lastDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
    }
}, { passive: false });
modalLyrics.addEventListener('touchmove', function(e) {
    if (e.touches.length === 2 && lastDistance !== null) {
        e.preventDefault(); // Cegah zoom default browser
        const newDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = newDistance - lastDistance;
        if (Math.abs(diff) > 5) {
            if (diff > 0) {
                lyricsFontSize = Math.min(lyricsFontSize + 0.05, 2.5);
            } else {
                lyricsFontSize = Math.max(lyricsFontSize - 0.05, 0.7);
            }
            localStorage.setItem('lyricsFontSize', lyricsFontSize);
            applyLyricsFontSize();
            lastDistance = newDistance;
        }
    }
}, { passive: false });
modalLyrics.addEventListener('touchend', function(e) {
    if (e.touches.length < 2) {
        lastDistance = null;
    }
});

// Ctrl + scroll (desktop)
modalLyrics.addEventListener('wheel', function(e) {
    if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
            lyricsFontSize = Math.min(lyricsFontSize + 0.05, 2.5);
        } else {
            lyricsFontSize = Math.max(lyricsFontSize - 0.05, 0.7);
        }
        localStorage.setItem('lyricsFontSize', lyricsFontSize);
        applyLyricsFontSize();
    }
}, { passive: false });

// =====================
// END FUNGSI PINCH/ZOOM
// =====================

// Dark mode toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

function toggleTheme() {
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        themeToggle.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.setAttribute('data-theme', 'dark');
    themeToggle.textContent = '☀️';
}

themeToggle.addEventListener('click', toggleTheme);

// Tab menu handling
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        tab.classList.add('active');
        // Load songs for selected book
        currentBook = tab.getAttribute('data-book');
        loadSongs(currentBook);
    });
});

// Set tab aktif ke KJ saat load pertama
window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab').forEach(tab => {
        if (tab.getAttribute('data-book') === 'KJ') {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
});

// Load initial songs
loadSongs(currentBook);

// SWIPE HANDLER UNTUK MODAL LIRIK
let startX = null;
let isSwiping = false;
modalLyrics.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        isSwiping = true;
    }
}, { passive: true });
modalLyrics.addEventListener('touchmove', function(e) {
    if (!isSwiping || e.touches.length !== 1) return;
    // Tidak perlu mencegah default agar scroll vertikal tetap bisa
}, { passive: true });
modalLyrics.addEventListener('touchend', function(e) {
    if (!isSwiping || startX === null) return;
    const endX = e.changedTouches[0].clientX;
    const diffX = endX - startX;
    if (Math.abs(diffX) > 60) {
        if (diffX < 0) {
            // Swipe kiri: lagu berikutnya
            showNextLyrics();
        } else {
            // Swipe kanan: lagu sebelumnya
            showPrevLyrics();
        }
    }
    startX = null;
    isSwiping = false;
});

function showNextLyrics() {
    if (currentLyricsIndex < filteredSongs.length - 1) {
        showLyrics(filteredSongs[currentLyricsIndex + 1]);
    }
}
function showPrevLyrics() {
    if (currentLyricsIndex > 0) {
        showLyrics(filteredSongs[currentLyricsIndex - 1]);
    }
} 