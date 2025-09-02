#  Tic-Tac-Toe 🎮

![Status](https://img.shields.io/badge/status-complete-brightgreen)
![Tech](https://img.shields.io/badge/tech-HTML%20%7C%20CSS%20%7C%20JS-blue)
![Networking](https://img.shields.io/badge/networking-PeerJS%20%7C%20WebRTC-orange)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

A real-time, peer-to-peer (P2P) Tic-Tac-Toe game that runs entirely in the browser. This project leverages the power of WebRTC and PeerJS to connect two players directly without the need for a centralized game server, offering a fast, private, and cost-effective multiplayer experience.

---

### **Live Demo**

**➡️ [Play the live version here!](https://surya-kaliappan.github.io/tic_tac_toe/)**

---

## **Key Features ✨**

-   **Real-Time P2P Gameplay:** Moves are synchronized instantly between players using a direct WebRTC data channel.
-   **Serverless Matchmaking:** Uses the PeerJS public signaling server to connect players via simple, shareable 6-character room codes.
-   **Dynamic UI:** A responsive, single-page application with distinct screens for naming, lobby, and gameplay.
-   **Elegant Glassmorphism Design:** A modern, visually appealing interface with a "glass" and chalkboard aesthetic.
-   **Randomized Start:** The starting player ('X' or 'O') is randomly assigned for each new game to ensure fairness.
-   **Interactive Feedback:**
    -   Visual indicator (glowing panel) for the active player's turn.
    -   Glowing animation on the winning cells.
    -   Custom pop-up modals for game results and confirmations.
-   **Full Game Flow:** Includes "Play Again" functionality with a two-way confirmation system and a "Leave Game" option.
-   **Robust Error & Disconnect Handling:** Gracefully handles player disconnects and provides feedback for connection errors.
-   **Fully Responsive:** Looks and works great on both desktop and mobile devices.

---

## **Technology Stack 🛠️**

-   **Front-End:**
    -   **HTML5:** For the core structure.
    -   **CSS3:** For styling, featuring Flexbox, Grid, Custom Properties, and responsive media queries.
    -   **Vanilla JavaScript (ES6+):** For all application logic, structured into UI and app logic modules.
-   **Networking:**
    -   **WebRTC:** The underlying browser technology for establishing the peer-to-peer data connection.
    -   **PeerJS:** A library that simplifies WebRTC implementation and provides a free signaling server for matchmaking.
-   **Hosting:**
    -   **GitHub Pages:** For hosting the static web application.

---

## **Project Structure 📁**

The project is organized into a clean, modular structure for better readability and maintenance.
```
.
├── index.html         # The main HTML file for the application structure.
├── style.css          # All styling, including the theme and responsiveness.
├── ui.js              # Handles all DOM manipulation and UI updates.
├── app.js             # Core application logic, game state, and networking.
└── peer.min.js        # The local copy of the PeerJS library.
```

---

## **How to Run Locally 🚀**

To run this project on your local machine, follow these simple steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Surya-Kaliappan/tic_tac_toe
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd tic_tac_toe
    ```

3.  **Open the source code :**
    - This project could be served by a local web server or opened as a direct `file:///...` URL, but network is need for reaching the signalling server. 
    - For local web server by use the **Live Server** extension in Visual Studio Code.
      -   Install the "Live Server" extension.
      -   Right-click on `index.html` in the file explorer.
      -   Select "Open with Live Server".

4.  **Play the Game:**
    -   If using **`Live Server`**, Open two browser tabs or windows to the local server address (e.g., `http://127.0.0.1:5500`).
    -   Follow the on-screen instructions to create and join a game.

---

## **License**

This project is licensed under the MIT License. See the LICENSE file for details.
