const dateInput = document.getElementById("date");
const sectionSelect = document.getElementById("section");
const tbody = document.getElementById("attendance-body");

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
    renderTable();
  } catch (err) {
    console.error("Failed to load students.json:", err);
  }
}

// Load today's attendance
async function loadAttendance() {
  try {
    const res = await fetch("/api/attendance?date=" + dateInput.value);
    const text = await res.text();
    console.log("Raw attendance fetch response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse JSON:", err);
      return;
    }

    attendanceRecords = data.records || [];
    renderTable();
  } catch (err) {
    console.error("Error loading attendance:", err);
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
  if (scanLock[student_number]) return; // ignore repeated scans
  scanLock[student_number] = true;

  try {
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_number })
    });

    const text = await res.text();
    console.log("Raw scan response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse JSON:", err);
      alert("❌ Server returned invalid JSON");
      return;
    }

    alert(data.message || "No message returned");
    await loadAttendance();
  } catch (err) {
    console.error("Error saving attendance:", err);
    alert("❌ Could not connect to server");
  } finally {
    setTimeout(() => { scanLock[student_number] = false; }, 1000); // unlock after 1 second
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
