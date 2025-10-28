import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { student_number } = req.body;

    if (!student_number) {
      return res.status(400).json({ success: false, message: "Missing student_number" });
    }

    // ✅ 1. Load student info from local students.json
    const studentsPath = path.join(process.cwd(), "students.json");
    if (!fs.existsSync(studentsPath)) {
      return res.status(404).json({ success: false, message: "students.json not found" });
    }

    const students = JSON.parse(fs.readFileSync(studentsPath, "utf8"));
    const student = students[student_number];

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // ✅ 2. Prepare date and time
    const date = new Date();
    const currentDate = date.toISOString().split("T")[0];
    const currentTime = date.toTimeString().split(" ")[0];

    // ✅ 3. Check if student already marked in Supabase
    const { data: existing, error: existingError } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("student_number", student_number)
      .eq("date", currentDate);

    if (existingError) throw existingError;

    if (existing && existing.length > 0) {
      return res.status(200).json({
        success: true,
        message: `✅ Already marked: ${student.name} (${student_number})`
      });
    }

    // ✅ 4. Insert attendance record in Supabase
    const { error: insertError } = await supabase.from("attendance_records").insert([
      {
        date: currentDate,
        time: currentTime,
        student_number: student_number,
        student_name: student.name,
        grade_level: student.grade_level,
        section: student.section,
        status: "Present"
      }
    ]);

    if (insertError) throw insertError;

    return res.status(200).json({
      success: true,
      message: `🟢 Marked Present: ${student.name} (${student_number})`
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error — check logs or file permissions"
    });
  }
}
