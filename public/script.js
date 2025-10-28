const messageDiv = document.getElementById("message");

function showMessage(text, isSuccess = true) {
  messageDiv.textContent = text;
  messageDiv.className = isSuccess ? "success" : "error";
}

async function onScanSuccess(qrCodeMessage) {
  showMessage("Processing...", true);

  try {
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_number: qrCodeMessage }),
    });

    // Parse JSON response
    const data = await res.json();

    if (data.success) {
      showMessage(`✅ ${data.message}`, true);
    } else {
      showMessage(`⚠️ ${data.message}`, false);
    }
  } catch (error) {
    console.error(error);
    showMessage("❌ Error connecting to server", false);
  }
}

const html5QrCode = new Html5Qrcode("reader");

html5QrCode
  .start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    onScanSuccess
  )
  .catch((err) => {
    console.error("Camera start error:", err);
    showMessage("❌ Unable to start camera", false);
  });
