// ------------------- Supabase Client -------------------
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';

const SUPABASE_URL = "https://gevrbcacemvqunsztlic.supabase.co";
const SUPABASE_KEY = "sb_publishable_f5GQ75baPM__DNpcpMs57g_sneJ6RwP";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const dateInput = document.getElementById("date");
const sectionSelect = document.getElementById("section");
const tbody = document.getElementById("attendance-body");
const scanStatus = document.getElementById("scanStatus");

let students = [];
let attendanceRecords = [];
let scanLock = {};

dateInput.value = new Date().toISOString().split("T")[0];

// Show scan status
function showScanStatus(message, type = "info") {
  scanStatus.textContent = message;
  scanStatus.className = `scan-status ${type}`;
  scanStatus.style.display = "block";
  
  setTimeout(() => {
    scanStatus.style.display = "none";
  }, 3000);
}

// Load students
async function loadStudents() {
  try {
    const res = await fetch(`${window.location.origin}/api/students`);
    const data = await res.json();
    if (data.success) {
      students = Object.keys(data.students).map(id => ({ 
        student_number: id, 
        ...data.students[id] 
      }));
      renderTable();
    }
  } catch (err) {
    console.error("Failed to load students:", err);
  }
}

// Load attendance records
async function loadAttendance() {
  try {
    const apiUrl = `${window.location.origin}/api/attendance?date=${dateInput.value}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (data.success) {
      attendanceRecords = data.records || [];
      renderTable();
      updateStats();
    }
  } catch (err) {
    console.error("Error loading attendance:", err);
  }
}

// Update statistics
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

// Render attendance table
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

// Handle QR scan
async function onScanSuccess(decodedText) {
  const student_number = decodedText.trim();
  
  if (scanLock[student_number]) {
    return;
  }
  scanLock[student_number] = true;

  try {
    const apiUrl = `${window.location.origin}/api/attendance`;
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_number })
    });

    const data = await res.json();

    if (data.success) {
      showScanStatus(data.message, "success");
      await loadAttendance();
    } else {
      showScanStatus(data.message, "error");
    }
  } catch (err) {
    console.error("Error saving attendance:", err);
    showScanStatus("❌ Connection error", "error");
  } finally {
    setTimeout(() => { 
      scanLock[student_number] = false; 
    }, 2000);
  }
}

// Initialize QR scanner
function initScanner() {
  const html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    onScanSuccess,
    (error) => {
      // Silent error handling for continuous scanning
    }
  ).catch(err => {
    console.error("Camera error:", err);
    document.getElementById("reader").innerHTML = 
      '<p style="color: red; padding: 20px;">❌ Unable to access camera. Please grant camera permissions.</p>';
  });
}

// Event listeners
dateInput.addEventListener("change", loadAttendance);
sectionSelect.addEventListener("change", renderTable);

// Initialize
loadStudents().then(() => {
  loadAttendance();
  initScanner();
});