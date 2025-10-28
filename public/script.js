// ------------------- Supabase Client -------------------
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';

const SUPABASE_URL = "https://gevrbcacemvqunsztlic.supabase.co";
const SUPABASE_KEY = "sb_publishable_f5GQ75baPM__DNpcpMs57g_sneJ6RwP";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ------------------- DOM Elements -------------------
const dateInput = document.getElementById("date");
const sectionSelect = document.getElementById("section");
const tbody = document.getElementById("attendance-body");
const scanStatus = document.getElementById("scanStatus");

// ------------------- Local Cache -------------------
let students = [];
let attendanceRecords = [];
let scanLock = {};

// Set default date to today
dateInput.value = new Date().toISOString().split("T")[0];

// ------------------- Scan Status -------------------
function showScanStatus(message, type = "info") {
  scanStatus.textContent = message;
  scanStatus.className = `scan-status ${type}`;
  scanStatus.style.display = "block";
  
  setTimeout(() => {
    scanStatus.style.display = "none";
  }, 3000);
}

// ------------------- Load Students -------------------
async function loadStudents() {
  try {
    const { data, error } = await supabase.from('students').select('*');
    if (error) throw error;

    students = data;
    renderTable();
  } catch (err) {
    console.error("Failed to load students:", err);
    showScanStatus("❌ Failed to load students", "error");
  }
}

// ------------------- Load Attendance -------------------
async function loadAttendance() {
  try {
    const selectedDate = dateInput.value;
    const { data, error } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("date", selectedDate);

    if (error) throw error;

    attendanceRecords = data || [];
    renderTable();
    updateStats();
  } catch (err) {
    console.error("Error loading attendance:", err);
    showScanStatus("❌ Failed to load attendance", "error");
  }
}

// ------------------- Update Stats -------------------
function updateStats() {
  const section = sectionSelect.value;
  const filteredStudents = section 
    ? students.filter(s => s.section === section)
    : students;

  const presentCount = filteredStudents.filter(s =>
    attendanceRecords.some(r => r.student_number === s.student_number)
  ).length;

  const totalCount = filteredStudents.length;
  const absentCount = totalCount - presentCount;

  document.getElementById("presentCount").textContent = presentCount;
  document.getElementById("absentCount").textContent = absentCount;
  document.getElementById("totalCount").textContent = totalCount;
}

// ------------------- Render Table -------------------
function renderTable() {
  const section = sectionSelect.value;
  tbody.innerHTML = "";

  let filteredStudents = section 
    ? students.filter(s => s.section === section)
    : students;

  if (filteredStudents.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px;">No students found</td></tr>';
    return;
  }

  filteredStudents.forEach(student => {
    const present = attendanceRecords.some(r => r.student_number === student.student_number);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${student.student_number}</td>
      <td>${student.name}</td>
      <td>${student.grade_level} - ${student.section}</td>
      <td><span class="status-badge ${present ? "status-present" : "status-absent"}">${present ? "✓ Present" : "✗ Absent"}</span></td>
    `;
    tbody.appendChild(tr);
  });

  updateStats();
}

// ------------------- Record Attendance -------------------
async function recordAttendance(studentNumber) {
  if (scanLock[studentNumber]) return;
  scanLock[studentNumber] = true;

  try {
    const student = students.find(s => s.student_number.toString() === studentNumber.toString());
    if (!student) {
      showScanStatus(`❌ Student not found: ${studentNumber}`, "error");
      return;
    }

    const now = new Date();
    const date = now.toISOString().split("T")[0];       // YYYY-MM-DD
    const time = now.toTimeString().split(" ")[0];      // HH:MM:SS

    const { data, error } = await supabase
      .from("attendance_records")
      .insert([{
        student_number: parseInt(student.student_number),
        student_name: student.name,
        grade_level: parseInt(student.grade_level),
        section: student.section,
        status: "Present",
        date,
        time
      }]);

    if (error) throw error;

    showScanStatus(`✅ Attendance recorded for ${student.name}`, "success");
    await loadAttendance();

  } catch (err) {
    console.error("Failed to record attendance:", err);
    showScanStatus("❌ Failed to record attendance", "error");
  } finally {
    setTimeout(() => scanLock[studentNumber] = false, 2000);
  }
}

// ------------------- QR Scanner -------------------
function initScanner() {
  const html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      recordAttendance(decodedText.trim());
    },
    (error) => {
      // Silent scanning error
    }
  ).catch(err => {
    console.error("Camera error:", err);
    document.getElementById("reader").innerHTML =
      '<p style="color: red; padding: 20px;">❌ Unable to access camera. Please grant camera permissions.</p>';
  });
}

// ------------------- Event Listeners -------------------
dateInput.addEventListener("change", loadAttendance);
sectionSelect.addEventListener("change", renderTable);

// ------------------- Initialize -------------------
loadStudents().then(() => {
  loadAttendance();
  initScanner();
});
