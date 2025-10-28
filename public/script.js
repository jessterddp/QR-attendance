const dateInput = document.getElementById("date");
const sectionSelect = document.getElementById("section");
const tbody = document.getElementById("attendance-body");

dateInput.value = new Date().toISOString().split("T")[0];

let students = [];
let attendanceRecords = [];
let scanLock = {}; // prevent multiple scans per student

// Load students.json
async function loadStudents() {
  const res = await fetch("students.json");
  const data = await res.json();
  students = Object.keys(data).map((id) => ({
    student_number: id,
    ...data[id],
  }));
  renderTable();
}

// Load today's attendance from your working Supabase backend
async function loadAttendance() {
  try {
    const res = await fetch("/api/attendance?date=" + dateInput.value);
    const data = await res.json();
    attendanceRecords = data.records || [];
    renderTable();
  } catch (err) {
    console.error("Error loading attendance:", err);
  }
}

// Render table based on selected section
function renderTable() {
  const section = sectionSelect.value;
  const filteredStudents = students.filter((s) => s.section === section);
  tbody.innerHTML = "";

  filteredStudents.forEach((student) => {
    const present = attendanceRecords.some(
      (r) => r.student_number === student.student_number
    );

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${student.student_number}</td>
      <td>${student.name}</td>
      <td>${student.grade_level} - ${student.section}</td>
      <td class="${present ? "present" : "absent"}">
        ${present ? "Present" : "Absent"}
      </td>
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
      body: JSON.stringify({ student_number }),
    });

    const data = await res.json();
    alert(data.message);
    await loadAttendance();
  } catch (err) {
    console.error("Error saving attendance:", err);
    alert("❌ Error connecting to server");
  } finally {
    // Release lock after 1 second
    setTimeout(() => {
      scanLock[student_number] = false;
    }, 1000);
  }
}

// Initialize camera
function initScanner() {
  const html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      onScanSuccess(decodedText);
    }
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
