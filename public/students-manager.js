let students = {}; // local cache of students

// ------------------- Load Students -------------------
async function loadStudents(filterText = "") {
  try {
    const { data, error } = await supabase.from('students').select('*');
    console.log("Data:", data);
    console.log("Error:", error);

    if (error) throw error;

    students = {};
    data.forEach(student => {
      students[student.student_number] = student;
    });

    renderTable(filterText);
  } catch (err) {
    alert("Error loading students: " + err.message);
  }
}

// ------------------- Render Table -------------------
function renderTable(filterText = "") {
  const tbody = document.getElementById("studentsTable");
  tbody.innerHTML = "";

  const filtered = Object.entries(students).filter(([id, student]) => {
    const searchTerm = filterText.toLowerCase();
    return id.toLowerCase().includes(searchTerm) || student.name.toLowerCase().includes(searchTerm);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">No students found</td></tr>';
    return;
  }

  filtered.forEach(([id, student]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${id}</td>
      <td>${student.name}</td>
      <td>${student.grade_level}</td>
      <td>${student.section}</td>
      <td class="action-buttons">
        <button class="btn-edit" onclick="editStudent('${id}')">✏️ Edit</button>
        <button class="btn-delete" onclick="deleteStudent('${id}')">🗑️ Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ------------------- Add Student -------------------
document.getElementById("addStudentForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const studentData = {
    student_number: document.getElementById("student_number").value.trim(),
    name: document.getElementById("name").value.trim(),
    grade_level: document.getElementById("grade_level").value,
    section: document.getElementById("section").value
  };

  try {
    const { data, error } = await supabase.from('students').insert([studentData]);
    if (error) throw error;

    alert("✅ Student added successfully!");
    students[studentData.student_number] = studentData;
    renderTable();
    e.target.reset();
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
});

// ------------------- Edit Student -------------------
function editStudent(studentNumber) {
  const student = students[studentNumber];
  document.getElementById("edit_student_number").value = studentNumber;
  document.getElementById("edit_name").value = student.name;
  document.getElementById("edit_grade_level").value = student.grade_level;
  document.getElementById("edit_section").value = student.section;
  document.getElementById("editModal").style.display = "block";
}

// ------------------- Update Student -------------------
document.getElementById("editStudentForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const studentNumber = document.getElementById("edit_student_number").value;
  const studentData = {
    name: document.getElementById("edit_name").value.trim(),
    grade_level: document.getElementById("edit_grade_level").value,
    section: document.getElementById("edit_section").value
  };

  try {
    const { data, error } = await supabase
      .from('students')
      .update(studentData)
      .eq('student_number', studentNumber);
    if (error) throw error;

    alert("✅ Student updated successfully!");
    students[studentNumber] = { student_number: studentNumber, ...studentData };
    renderTable();
    document.getElementById("editModal").style.display = "none";
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
});

// ------------------- Delete Student -------------------
async function deleteStudent(studentNumber) {
  if (!confirm(`Are you sure you want to delete ${students[studentNumber].name}?`)) return;

  try {
    const { data, error } = await supabase
      .from('students')
      .delete()
      .eq('student_number', studentNumber);
    if (error) throw error;

    alert("✅ Student deleted successfully!");
    delete students[studentNumber];
    renderTable();
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
}

// ------------------- Search -------------------
document.getElementById("searchInput").addEventListener("input", (e) => {
  renderTable(e.target.value);
});

// ------------------- Modal Controls -------------------
document.querySelector(".close").addEventListener("click", () => {
  document.getElementById("editModal").style.display = "none";
});

window.addEventListener("click", (e) => {
  const modal = document.getElementById("editModal");
  if (e.target === modal) modal.style.display = "none";
});

// ------------------- Initialize -------------------
loadStudents();
