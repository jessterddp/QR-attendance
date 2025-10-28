import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    res.setHeader("Content-Type", "application/json");

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        message: "Missing Supabase environment variables",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method !== "POST") {
      return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ success: false, message: "Invalid JSON body" });
      }
    }

    const { student_number } = body || {};
    if (!student_number) {
      return res.status(400).json({ success: false, message: "Missing student_number" });
    }

    const { data: student, error: findError } = await supabase
      .from("students")
      .select("*")
      .eq("student_number", student_number)
      .single();

    if (findError || !student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const date = new Date().toISOString().split("T")[0];
    const time = new Date().toTimeString().split(" ")[0];

    const { data: existing, error: checkError } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("student_number", student_number)
      .eq("date", date)
      .maybeSingle();

    if (checkError) {
      return res.status(500).json({ success: false, message: "Error checking attendance" });
    }

    if (existing) {
      return res.status(200).json({
        success: true,
        message: `${student.name} already marked present today.`,
      });
    }

    const { error: insertError } = await supabase.from("attendance_records").insert([
      {
        date,
        time,
        student_number,
        status: "Present",
      },
    ]);

    if (insertError) {
      return res.status(500).json({ success: false, message: "Failed to insert attendance" });
    }

    return res.status(200).json({
      success: true,
      message: `Marked present: ${student.name}`,
    });
  } catch (err) {
    console.error("Unhandled error:", err);
    try {
      res.status(500).json({ success: false, message: "Server error", error: err.message });
    } catch {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "Server error (fallback)" }));
    }
  }
}
