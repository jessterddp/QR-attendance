let students = {};
let qrCodes = {};

// Load students
async function loadStudents() {
  try {
    const res = await fetch(`${window.location.origin}/api/students`);
    const data = await res.json();
    if (data.success) {
      students = data.students;
      renderQRCodes();
    }
  } catch (err) {
    alert("Error loading students: " + err.message);
  }
}

// Generate QR code on canvas
function generateQRCanvas(text) {
  const canvas = document.createElement('canvas');
  const size = 300;
  canvas.width = size;
  canvas.height = size;
  
  const qr = new QRCode(canvas, {
    text: text,
    width: size,
    height: size,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
  
  return canvas;
}

// Create QR card with student info
function createQRCard(studentNumber, student) {
  const card = document.createElement('div');
  card.className = 'qr-card';
  
  // Create canvas container
  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'qr-canvas-container';
  
  // Generate QR code
  const canvas = generateQRCanvas(studentNumber);
  canvasContainer.appendChild(canvas);
  
  // Store canvas for later download
  qrCodes[studentNumber] = canvas;
  
  // Student info
  const info = document.createElement('div');
  info.className = 'qr-info';
  info.innerHTML = `
    <div class="student-name">${student.name}</div>
    <div class="student-details">${student.grade_level} - ${student.section}</div>
    <div class="student-number">${studentNumber}</div>
  `;
  
  // Download button
  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'btn btn-small';
  downloadBtn.textContent = '📥 Download';
  downloadBtn.onclick = () => downloadQRCode(studentNumber, student);
  
  card.appendChild(canvasContainer);
  card.appendChild(info);
  card.appendChild(downloadBtn);
  
  return card;
}

// Render QR codes based on filters
function renderQRCodes() {
  const grid = document.getElementById('qrGrid');
  grid.innerHTML = '';
  qrCodes = {};
  
  const gradeFilter = document.getElementById('gradeFilter').value;
  const sectionFilter = document.getElementById('sectionFilter').value;
  
  const filtered = Object.entries(students).filter(([id, student]) => {
    const gradeMatch = !gradeFilter || student.grade_level === gradeFilter;
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

// Download single QR code
function downloadQRCode(studentNumber, student) {
  const canvas = qrCodes[studentNumber];
  
  // Create a new canvas with extra space for text
  const finalCanvas = document.createElement('canvas');
  const ctx = finalCanvas.getContext('2d');
  
  finalCanvas.width = 400;
  finalCanvas.height = 480;
  
  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  
  // Draw QR code centered
  ctx.drawImage(canvas, 50, 20, 300, 300);
  
  // Add text below
  ctx.fillStyle = 'black';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(student.name, 200, 350);
  
  ctx.font = '16px Arial';
  ctx.fillText(`${student.grade_level} - ${student.section}`, 200, 380);
  ctx.fillText(studentNumber, 200, 410);
  
  // Download
  finalCanvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${student.name.replace(/\s+/g, '_')}_${studentNumber}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// Download all QR codes as ZIP
async function downloadAllQRCodes() {
  const gradeFilter = document.getElementById('gradeFilter').value;
  const sectionFilter = document.getElementById('sectionFilter').value;
  
  const filtered = Object.entries(students).filter(([id, student]) => {
    const gradeMatch = !gradeFilter || student.grade_level === gradeFilter;
    const sectionMatch = !sectionFilter || student.section === sectionFilter;
    return gradeMatch && sectionMatch;
  });
  
  if (filtered.length === 0) {
    alert('No students to download');
    return;
  }
  
  const zip = new JSZip();
  
  for (const [id, student] of filtered) {
    const canvas = qrCodes[id];
    
    // Create final canvas with text
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
    ctx.fillText(id, 200, 410);
    
    // Add to ZIP
    const blob = await new Promise(resolve => finalCanvas.toBlob(resolve));
    zip.file(`${student.name.replace(/\s+/g, '_')}_${id}.png`, blob);
  }
  
  // Generate and download ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'student_qr_codes.zip');
}

// Event listeners
document.getElementById('gradeFilter').addEventListener('change', renderQRCodes);
document.getElementById('sectionFilter').addEventListener('change', renderQRCodes);

// Initialize
loadStudents();