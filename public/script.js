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

// ------------------- Local State -------------------
let students = [];
let attendanceRecords = [];
let scanLock = {};

dateInput.value = new Date().toISOString().split("T")[0];

// ------------------- Show Scan Status -------------------
function showScanStatus(message, type = "info") {
  scanStatus.textContent = message;
  scanStatus.className = `scan-status ${type}`;
  scanStatus.style.display = "block";
  
  setTimeout(() => {
    scanStatus.style.display = "none";
  }, 3000);
}

// ------------------- Load Students from Supabase -------------------
async function loadStudents() {
  try {
    const { data, error } = await supabase.from('students').select('*');
    if (error) throw error;

    students = data; // Array of student objects
    renderTable();
  } catch (err) {
    console.error("Failed to load students:", err);
  }
}

// ------------------- Load Attendance Records -------------------
async function loadAttendance() {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', dateInput.value);

    if (error) throw error;

    attendanceRecords = data || [];
    renderTable();
    updateStats();
  } catch (err) {
    console.error("Error loading attendance:", err);
  }
}

// ------------------- Update Statistics -------------------
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

// ------------------- Render Attendance Table -------------------
function renderTable() {
  const section = sectionSelect.value;
  tbody.innerHTML = "";

  let filteredStudents = students;
  if (section) {
    filteredStudents = students.filter(s => s.section === section);
  }

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

// ------------------- Record attendance via Supabase -------------------
async function recordAttendance(student_number) {
  try {
    const today = new Date().toISOString().split("T")[0]; // e.g., "2025-10-29"
    
    const { data, error } = await supabase
      .from("attendance")
      .insert([{ student_number: parseInt(student_number), date: today }]);
    
    if (error) throw error;
    
    showScanStatus(`✅ Attendance recorded for ${student_number}`, "success");
    await loadAttendance(); // refresh table
  } catch (err) {
    console.error("Error saving attendance:", err);
    showScanStatus("❌ Failed to record attendance", "error");
  }
}


async function onScanSuccess(decodedText) {
  const student_number = decodedText.trim();
  
  if (scanLock[student_number]) return;
  scanLock[student_number] = true;

  await recordAttendance(student_number);

  setTimeout(() => {
    scanLock[student_number] = false;
  }, 2000);
}


// ------------------- Initialize QR Scanner -------------------
function initScanner() {
  const html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    onScanSuccess,
    (error) => { /* ignore scan errors silently */ }
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
