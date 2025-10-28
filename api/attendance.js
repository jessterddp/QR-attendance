import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { student_number } = req.body;
    if (!student_number)
      return res.status(400).json({ success: false, message: "Missing student_number" });

    // Load local students.json
    const students = await import("../../students.json", { assert: { type: "json" } });
    const student = students.default[student_number];
    if (!student)
      return res.status(404).json({ success: false, message: "Student not found" });

    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().split(" ")[0];

    // Check if already marked today
    const { data: existing, error: fetchError } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("date", currentDate)
      .eq("student_number", student_number);

    if (fetchError) throw fetchError;
    if (existing.length > 0) {
      return res.status(200).json({
        success: true,
        message: `✅ Already marked: ${student.name} (${student_number})`,
      });
    }

    // Insert new record
    const { error: insertError } = await supabase.from("attendance_records").insert([
      {
        date: currentDate,
        time: currentTime,
        student_number,
        student_name: student.name,
        grade_level: student.grade_level,
        section: student.section,
        status: "Present",
      },
    ]);

    if (insertError) throw insertError;

    return res.status(200).json({
      success: true,
      message: `🟢 Marked Present: ${student.name} (${student_number})`,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error — unable to save attendance",
    });
  }
}
