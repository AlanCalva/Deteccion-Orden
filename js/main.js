// Prefijo para activar los comandos
const ordenPrefijo = "SIRI";

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const outputText = document.getElementById("outputText");
  const msgText = document.getElementById("msgText");

  outputText.innerHTML = `Di ${ordenPrefijo} para ver el mensaje`;

  let recognition;
  let stoppedManually = false;

  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "es-ES";
  } else {
    alert("Tu navegador no soporta reconocimiento de voz.");
    return;
  }

  startBtn.addEventListener("dblclick", () => {
    stoppedManually = false;
    recognition.start();
    startBtn.disabled = true;
    outputText.textContent = `Escuchando... Di ${ordenPrefijo} para interactuar.`;
    msgText.innerHTML = "";
  });

  recognition.onresult = async (event) => {
    let transcript = event.results[event.results.length - 1][0].transcript.trim().toUpperCase();
    console.log("Texto reconocido:", transcript);

    // Verifica si la frase contiene el prefijo "SIRI"
    if (transcript.includes(ordenPrefijo)) {
      let frase = transcript.replace(ordenPrefijo, "").trim();  // Eliminar "SIRI"

      // Si dice "SALIR", detenemos todo
      if (frase.toUpperCase() === "SALIR") {
        outputText.textContent = "El reconocimiento ha terminado.";
        recognition.stop();
        startBtn.disabled = false;
        return;
      }

      // Enviar la frase completa al endpoint para que se procese y se detecte el comando
      await enviarMensaje(frase);
    }
  };

  recognition.onerror = (event) => {
    console.error("Error en el reconocimiento:", event.error);
    recognition.stop();
    startBtn.disabled = false;
  };

  recognition.onend = () => {
    if (!stoppedManually) {
      msgText.innerHTML = "El reconocimiento se detuvo inesperadamente. Habla nuevamente para continuar...";
      recognition.start();
    }
  };
});

// ✅ Enviar la frase completa al endpoint chat.php y recibir el comando procesado
async function enviarMensaje(frase) {
  const url = "http://98.80.142.242/API-GPT-PHP/endpoints/chat.php"; // Cambia esta URL si es necesario
  const datos = { message: frase };

  try {
    const respuesta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json();

    if (resultado.status === 200) {
      console.log("Respuesta de la API:", resultado.data.reply);
      const comando = resultado.data.reply.trim().toUpperCase(); // El comando que devuelve la API

      if (comando) {
        // Mostrar el comando detectado
        outputText.textContent = comando;

        // Enviar el comando a la API para que se almacene
        await enviarStatus(comando);
      } else {
        outputText.textContent = "Comando no reconocido.";
      }
    } else {
      outputText.textContent = "Error en la respuesta de la API.";
    }
  } catch (error) {
    outputText.textContent = "Error en la conexión con la API.";
    console.error("Error:", error);
  }
}

// ✅ Enviar el comando a tu API para almacenarlo
async function enviarStatus(status) {
  const url = "http://98.80.142.242/iot-api-php/controllers/AddIotDevice.php"; // Cambia esta URL si tu endpoint está en otro lugar
  const datos = { status: status };

  try {
    const respuesta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json();
    console.log("Respuesta de insertStatus:", resultado);

    if (resultado.success) {
      outputText.textContent = `Estado ${status} guardado exitosamente.`;
    } else {
      outputText.textContent = resultado.error || "Error al guardar el estado.";
    }
  } catch (error) {
    outputText.textContent = "Error de conexión al guardar el estado.";
    console.error("Error en enviarStatus:", error);
  }
}
