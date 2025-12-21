# Spotify Clone

A dynamic, local music player web application that mimics the Spotify interface.

## Features
-   **Dynamic Playlist Loading**: Automatically scans the `assets/songs` folder for music and playlists. No code changes required to add music!
-   **Responsive Design**: Modern, responsive UI similar to Spotify.
-   **Playback Controls**: Play, pause, next, previous, shuffle, and repeat functionality.
-   **Metadata Support**: Displays song titles and cover art from `info.json` files.

## Setup and Usage

### Prerequisites
-   Node.js installed (for `npx`).

### Running the App
1.  Open a terminal in the project directory.
2.  Start the local server:
    ```bash
    npx http-server -p 3000 --cors
    ```
3.  Open your browser and navigate to:
    `http://127.0.0.1:3000/index.html`

## How to Add Music
1.  Navigate to `assets/songs`.
2.  Create a new folder (e.g., `my_playlist`).
3.  Add `.mp3` files to that folder.
4.  (Optional) Add an `info.json` file for custom cover art and title:
    ```json
    {
      "title": "My Playlist",
      "cover": "cover.jpg"
    }
    ```
5.  Refresh the web page.

## Technologies
-   HTML5, CSS3, JavaScript (Vanilla)
-   `http-server` for local hosting
