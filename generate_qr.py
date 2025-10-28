import json
import os
import qrcode
from PIL import Image, ImageDraw, ImageFont

# File paths
students_file = "students.json"
output_folder = "qrcodes"

# Create output folder if it doesn't exist
os.makedirs(output_folder, exist_ok=True)

# Load student data
with open(students_file, "r") as f:
    students = json.load(f)

# Optional: use a font (make sure the font exists on your system)
try:
    font = ImageFont.truetype("arial.ttf", 20)
except:
    font = ImageFont.load_default()

for student_number, info in students.items():
    # Encode only the student number in QR
    qr_data = student_number
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)

    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    # Add student name text under the QR code
    width, height = qr_img.size
    new_height = height + 60
    final_img = Image.new("RGB", (width, new_height), "white")
    final_img.paste(qr_img, (0, 0))

    draw = ImageDraw.Draw(final_img)
    text = f"{info['name']}\n{info['grade_level']} - {info['section']}"

    # ✅ Compatible text size calculation
    try:
        # Pillow 10+
        bbox = draw.textbbox((0, 0), text, font=font)
        text_w, text_h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    except AttributeError:
        # Older Pillow
        text_w, text_h = draw.textsize(text, font=font)

    text_x = (width - text_w) // 2
    text_y = height + 5
    draw.text((text_x, text_y), text, fill="black", font=font)

    # Save the QR code image
    filename = f"{info['name'].replace(' ', '_')}_{student_number}.png"
    filepath = os.path.join(output_folder, filename)
    final_img.save(filepath)

    print(f"✅ Generated: {filepath}")

print("\nAll QR codes have been generated successfully!")
