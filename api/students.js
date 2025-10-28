import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const studentsPath = path.join(process.cwd(), "public", "students.json");

  // GET - Fetch all students
  if (req.method === "GET") {
    try {
      const students = JSON.parse(fs.readFileSync(studentsPath, "utf8"));
      return res.status(200).json({ success: true, students });
    } catch (err) {
      console.error("Error reading students:", err);
      return res.status(500).json({ success: false, message: "Error reading students" });
    }
  }

  // POST - Add new student
  if (req.method === "POST") {
    try {
      const { student_number, name, grade_level, section } = req.body;

      if (!student_number || !name || !grade_level || !section) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      const students = JSON.parse(fs.readFileSync(studentsPath, "utf8"));

      if (students[student_number]) {
        return res.status(409).json({ success: false, message: "Student number already exists" });
      }

      students[student_number] = { name, grade_level, section };
      fs.writeFileSync(studentsPath, JSON.stringify(students, null, 2));

      return res.status(201).json({ success: true, message: "Student added successfully", students });
    } catch (err) {
      console.error("Error adding student:", err);
      return res.status(500).json({ success: false, message: "Error adding student" });
    }
  }

  // PUT - Update student
  if (req.method === "PUT") {
    try {
      const { student_number, name, grade_level, section } = req.body;

      if (!student_number || !name || !grade_level || !section) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      const students = JSON.parse(fs.readFileSync(studentsPath, "utf8"));

      if (!students[student_number]) {
        return res.status(404).json({ success: false, message: "Student not found" });
      }

      students[student_number] = { name, grade_level, section };
      fs.writeFileSync(studentsPath, JSON.stringify(students, null, 2));

      return res.status(200).json({ success: true, message: "Student updated successfully", students });
    } catch (err) {
      console.error("Error updating student:", err);
      return res.status(500).json({ success: false, message: "Error updating student" });
    }
  }

  // DELETE - Remove student
  if (req.method === "DELETE") {
    try {
      const { student_number } = req.body;

      if (!student_number) {
        return res.status(400).json({ success: false, message: "Missing student_number" });
      }

      const students = JSON.parse(fs.readFileSync(studentsPath, "utf8"));

      if (!students[student_number]) {
        return res.status(404).json({ success: false, message: "Student not found" });
      }

      delete students[student_number];
      fs.writeFileSync(studentsPath, JSON.stringify(students, null, 2));

      return res.status(200).json({ success: true, message: "Student deleted successfully", students });
    } catch (err) {
      console.error("Error deleting student:", err);
      return res.status(500).json({ success: false, message: "Error deleting student" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}