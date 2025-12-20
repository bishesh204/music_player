let currentSong = new Audio();
let songs = [];
let currentlyPlayingIndex = -1;
let isShuffle = false;
let isRepeat = false;
let songStates = {}; // Stores { liked: boolean, disliked: boolean } per song URL

/**
 * Fetches the list of songs from the local server
 */
async function getSongs() {
    try {
        let a = await fetch("http://127.0.0.1:3000/assets/songs/");
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");
        let songList = [];
        for (let i = 0; i < as.length; i++) {
            if (as[i].href.endsWith(".mp3")) {
                songList.push(as[i].href);
            }
        }
        return songList;
    } catch (e) {
        console.error("Failed to fetch songs:", e);
        return [];
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Robustly extracts and cleans filename from URL
 */
function extractFileName(songUrl) {
    try {
        let decoded = decodeURIComponent(songUrl);
        // Remove trailing slash if it exists
        if (decoded.endsWith('/')) decoded = decoded.slice(0, -1);
        // Get the last part of the path
        let fileName = decoded.split('/').pop();
        // Remove file extension and any path noise
        return fileName.replace('.mp3', '').split('\\').pop().split('/').pop();
    } catch (e) {
        return "Unknown Track";
    }
}

function updateLikeDislikeUI(songUrl) {
    const heart = document.querySelector(".fa-heart");
    const thumb = document.querySelector(".fa-thumbs-down");
    const state = songStates[songUrl] || { liked: false, disliked: false };

    if (state.liked) {
        heart.classList.replace("fa-regular", "fa-solid");
        heart.style.color = "#1ed760";
    } else {
        heart.classList.replace("fa-solid", "fa-regular");
        heart.style.color = "white";
    }

    if (state.disliked) {
        thumb.classList.replace("fa-regular", "fa-solid");
        thumb.style.color = "#ff5555";
    } else {
        thumb.classList.replace("fa-solid", "fa-regular");
        thumb.style.color = "white";
    }
}

function playMusic(songUrl, fileName) {
    currentSong.src = songUrl;

    // Explicitly update the text in the player bar
    const songDisplay = document.querySelector(".left-playing-song .head-box");
    if (songDisplay) {
        songDisplay.textContent = fileName;
        songDisplay.style.display = "block"; // Ensure it's not hidden
    }

    updateLikeDislikeUI(songUrl);
    currentSong.play();

    currentSong.onloadedmetadata = () => {
        document.querySelector("#duration").textContent = formatTime(currentSong.duration);
    };
}

function playNext() {
    if (songs.length === 0) return;

    if (isShuffle) {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * songs.length);
        } while (newIndex === currentlyPlayingIndex && songs.length > 1);
        currentlyPlayingIndex = newIndex;
    } else {
        currentlyPlayingIndex = (currentlyPlayingIndex + 1) % songs.length;
    }

    updateUIForPlaying();
    playMusic(songs[currentlyPlayingIndex], extractFileName(songs[currentlyPlayingIndex]));
}

function playPrevious() {
    if (songs.length === 0) return;
    currentlyPlayingIndex = (currentlyPlayingIndex - 1 + songs.length) % songs.length;
    updateUIForPlaying();
    playMusic(songs[currentlyPlayingIndex], extractFileName(songs[currentlyPlayingIndex]));
}

function updateUIForPlaying() {
    document.querySelectorAll(".song-list li").forEach(li => {
        const icon = li.querySelector(".play-now i");
        if (icon) icon.classList.replace("fa-circle-pause", "fa-circle-play");
    });

    if (currentlyPlayingIndex !== -1) {
        const activeItem = document.querySelectorAll(".song-list li")[currentlyPlayingIndex];
        if (activeItem) {
            const icon = activeItem.querySelector(".play-now i");
            if (icon) icon.classList.replace("fa-circle-play", "fa-circle-pause");
        }
    }
    document.querySelector("#play").classList.replace("fa-circle-play", "fa-circle-pause");
}

async function main() {
    songs = await getSongs();
    let songUL = document.querySelector(".song-list ul");
    songUL.innerHTML = "";

    songs.forEach((song, idx) => {
        const name = extractFileName(song);
        songUL.innerHTML += `<li>
            <div class="flex gap-35 align-items">
                <i class="fa-solid fa-music"></i>
                <div class="info">
                    <div class="song-name-label" style="font-weight:bold">${name}</div>
                    <div style="font-size:12px; color:gray">Local Library</div>
                </div>
            </div>
            <div class="play-now">
                <i class="fa-regular fa-circle-play"></i>
            </div>
        </li>`;
    });

    const playBtn = document.querySelector("#play");
    const seekBar = document.querySelector(".seekBar .seekBar-input");
    const volumeBar = document.querySelector(".volume .seekBar-input");
    const heart = document.querySelector(".fa-heart");
    const thumb = document.querySelector(".fa-thumbs-down");
    const shuffleBtn = document.querySelector("#shuffle");
    const repeatBtn = document.querySelector("#repeat");

    // Shuffle Toggle
    shuffleBtn.addEventListener("click", () => {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle("active", isShuffle);
    });

    // Repeat Toggle
    repeatBtn.addEventListener("click", () => {
        isRepeat = !isRepeat;
        repeatBtn.classList.toggle("active", isRepeat);
    });

    // Handle Song End (Shuffle/Repeat Logic)
    currentSong.addEventListener('ended', () => {
        if (isRepeat) {
            currentSong.currentTime = 0;
            currentSong.play();
        } else {
            playNext();
        }
    });

    document.querySelectorAll(".song-list li").forEach((li, i) => {
        li.addEventListener("click", () => {
            currentlyPlayingIndex = i;
            updateUIForPlaying();
            playMusic(songs[i], extractFileName(songs[i]));
        });
    });

    // UPDATED SEEKBAR FUNCTIONALITY
    seekBar.addEventListener('input', () => {
        if (!isNaN(currentSong.duration) && currentSong.duration > 0) {
            const seekTo = (seekBar.value / 100) * currentSong.duration;
            currentSong.currentTime = seekTo;

            // Immediate visual feedback during drag
            const progressBar = document.querySelector('.seekBar-progress-bar');
            if (progressBar) {
                progressBar.style.width = seekBar.value + '%';
            }
        }
    });

    currentSong.addEventListener('timeupdate', () => {
        if (!isNaN(currentSong.duration)) {
            const progress = (currentSong.currentTime / currentSong.duration) * 100;
            seekBar.value = progress;
            document.querySelector("#currentTime").textContent = formatTime(currentSong.currentTime);
            const progressBar = document.querySelector('.seekBar-progress-bar');
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
        }
    });

    // Inside main() function:
    const volumeIcon = document.querySelector("#volumeIcon");

    volumeIcon.addEventListener("click", () => {
        if (currentSong.volume > 0) {
            currentSong.volume = 0;
            volumeIcon.classList.replace("fa-volume-high", "fa-volume-xmark");
            volumeIcon.style.color = "gray";
        } else {
            currentSong.volume = 1.0; // Restore to full volume
            volumeIcon.classList.replace("fa-volume-xmark", "fa-volume-high");
            volumeIcon.style.color = "white";
        }
    });

    heart.addEventListener("click", () => {
        if (currentlyPlayingIndex === -1) return;
        let url = songs[currentlyPlayingIndex];
        if (!songStates[url]) songStates[url] = { liked: false, disliked: false };
        songStates[url].liked = !songStates[url].liked;
        if (songStates[url].liked) songStates[url].disliked = false;
        updateLikeDislikeUI(url);
    });

    thumb.addEventListener("click", () => {
        if (currentlyPlayingIndex === -1) return;
        let url = songs[currentlyPlayingIndex];
        if (!songStates[url]) songStates[url] = { liked: false, disliked: false };
        songStates[url].disliked = !songStates[url].disliked;
        if (songStates[url].disliked) songStates[url].liked = false;
        updateLikeDislikeUI(url);
    });

    playBtn.addEventListener("click", () => {
        if (currentSong.paused) {
            if (currentlyPlayingIndex === -1) {
                currentlyPlayingIndex = 0;
                playMusic(songs[0], extractFileName(songs[0]));
            } else {
                currentSong.play();
            }
            updateUIForPlaying();
        } else {
            currentSong.pause();
            playBtn.classList.replace("fa-circle-pause", "fa-circle-play");
        }
    });

    document.querySelector("#next").addEventListener("click", playNext);
    document.querySelector("#prev").addEventListener("click", playPrevious);
}

main();