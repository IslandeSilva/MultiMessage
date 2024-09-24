let cancelSending = false;

document.getElementById('messageForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const phones = document.getElementById('phones').value.split(',');
    const message = document.getElementById('message').value;
    const description = document.getElementById('description').value;
    const fileInput = document.getElementById('file');
    const file = fileInput.files[0];
    const delay = parseInt(document.getElementById('delay').value) * 1000;

    cancelSending = false;
    showPopup(phones.length);

    phones.forEach((phone, index) => {
        setTimeout(() => {
            if (!cancelSending) {
                sendMessage(phone.trim(), message, description, file);
                updateCounter(index + 1, phones.length, delay / 1000);
            }
        }, index * delay);
    });
});

document.getElementById('cancelButton').addEventListener('click', function() {
    cancelSending = true;
    document.getElementById('popup').style.display = 'none';
});

function sendMessage(phone, message, description, file) {
    const payload = {
        to: phone,
        message: message, // Certifique-se de que a mensagem está sendo incluída no payload
        description: description
    };

    if (file) {
        const reader = new FileReader();
        reader.onload = function() {
            const base64File = reader.result.split(',')[1];
            payload.file = base64File;
            payload.fileName = file.name;

            sendPayload(payload);
        };
        reader.readAsDataURL(file);
    } else {
        sendPayload(payload);
    }
}

function sendPayload(payload) {
    console.log('Enviando payload:', payload);

    fetch('http://localhost:3000/send-file', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function showPopup(total) {
    const popup = document.getElementById('popup');
    const counter = document.getElementById('counter');
    counter.textContent = `Enviando 0 de ${total} (0s)`;
    popup.style.display = 'flex';
}

function updateCounter(current, total, delay) {
    const counter = document.getElementById('counter');
    counter.textContent = `Enviando ${current} de ${total} (${current * delay}s)`;
    if (current === total) {
        setTimeout(() => {
            document.getElementById('popup').style.display = 'none';
        }, 2000);
    }
}
