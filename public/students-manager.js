// Load students
async function loadStudents() {
  try {
    const { data, error } = await supabase.from('students').select('*');
    if (error) throw error;
    
    students = {};
    data.forEach(student => {
      students[student.student_number] = student;
    });
    renderTable();
  } catch (err) {
    alert("Error loading students: " + err.message);
  }
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

// Update student
document.getElementById("editStudentForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const studentData = {
    name: document.getElementById("edit_name").value.trim(),
    grade_level: document.getElementById("edit_grade_level").value,
    section: document.getElementById("edit_section").value
  };
  const studentNumber = document.getElementById("edit_student_number").value;

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

// Delete student
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

// Initialize
loadStudents();
