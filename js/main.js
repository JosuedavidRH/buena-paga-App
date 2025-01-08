// Configuración de la URL del script de Google Apps (default)
const scriptUrl = "";

// Variable global para almacenar la URL dinámica desde el escaneo QR
let globalDynamicUrl = scriptUrl;

// Función para enviar un número a Google Sheets
function sendToSheet(inputValue, dynamicUrl = globalDynamicUrl) {
    fetch(`${dynamicUrl}?input=${inputValue}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Error en la consulta. Respuesta no válida.");
            }
            return response.json();
        })
        .then(data => {
            const b6 = data.b6 || "#N/A";

            // Si b6 es "N/A", muestra el formulario adicional en index
            if (b6 === "#N/A") {
                showAdditionalForm(); // Muestra el formulario
            } else {
                // Si b6 tiene un valor válido, redirigir a dos.html con los datos de b6
                const queryParams = new URLSearchParams(data).toString();
                window.location.href = `dos.html?${queryParams}`;
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert(error.message || "Error en la consulta.");
        });
}

// Función para mostrar el formulario adicional
function showAdditionalForm() {
    const formContainer = document.getElementById("dynamicFormContainer");

    // Crear el formulario
    const formHTML = `
        <form id="additionalForm">
            <div>
                <label for="numericField">Número:</label>
                <input type="text" id="numericField" placeholder="Ingresa un número" oninput="validateNumeric(this)">
            </div>
            <div>
                <label for="pinField">PIN:</label>
                <input type="password" id="pinField" placeholder="Ingresa el PIN">
            </div>
            <button type="button" id="approveButton">Aprobar Fiado</button>
        </form>
    `;
    formContainer.innerHTML = formHTML;

    // Agregar lógica al botón
    document.getElementById("approveButton").addEventListener("click", verifyFields);
}


// Validación de campos numéricos
function validateNumeric(input) {
    input.value = input.value.replace(/[^0-9]/g, ""); // Eliminar caracteres no numéricos
}
// Lógica para validar y enviar los datos del formulario adicional
function verifyFields() {
    const numericField = document.getElementById("numericField").value.trim();  // Obtener valor del campo numérico
    const pinField = document.getElementById("pinField").value.trim();  // Obtener valor del campo PIN

    // Validar que ambos campos no estén vacíos
    if (!numericField) {
        alert("El campo de número es obligatorio.");
        return;
    }
    if (!pinField) {
        alert("El campo de PIN es obligatorio.");
        return;
    }

    // Validar que el número y el PIN sean iguales
    if (numericField !== pinField) {
        alert("El número y el PIN deben ser iguales.");
        return;
    }

    // Si todo es válido, enviar los datos
    const payload = {
        input: numericField,
        action: "sendPin", // Acción específica para procesar el PIN
    };

    sendPinToSheet(payload, globalDynamicUrl); // Usar la URL dinámica desde el QR
}
// Función para enviar PIN a la hoja de cálculo
function sendPinToSheet(payload, dynamicUrl) {
    const queryParams = new URLSearchParams(payload).toString();
    const fullUrl = `${dynamicUrl}?${queryParams}`;

    fetch(fullUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al procesar el PIN. Respuesta no válida.");
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert("PIN aprobado exitosamente.");
                location.reload(); // Recarga la página automáticamente al aprobar el PIN
            } else if (data.error) {
                alert(data.error);
                if (data.redirect) {
                    window.location.href = data.redirect; // Si hay una redirección, redirige
                } else {
                    location.reload(); // Si no hay redirección, recarga la página automáticamente
                }
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert(error.message || "Error al procesar el PIN.");
            location.reload(); // También recarga la página en caso de error inesperado
        });
}
// Función para enviar PIN a la hoja de cálculo
function sendPinToSheet(payload, dynamicUrl) {
    const queryParams = new URLSearchParams(payload).toString();
    const fullUrl = `${dynamicUrl}?${queryParams}`;

    fetch(fullUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al procesar el PIN. Respuesta no válida.");
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert("PIN aprobado exitosamente.");
                location.reload(); // Recarga la página automáticamente al aprobar el PIN
            } else if (data.error) {
                alert(data.error);

                // Solo redirige si el enlace es válido
                if (data.redirect && isValidURL(data.redirect)) {
                    window.location.href = data.redirect;
                } else {
                    location.reload(); // Recarga la página si no hay redirección válida
                }
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert(error.message || "Error al procesar el PIN.");
            location.reload(); // Recarga la página en caso de error inesperado
        });
}

// Función para validar si un enlace es válido
function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
}

// Función para solicitar permiso de la cámara
function requestCameraPermission() {
    return new Promise((resolve, reject) => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then((stream) => {
                    resolve(stream);
                    stream.getTracks().forEach(track => track.stop());
                })
                .catch((err) => {
                    reject("Permiso de cámara denegado o error en el acceso.");
                });
        } else {
            reject("Tu navegador no soporta el acceso a la cámara.");
        }
    });
}

// Función para iniciar el escaneo del código QR
function startQRCodeScanner() {
    const video = document.getElementById("video");
    const canvas = document.getElementById("qr-canvas");
    const context = canvas.getContext("2d");

    requestCameraPermission().then(() => {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then((stream) => {
                video.srcObject = stream;
                video.play();
                scanQRCode();
            })
            .catch((err) => {
                alert("Error al acceder a la cámara: " + err);
            });
    }).catch((error) => {
        alert(error);
    });

    function scanQRCode() {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: "dontInvert" });

        if (code) {
            console.log("Código QR escaneado:", code.data);

            // Detener el stream de la cámara
            const stream = video.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());

            // Separar la URL base del número de consulta
            const qrData = code.data;
            const urlRegex = /(https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec)(\d+)/;
            const match = qrData.match(urlRegex);

            if (match) {
                globalDynamicUrl = match[1]; // Guardar la URL dinámica globalmente
                const inputValue = match[2];

                // Enviar los datos escaneados
                sendToSheet(inputValue, globalDynamicUrl);
            } else {
                alert("Formato de QR no válido. Asegúrate de que contiene un enlace y un número.");
            }
        } else {
            requestAnimationFrame(scanQRCode);
        }
    }
}

// Iniciar el escaneo de QR al presionar el botón
document.getElementById("startQrButton").addEventListener("click", function () {
    startQRCodeScanner();
});