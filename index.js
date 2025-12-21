let currentSong = new Audio();
let songs = [];
let currentlyPlayingIndex = -1;
let isShuffle = false;
let isRepeat = false;
let songStates = {};
async function getSongs(folder) {
    try {
        let a = await fetch(`http://127.0.0.1:3000/assets/${folder}/`);
        let response = await a.text();

        let div = document.createElement("div");
        div.innerHTML = response;

        let as = div.getElementsByTagName("a");
        songs = [];

        for (let i = 0; i < as.length; i++) {
            const element = as[i];
            let href = element.href;
            let normalizedHref = decodeURIComponent(href).replace(/\\/g, "/");

            if (normalizedHref.endsWith(".mp3")) {
                // Ensure we get the full valid URL or path
                songs.push(normalizedHref);
            }
        }

        // Update Player Image to Playlist Cover
        // We assume cover is info.json's cover value, but we need to fetch info.json first
        try {
            let infoResponse = await fetch(`http://127.0.0.1:3000/assets/${folder}/info.json`);
            let info = await infoResponse.json();
            const playerImg = document.querySelector(".left-playing-song img");
            if (playerImg && info.cover) {
                // Check if cover is http or relative
                if (info.cover.startsWith("http")) {
                    playerImg.src = info.cover;
                } else {
                    playerImg.src = `http://127.0.0.1:3000/assets/${folder}/${info.cover}`;
                }
            }
        } catch (err) {
            console.log("No info.json or cover found for this folder", err);
        }

        const songUL = document.querySelector(".song-list ul");
        songUL.innerHTML = "";

        songs.forEach((song, idx) => {
            const name = extractFileName(song);
            songUL.innerHTML += `
                <li>
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

        document.querySelectorAll(".song-list li").forEach((li, i) => {
            li.addEventListener("click", () => {
                currentlyPlayingIndex = i;
                updateUIForPlaying();
                playMusic(songs[i], extractFileName(songs[i]));
            });
        });

        return songs;
    } catch (e) {
        console.error("Failed to fetch songs:", e);
        songs = [];
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
        songDisplay.style.display = "block";
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

async function displayPlaylists() {
    let a = await fetch(`http://127.0.0.1:3000/assets/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".right-content-cards");

    // Clear existing content 
    cardContainer.innerHTML = "";

    let array = Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
        const e = array[index];

        // Normalize backslashes and decode URI components to handle Windows paths
        let href = e.href;
        let normalizedHref = decodeURIComponent(href).replace(/\\/g, "/");

        // Use normalizedHref for checking inclusion
        if (normalizedHref.includes("/songs/") && !normalizedHref.includes(".htaccess")) {

            // Handle both absolute and relative paths robustly
            // Split by "/" and filter empty strings to handle trailing slashes
            let parts = normalizedHref.split("/").filter(part => part.length > 0);
            let folder = parts.pop();

            // Skip if it is the "songs" folder itself or parent dir
            if (folder === "songs" || folder === "assets") continue;

            let title = folder;
            let coverSrc = "https://i.scdn.co/image/ab67616d00001e029807367e712b4a7daf160a20"; // Default

            try {
                let a = await fetch(`http://127.0.0.1:3000/assets/songs/${folder}/info.json`);
                if (a.ok) {
                    let info = await a.json();
                    title = info.title || title;
                    if (info.cover) {
                        coverSrc = info.cover.startsWith("http") ? info.cover : `http://127.0.0.1:3000/assets/songs/${folder}/${info.cover}`;
                    }
                }
            } catch (err) {
                console.warn(`Could not load info for ${folder}, using defaults`, err);
            }

            cardContainer.innerHTML += `                        
                <div class="songs flex flex-direction-column" data-folder="${folder}">
                    <img src="${coverSrc}" alt="song">
                    <p class="song-name">${title}</p>
                </div>`;
        }
    }
}

async function main() {
    await getSongs("songs/adele");
    displayPlaylists();

    // UI Elements
    const playBtn = document.querySelector("#play");
    const seekBar = document.querySelector(".seekBar .seekBar-input");
    const volumeBar = document.querySelector(".volume .seekBar-input");
    const heart = document.querySelector(".fa-heart");
    const thumb = document.querySelector(".fa-thumbs-down");
    const shuffleBtn = document.querySelector("#shuffle");
    const repeatBtn = document.querySelector("#repeat");
    const volumeIcon = document.querySelector("#volumeIcon");

    // Initialize volume
    currentSong.volume = 0.5;
    if (volumeBar) volumeBar.value = 50;

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

    // Handle Song End
    currentSong.addEventListener("ended", () => {
        if (isRepeat) {
            currentSong.currentTime = 0;
            currentSong.play();
            return;
        }
        playNext();
    });

    // Volume Slider
    if (volumeBar) {
        volumeBar.addEventListener('input', () => {
            const volumeValue = volumeBar.value / 100;
            currentSong.volume = volumeValue;

            // Update volume icon
            if (volumeValue === 0) {
                volumeIcon.classList.replace("fa-volume-high", "fa-volume-xmark");
                volumeIcon.style.color = "gray";
            } else if (volumeValue < 0.5) {
                volumeIcon.classList.replace("fa-volume-xmark", "fa-volume-low");
                volumeIcon.style.color = "white";
            } else {
                volumeIcon.classList.replace("fa-volume-low", "fa-volume-high");
                volumeIcon.style.color = "white";
            }
        });
    }

    // Volume Icon Click (Mute/Unmute)
    volumeIcon.addEventListener("click", () => {
        if (currentSong.volume > 0) {
            currentSong.volume = 0;
            volumeIcon.classList.replace("fa-volume-high", "fa-volume-xmark");
            volumeIcon.style.color = "gray";
            if (volumeBar) volumeBar.value = 0;
        } else {
            currentSong.volume = 0.5;
            volumeIcon.classList.replace("fa-volume-xmark", "fa-volume-high");
            volumeIcon.style.color = "white";
            if (volumeBar) volumeBar.value = 50;
        }
    });

    // Seek Bar
    seekBar.addEventListener('input', () => {
        if (!isNaN(currentSong.duration) && currentSong.duration > 0) {
            const seekTo = (seekBar.value / 100) * currentSong.duration;
            currentSong.currentTime = seekTo;
        }
    });

    // Update seek bar during playback
    currentSong.addEventListener('timeupdate', () => {
        if (!isNaN(currentSong.duration) && currentSong.duration > 0) {
            const progress = (currentSong.currentTime / currentSong.duration) * 100;
            seekBar.value = progress;
            document.querySelector("#currentTime").textContent = formatTime(currentSong.currentTime);

            const progressBar = document.querySelector('.seekBar-progress-bar');
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
        }
    });

    // Like/Dislike functionality
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

    // Play/Pause button
    playBtn.addEventListener("click", () => {
        if (currentSong.paused) {
            if (currentlyPlayingIndex === -1 && songs.length > 0) {
                currentlyPlayingIndex = 0;
                playMusic(songs[0], extractFileName(songs[0]));
            } else {
                currentSong.play();
            }
            playBtn.classList.replace("fa-circle-play", "fa-circle-pause");

            if (currentlyPlayingIndex !== -1) {
                const activeItem = document.querySelectorAll(".song-list li")[currentlyPlayingIndex];
                if (activeItem) {
                    const icon = activeItem.querySelector(".play-now i");
                    if (icon) icon.classList.replace("fa-circle-play", "fa-circle-pause");
                }
            }
        } else {
            currentSong.pause();
            playBtn.classList.replace("fa-circle-pause", "fa-circle-play");

            document.querySelectorAll(".song-list li").forEach(li => {
                const icon = li.querySelector(".play-now i");
                if (icon) icon.classList.replace("fa-circle-pause", "fa-circle-play");
            });
        }
    });

    // Next/Previous buttons
    document.querySelector("#next").addEventListener("click", playNext);
    document.querySelector("#prev").addEventListener("click", playPrevious);

    // Playlist switching 
    document.querySelector(".right-content-cards").addEventListener('click', async (e) => {
        const songCard = e.target.closest('.songs[data-folder]');
        if (songCard) {
            const folder = songCard.dataset.folder;
            if (!folder) return;

            console.log("Switching to playlist:", folder);

            // Stop current playback
            currentSong.pause();
            currentSong.currentTime = 0;

            // Reset UI
            currentlyPlayingIndex = -1;
            playBtn.classList.replace("fa-circle-pause", "fa-circle-play");
            document.querySelector(".left-playing-song .head-box").textContent = "Select a Song";
            document.querySelector("#currentTime").textContent = "0:00";
            document.querySelector("#duration").textContent = "0:00";

            // Reset seek bar
            seekBar.value = 0;
            const progressBar = document.querySelector('.seekBar-progress-bar');
            if (progressBar) progressBar.style.width = "0%";

            // Load new playlist
            await getSongs(`songs/${folder}`);

            // Clear like/dislike state for new playlist
            songStates = {};

            // Reset like/dislike icons
            heart.classList.replace("fa-solid", "fa-regular");
            heart.style.color = "white";
            thumb.classList.replace("fa-solid", "fa-regular");
            thumb.style.color = "white";
        }
    });
}
main();