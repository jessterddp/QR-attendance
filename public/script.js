const dateInput = document.getElementById("date");
const sectionSelect = document.getElementById("section");
const tbody = document.getElementById("attendance-body");

// Add a log container dynamically if not in HTML
let logDiv = document.getElementById("log");
if (!logDiv) {
  logDiv = document.createElement("div");
  logDiv.id = "log";
  logDiv.style.background = "#f0f0f0";
  logDiv.style.padding = "10px";
  logDiv.style.margin = "10px 0";
  logDiv.style.maxHeight = "200px";
  logDiv.style.overflowY = "auto";
  logDiv.style.fontSize = "12px";
  logDiv.style.fontFamily = "monospace";
  document.body.appendChild(logDiv);
}

function appendLog(message, type = "info") {
  const p = document.createElement("p");
  p.textContent = message;
  p.style.color = type === "error" ? "red" : type === "success" ? "green" : "black";
  logDiv.appendChild(p);
  logDiv.scrollTop = logDiv.scrollHeight;
}

let students = [];
let attendanceRecords = [];
let scanLock = {}; // prevent duplicate scans

dateInput.value = new Date().toISOString().split("T")[0];

// Load students.json
async function loadStudents() {
  try {
    const res = await fetch("students.json");
    const data = await res.json();
    students = Object.keys(data).map(id => ({ student_number: id, ...data[id] }));
    appendLog("✅ Loaded students.json", "success");
    renderTable();
  } catch (err) {
    appendLog("❌ Failed to load students.json: " + err, "error");
  }
}

// Load today's attendance
async function loadAttendance() {
  try {
    const res = await fetch("/api/attendance?date=" + dateInput.value);
    const text = await res.text();
    appendLog("RAW attendance fetch response: " + text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      appendLog("❌ Invalid JSON from /api/attendance: " + err, "error");
      return;
    }

    attendanceRecords = data.records || [];
    renderTable();
  } catch (err) {
    appendLog("❌ Error loading attendance: " + err, "error");
  }
}

// Render table
function renderTable() {
  const section = sectionSelect.value;
  tbody.innerHTML = "";

  students
    .filter(s => s.section === section)
    .forEach(student => {
      const present = attendanceRecords.some(r => r.student_number === student.student_number);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${student.student_number}</td>
        <td>${student.name}</td>
        <td>${student.grade_level} - ${student.section}</td>
        <td class="${present ? "present" : "absent"}">${present ? "Present" : "Absent"}</td>
      `;
      tbody.appendChild(tr);
    });
}

// Handle QR scan
async function onScanSuccess(decodedText) {
  const student_number = decodedText.trim();
  if (scanLock[student_number]) return;
  scanLock[student_number] = true;

  try {
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_number })
    });

    const text = await res.text();
    appendLog("RAW scan response: " + text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      appendLog("❌ Invalid JSON from scan POST: " + err, "error");
      alert("❌ Server returned invalid JSON. Check logs below.");
      return;
    }

    appendLog("✅ " + (data.message || "No message returned"), "success");
    await loadAttendance();
  } catch (err) {
    appendLog("❌ Error saving attendance: " + err, "error");
    alert("❌ Could not connect to server. Check logs below.");
  } finally {
    setTimeout(() => { scanLock[student_number] = false; }, 1000);
  }
}

// Initialize QR scanner
function initScanner() {
  const html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    onScanSuccess
  );
}

// Event listeners
dateInput.addEventListener("change", loadAttendance);
sectionSelect.addEventListener("change", renderTable);

// Initialize
loadStudents().then(() => {
  loadAttendance();
  initScanner();
});
