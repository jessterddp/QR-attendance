// ------------------- Supabase Client -------------------
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';

const SUPABASE_URL = "https://gevrbcacemvqunsztlic.supabase.co";
const SUPABASE_KEY = "sb_publishable_f5GQ75baPM__DNpcpMs57g_sneJ6RwP";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ------------------- Local Cache -------------------
let students = {};
let qrCodes = {};

// ------------------- Load students from Supabase -------------------
async function loadStudents() {
  try {
    const { data, error } = await supabase.from('students').select('*');
    if (error) throw error;

    students = {};
    data.forEach(student => {
      students[student.student_number] = student;
    });

    renderQRCodes();
  } catch (err) {
    alert("Error loading students: " + err.message);
  }
}

// ------------------- Generate QR canvas -------------------
function generateQRCanvas(text) {
  const container = document.createElement('div');
  new QRCode(container, {
    text: text,
    width: 300,
    height: 300,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
  return container;
}

// ------------------- Create QR card -------------------
function createQRCard(studentNumber, student) {
  const card = document.createElement('div');
  card.className = 'qr-card';

  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'qr-canvas-container';

  const qrElement = generateQRCanvas(studentNumber);
  canvasContainer.appendChild(qrElement);
  qrCodes[studentNumber] = qrElement;

  const info = document.createElement('div');
  info.className = 'qr-info';
  info.innerHTML = `
    <div class="student-name">${student.name}</div>
    <div class="student-details">${student.grade_level} - ${student.section}</div>
    <div class="student-number">${studentNumber}</div>
  `;

  card.appendChild(canvasContainer);
  card.appendChild(info);
  return card;
}

// ------------------- Render QR codes -------------------
function renderQRCodes() {
  const grid = document.getElementById('qrGrid');
  grid.innerHTML = '';
  qrCodes = {};

  const gradeFilter = document.getElementById('gradeFilter').value;
  const sectionFilter = document.getElementById('sectionFilter').value;

  const filtered = Object.entries(students).filter(([id, student]) => {
    const gradeMatch = !gradeFilter || student.grade_level.toString() === gradeFilter;
    const sectionMatch = !sectionFilter || student.section === sectionFilter;
    return gradeMatch && sectionMatch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div style="text-align: center; padding: 40px; grid-column: 1/-1;">No students found</div>';
    return;
  }

  filtered.forEach(([id, student]) => {
    const card = createQRCard(id, student);
    grid.appendChild(card);
  });
}

// ------------------- Event listeners for filters -------------------
document.getElementById('gradeFilter').addEventListener('change', renderQRCodes);
document.getElementById('sectionFilter').addEventListener('change', renderQRCodes);

// ------------------- Initialize -------------------
loadStudents();
