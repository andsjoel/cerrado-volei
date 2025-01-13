import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyA1O3YGQV1Up0n-wYXn34NyzMx0RT7NOL0",
    authDomain: "parads-list.firebaseapp.com",
    projectId: "parads-list",
    storageBucket: "parads-list.appspot.com",
    messagingSenderId: "502581426851",
    appId: "1:502581426851:web:9374424441ce1bddc71d16"
  };

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const teamsContainer = document.getElementById('teamsContainer');

function renderTeamsFromFirestore(teamsData) {
    teamsContainer.innerHTML = '';

    if (!teamsData || teamsData.length === 0) {
        const htmlDiv = document.createElement('div');

        const waitingMessage = document.createElement('h2');
        waitingMessage.textContent = 'Aguardando...';
        waitingMessage.classList.add('blink');

        htmlDiv.appendChild(waitingMessage);
        teamsContainer.appendChild(htmlDiv);

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
    })
}

db.collection('teams').doc('currentTeams').onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        const teamsData = data.teams;
        const teamOnHold = data.teamOnHold;
        
        // Renderizar a lista de times na página
        renderTeamsFromFirestore(teamsData, teamOnHold);
    } else {
        console.log("No teams data found!");
    }
});

const correctPassword = "1234";

document.getElementById("admBtn").addEventListener("click", function() {
    const inputPass = document.getElementById("admPass").value;

    // Verifica se a senha inserida está correta
    if (inputPass === correctPassword) {
        localStorage.setItem("isAdmin", "true");
        // Se correta, redireciona para a página de administrador
        window.location.href = "admin.html";
    } else {
        // Senha incorreta, exibe uma mensagem de erro
        alert("Senha incorreta!");
    }
});