import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_KEY = "YOUR_ANON_KEY";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const reader = document.getElementById("reader");
const dateInput = document.getElementById("date");
const sectionSelect = document.getElementById("section");
const tbody = document.getElementById("attendance-body");

dateInput.value = new Date().toISOString().split("T")[0];

let students = [];
let attendanceRecords = [];

// ✅ Fetch student list
async function loadStudents() {
  const res = await fetch("students.json");
  const data = await res.json();
  students = Object.keys(data).map((id) => ({
    student_number: id,
    ...data[id],
  }));
  renderTable();
}

// ✅ Fetch attendance records for current date
async function loadAttendance() {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("date", dateInput.value);
  attendanceRecords = data || [];
  renderTable();
}

// ✅ Render student table
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

// ✅ Handle QR scan
async function onScanSuccess(decodedText) {
  const student_number = decodedText.trim();
  const today = dateInput.value;

  const existing = attendanceRecords.find(
    (r) => r.student_number === student_number && r.date === today
  );
  if (existing) {
    alert("Already marked present today!");
    return;
  }

  const student = students.find((s) => s.student_number === student_number);
  if (!student) {
    alert("Student not found!");
    return;
  }

  const { error } = await supabase.from("attendance_records").insert([
    {
      student_number,
      name: student.name,
      section: student.section,
      date: today,
    },
  ]);

  if (error) {
    alert("Error saving attendance");
    console.error(error);
  } else {
    alert(`${student.name} marked present!`);
    loadAttendance();
  }
}

// ✅ Initialize camera
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

// ✅ Event listeners
dateInput.addEventListener("change", loadAttendance);
sectionSelect.addEventListener("change", renderTable);

// ✅ Initialize everything
loadStudents().then(() => {
  loadAttendance();
  initScanner();
});
