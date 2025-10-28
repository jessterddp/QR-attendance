let students = {};

// Load students
async function loadStudents() {
  try {
    const res = await fetch(`${window.location.origin}/api/students`);
    const data = await res.json();
    if (data.success) {
      students = data.students;
      renderTable();
    }
  } catch (err) {
    alert("Error loading students: " + err.message);
  }
}

// Render table
function renderTable(filterText = "") {
  const tbody = document.getElementById("studentsTable");
  tbody.innerHTML = "";

  const filtered = Object.entries(students).filter(([id, student]) => {
    const searchTerm = filterText.toLowerCase();
    return id.toLowerCase().includes(searchTerm) || 
           student.name.toLowerCase().includes(searchTerm);
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

// Add student
document.getElementById("addStudentForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const studentData = {
    student_number: document.getElementById("student_number").value.trim(),
    name: document.getElementById("name").value.trim(),
    grade_level: document.getElementById("grade_level").value,
    section: document.getElementById("section").value
  };

  try {
    const res = await fetch(`${window.location.origin}/api/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentData)
    });

    const data = await res.json();
    
    if (data.success) {
      alert("✅ Student added successfully!");
      students = data.students;
      renderTable();
      e.target.reset();
    } else {
      alert("❌ " + data.message);
    }
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
});

// Edit student
function editStudent(studentNumber) {
  const student = students[studentNumber];
  document.getElementById("edit_student_number").value = studentNumber;
  document.getElementById("edit_name").value = student.name;
  document.getElementById("edit_grade_level").value = student.grade_level;
  document.getElementById("edit_section").value = student.section;
  document.getElementById("editModal").style.display = "block";
}

// Update student
document.getElementById("editStudentForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const studentData = {
    student_number: document.getElementById("edit_student_number").value,
    name: document.getElementById("edit_name").value.trim(),
    grade_level: document.getElementById("edit_grade_level").value,
    section: document.getElementById("edit_section").value
  };

  try {
    const res = await fetch(`${window.location.origin}/api/students`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentData)
    });

    const data = await res.json();
    
    if (data.success) {
      alert("✅ Student updated successfully!");
      students = data.students;
      renderTable();
      document.getElementById("editModal").style.display = "none";
    } else {
      alert("❌ " + data.message);
    }
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
});

// Delete student
async function deleteStudent(studentNumber) {
  if (!confirm(`Are you sure you want to delete ${students[studentNumber].name}?`)) {
    return;
  }

  try {
    const res = await fetch(`${window.location.origin}/api/students`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_number: studentNumber })
    });

    const data = await res.json();
    
    if (data.success) {
      alert("✅ Student deleted successfully!");
      students = data.students;
      renderTable();
    } else {
      alert("❌ " + data.message);
    }
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
}

// Search functionality
document.getElementById("searchInput").addEventListener("input", (e) => {
  renderTable(e.target.value);
});

// Modal controls
document.querySelector(".close").addEventListener("click", () => {
  document.getElementById("editModal").style.display = "none";
});

window.addEventListener("click", (e) => {
  const modal = document.getElementById("editModal");
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// Initialize
loadStudents();