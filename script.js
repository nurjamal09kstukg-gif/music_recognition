let mediaRecorder;
let audioChunks = [];

const btn = document.getElementById('recordBtn');
const visualizer = document.getElementById('visualizer');
const resultArea = document.getElementById('result');

btn.onclick = async () => {
    // 1. Запрашиваем доступ к микрофону
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // 2. Настраиваем объект записи
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = []; // Очищаем данные предыдущей записи

        // Событие: когда поступают данные, сохраняем их в массив
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        // Событие: когда запись остановлена
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            console.log("Запись завершена, размер файла:", audioBlob.size);
            
            // Здесь вызывается функция отправки на сервер (напишем ниже)
            sendAudioToServer(audioBlob); 
        };

        // 3. Запускаем запись и визуализацию
        mediaRecorder.start();
        visualizer.style.display = 'flex';
        btn.innerText = 'Записываю...';
        btn.classList.add('recording'); // Можно добавить красный цвет в CSS
        btn.disabled = true;

        // 4. Останавливаем запись автоматически через 5 секунд
        setTimeout(() => {
            mediaRecorder.stop();
            // Выключаем микрофон, чтобы не горел индикатор в браузере
            stream.getTracks().forEach(track => track.stop());
            
            btn.innerText = 'Обработка...';
            visualizer.style.display = 'none';
        }, 5000);

    } catch (err) {
        console.error("Ошибка доступа к микрофону:", err);
        alert("Пожалуйста, разрешите доступ к микрофону в настройках браузера.");
    }
};

// Функция для отправки аудио на ваш сервер
async function sendAudioToServer(blob) {
    const formData = new FormData();
    formData.append('file', blob, 'recording.wav');

    try {
        // Замените '/recognize' на URL вашего реального бэкенда
        const response = await fetch('/recognize', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.match) {
            resultArea.innerHTML = `🎉 Найдено: <strong>${data.match.artist} — ${data.match.title}</strong>`;
        } else {
            resultArea.innerHTML = `❌ Музыка не распознана. Попробуйте еще раз.`;
        }
    } catch (error) {
        resultArea.innerHTML = `⚠️ Ошибка соединения с сервером.`;
    } finally {
        btn.disabled = false;
        btn.innerText = '🎤 Слушать снова';
    }
}
