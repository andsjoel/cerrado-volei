// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAmnAK5EBYza79MQJmU4nTKVIzTjeOmEhw",
    authDomain: "cerrado-volei.firebaseapp.com",
    projectId: "cerrado-volei",
    storageBucket: "cerrado-volei.firebasestorage.app",
    messagingSenderId: "687787718559",
    appId: "1:687787718559:web:47e3fddd979dee4fd06faa"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const teamsContainer = document.getElementById('teamsContainer');
const waitingPlayer = document.getElementById('waitingPlayer');

function renderTeamsFromFirestore(teamsData) {
    teamsContainer.innerHTML = '';

    if (!teamsData || teamsData.length === 0) {
        const ballonHq = document.createElement('div');
        ballonHq.classList.add('ballon-hq');

        const imgHq = document.createElement('img');
        imgHq.src = '../img/marvelvsdc.png';
        imgHq.alt = 'Test'

        const waitingMessage = document.createElement('h2');
        waitingMessage.textContent = "Esperando pelo primeiro jogador";
        waitingMessage.classList.add('blink')
        // ballonHq.appendChild(imgHq)
        ballonHq.appendChild(waitingMessage);

        teamsContainer.appendChild(ballonHq);

        const balao = document.createElement('p');

        balloon.appendChild(balao)

        teamsContainer.appendChild(balloon);
        return;
    }

    teamsData.forEach((team, index) => {
        const teamDiv = document.createElement('div');
        teamDiv.classList.add('team');

        const teamTitle = document.createElement('h3');
        teamTitle.textContent = `Time ${index + 1}`;
        teamDiv.appendChild(teamTitle);

        if (index === 2) {
            teamTitle.textContent = `1º Próxima`;
        }
        if (index === 3) {
            teamTitle.textContent = `2º Próxima`;
        }
        if (index === 4) {
            teamTitle.textContent = `3º Próxima`;
        }
        if (index === 5) {
            teamTitle.textContent = `5º Próxima`;
        }

        const playerList = document.createElement('ul');

        team.players.forEach((player, playerIndex) => {
            const playerItem = document.createElement('div');
            const playerName = document.createElement('p');
            playerItem.classList.add('player-space');
            if (player) {
                playerName.textContent = player.name;
                playerItem.appendChild(playerName)
                if (player.isSetter) {
                    playerItem.classList.add('player-setter');
                }
                if (player.isFemale) {
                    playerItem.classList.add('player-female');
                }
            } else {
                playerItem.textContent = 'Vazio';
            }
            playerList.appendChild(playerItem);
        });

        teamDiv.appendChild(playerList);
        teamsContainer.appendChild(teamDiv);
    });
}

db.collection('teams').doc('currentTeams').onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        const teamsData = data.teams;
        renderTeamsFromFirestore(teamsData);
    } else {
        console.log("No teams data found!");
    }
});

const correctPassword = "123";

document.getElementById("admBtn").addEventListener("click", function() {
    const inputPass = document.getElementById("admPass").value;

    // Verifica se a senha inserida está correta
    if (inputPass === correctPassword) {
        localStorage.setItem("isAdmin", "true");
        // Se correta, redireciona para a página de administrador
        window.location.href = "admin.html";
    } else {
        alert("Senha incorreta!");
    }
});