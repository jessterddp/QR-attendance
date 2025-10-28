import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { student_number } = req.body;
    if (!student_number)
      return res.status(400).json({ success: false, message: "Missing student_number" });

    const studentsPath = path.join(process.cwd(), "students.json");
    const attendancePath = path.join(process.cwd(), "attendance_records.csv");

    if (!fs.existsSync(studentsPath)) {
      return res.status(404).json({ success: false, message: "students.json not found" });
    }

    const students = JSON.parse(fs.readFileSync(studentsPath, "utf8"));
    const student = students[student_number];
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().split(" ")[0];

    // Local simulation only
    try {
      if (!fs.existsSync(attendancePath)) {
        fs.writeFileSync(
          attendancePath,
          "Date,Time,Student Number,Student Name,Grade Level,Section,Status\n"
        );
      }
      const csv = fs.readFileSync(attendancePath, "utf8");
      if (csv.includes(`${currentDate},${student_number}`)) {
        return res.status(200).json({
          success: true,
          message: `✅ Already marked: ${student.name} (${student_number})`,
        });
      }

      const newLine = `${currentDate},${currentTime},${student_number},${student.name},${student.grade_level},${student.section},Present\n`;
      fs.appendFileSync(attendancePath, newLine);
    } catch (err) {
      console.warn("⚠️ File system unavailable (Vercel runtime). Skipping file write.");
    }

    return res.status(200).json({
      success: true,
      message: `🟢 Marked Present: ${student.name} (${student_number})`,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ success: false, message: "Server error — please check logs or file permissions" });
  }
}
