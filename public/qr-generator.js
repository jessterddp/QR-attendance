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
  const canvas = document.createElement('canvas');
  const size = 300;
  canvas.width = size;
  canvas.height = size;

  new QRCode(canvas, {
    text: text,
    width: size,
    height: size,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  return canvas;
}

// ------------------- Create QR card -------------------
function createQRCard(studentNumber, student) {
  const card = document.createElement('div');
  card.className = 'qr-card';

  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'qr-canvas-container';

  const canvas = generateQRCanvas(studentNumber);
  canvasContainer.appendChild(canvas);

  qrCodes[studentNumber] = canvas;

  const info = document.createElement('div');
  info.className = 'qr-info';
  info.innerHTML = `
    <div class="student-name">${student.name}</div>
    <div class="student-details">${student.grade_level} - ${student.section}</div>
    <div class="student-number">${studentNumber}</div>
  `;

  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'btn btn-small';
  downloadBtn.textContent = '📥 Download';
  downloadBtn.onclick = () => downloadQRCode(studentNumber, student);

  card.appendChild(canvasContainer);
  card.appendChild(info);
  card.appendChild(downloadBtn);

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
    const gradeMatch = !gradeFilter || student.grade_level.toString() === gradeFilter.replace("Grade ", "");
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

// ------------------- Download single QR code -------------------
function downloadQRCode(studentNumber, student) {
  const canvas = qrCodes[studentNumber];

  const finalCanvas = document.createElement('canvas');
  const ctx = finalCanvas.getContext('2d');

  finalCanvas.width = 400;
  finalCanvas.height = 480;

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  ctx.drawImage(canvas, 50, 20, 300, 300);

  ctx.fillStyle = 'black';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(student.name, 200, 350);

  ctx.font = '16px Arial';
  ctx.fillText(`${student.grade_level} - ${student.section}`, 200, 380);
  ctx.fillText(studentNumber, 200, 410);

  finalCanvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${student.name.replace(/\s+/g, '_')}_${studentNumber}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ------------------- Event listeners for filters -------------------
document.getElementById('gradeFilter').addEventListener('change', renderQRCodes);
document.getElementById('sectionFilter').addEventListener('change', renderQRCodes);

// ------------------- Initialize -------------------
loadStudents();
