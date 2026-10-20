import os
from PIL import Image, ImageDraw, ImageFont

def create_erd():
    width = 2650
    height = 1750
    # Use RGB to avoid any alpha blending / transparency artifacts
    img = Image.new("RGB", (width, height), (15, 23, 42)) # Dark slate (#0F172A)
    draw = ImageDraw.Draw(img)

    # Fonts
    font_dir = "C:/Windows/Fonts/"
    try:
        font_title = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 38)
        font_subtitle = ImageFont.truetype(os.path.join(font_dir, "segoeui.ttf"), 20)
        font_badge = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 14)
        font_card_title = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 18)
        font_card_tag = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 12)
        font_field = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 15) # Bold for readability
        font_field_regular = ImageFont.truetype(os.path.join(font_dir, "segoeui.ttf"), 15)
        font_type = ImageFont.truetype(os.path.join(font_dir, "consola.ttf"), 14)
        font_key = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 12)
        font_legend = ImageFont.truetype(os.path.join(font_dir, "segoeui.ttf"), 16)
        font_line_label = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 14)
    except:
        font_title = font_subtitle = font_badge = font_card_title = font_card_tag = font_field = font_field_regular = font_type = font_key = font_legend = font_line_label = ImageFont.load_default()

    # Subtle Grid background pattern
    grid_color = (26, 36, 56)
    for x in range(0, width, 50):
        draw.line([(x, 0), (x, height)], fill=grid_color, width=1)
    for y in range(0, height, 50):
        draw.line([(0, y), (width, y)], fill=grid_color, width=1)

    # Top Header Banner
    draw.rounded_rectangle([60, 30, width - 60, 160], radius=16, fill=(24, 33, 47), outline=(51, 65, 85), width=2)
    
    # Institution Badge
    badge_text = "PANGASINAN STATE UNIVERSITY — ASINGAN CAMPUS • SIA 101 SYSTEM INTEGRATION & ARCHITECTURE"
    draw.rounded_rectangle([85, 45, 840, 72], radius=6, fill=(30, 58, 138), outline=(59, 130, 246), width=1)
    draw.text((100, 49), badge_text, font=font_badge, fill=(191, 219, 254))

    draw.text((85, 82), "FEFAS Logical Entity-Relationship Diagram (ERD)", font=font_title, fill=(255, 255, 255))
    draw.text((85, 126), "Spewak's EAP Data Architecture Domain • MariaDB Relational Schema & Cryptographic Anonymization Topology", font=font_subtitle, fill=(148, 163, 184))

    # Entity definition structure
    entities = [
        {
            "name": "academic_periods",
            "tag": "ACADEMIC CYCLE",
            "header_color": (180, 83, 9),      # Amber (#B45309)
            "border_color": (245, 158, 11),
            "x": 620, "y": 200, "w": 410,
            "fields": [
                ("PK", "id", "INT AUTO_INCREMENT"),
                ("", "academic_year", "VARCHAR(20)"),
                ("", "semester", "ENUM('1st','2nd')"),
                ("", "is_active", "TINYINT(1) DEFAULT 0"),
                ("", "start_date", "DATE"),
                ("", "end_date", "DATE"),
                ("", "created_at", "TIMESTAMP")
            ]
        },
        {
            "name": "admins",
            "tag": "SECURITY / RBAC",
            "header_color": (5, 150, 105),     # Emerald (#059669)
            "border_color": (16, 185, 129),
            "x": 1260, "y": 200, "w": 410,
            "fields": [
                ("PK", "id", "INT AUTO_INCREMENT"),
                ("", "name", "VARCHAR(255)"),
                ("UK", "email", "VARCHAR(255)"),
                ("", "password", "VARCHAR(255) (bcrypt)"),
                ("", "email_verified", "TINYINT(1)"),
                ("", "verification_token", "VARCHAR(255) NULL"),
                ("", "created_at", "TIMESTAMP")
            ]
        },
        {
            "name": "password_resets",
            "tag": "AUTH AUXILIARY",
            "header_color": (194, 65, 12),     # Orange (#C2410C)
            "border_color": (249, 115, 22),
            "x": 1900, "y": 200, "w": 400,
            "fields": [
                ("PK", "id", "INT AUTO_INCREMENT"),
                ("", "email", "VARCHAR(255)"),
                ("", "token", "VARCHAR(255)"),
                ("", "expires_at", "DATETIME (60 min)"),
                ("", "created_at", "TIMESTAMP")
            ]
        },
        {
            "name": "students",
            "tag": "ACTOR / EVALUATOR",
            "header_color": (29, 78, 216),     # Blue (#1D4ED8)
            "border_color": (59, 130, 246),
            "x": 80, "y": 290, "w": 430,
            "fields": [
                ("PK", "id", "VARCHAR(36) (23-AS-XXXX)"),
                ("", "name", "VARCHAR(255)"),
                ("UK", "email", "VARCHAR(255) (@psu.edu.ph)"),
                ("", "password", "VARCHAR(255) (bcrypt)"),
                ("", "year_level", "VARCHAR(20)"),
                ("", "section", "VARCHAR(50)"),
                ("", "department", "VARCHAR(255)"),
                ("", "email_verified", "TINYINT(1)"),
                ("", "created_at", "TIMESTAMP")
            ]
        },
        {
            "name": "faculty",
            "tag": "ACTOR / EVALUATEE",
            "header_color": (29, 78, 216),     # Blue (#1D4ED8)
            "border_color": (59, 130, 246),
            "x": 2130, "y": 550, "w": 440,
            "fields": [
                ("PK", "id", "VARCHAR(36) (ASIN-XXXXXX)"),
                ("", "name", "VARCHAR(255)"),
                ("UK", "email", "VARCHAR(255) (@psu.edu.ph)"),
                ("", "password", "VARCHAR(255) (bcrypt)"),
                ("", "department", "VARCHAR(255)"),
                ("", "email_verified", "TINYINT(1)"),
                ("", "created_at", "TIMESTAMP")
            ]
        },
        {
            "name": "subjects",
            "tag": "ACADEMIC CATALOG",
            "header_color": (15, 118, 110),    # Teal (#0F766E)
            "border_color": (20, 184, 166),
            "x": 580, "y": 620, "w": 400,
            "fields": [
                ("PK", "id", "INT AUTO_INCREMENT"),
                ("UK", "code", "VARCHAR(20) (e.g. IT411)"),
                ("", "name", "VARCHAR(255)"),
                ("", "department", "VARCHAR(255)"),
                ("", "semester", "ENUM('1st','2nd','both')"),
                ("", "year_level", "VARCHAR(20)"),
                ("", "created_at", "TIMESTAMP")
            ]
        },
        {
            "name": "student_subjects",
            "tag": "ENROLLMENT JUNCTION (M:N)",
            "header_color": (67, 56, 202),     # Indigo (#4338CA)
            "border_color": (99, 102, 241),
            "x": 80, "y": 740, "w": 430,
            "fields": [
                ("PK", "id", "INT AUTO_INCREMENT"),
                ("FK", "student_id", "VARCHAR(36) -> students.id"),
                ("FK", "subject_id", "INT -> subjects.id"),
                ("FK", "faculty_id", "VARCHAR(36) NULL -> faculty.id"),
                ("UK", "(student_id, subject_id)", "UNIQUE KEY")
            ]
        },
        {
            "name": "faculty_subjects",
            "tag": "TEACHING LOAD (M:N)",
            "header_color": (67, 56, 202),     # Indigo (#4338CA)
            "border_color": (99, 102, 241),
            "x": 1640, "y": 590, "w": 410,
            "fields": [
                ("PK", "id", "INT AUTO_INCREMENT"),
                ("FK", "faculty_id", "VARCHAR(36) -> faculty.id"),
                ("FK", "subject_id", "INT -> subjects.id"),
                ("", "section", "VARCHAR(50) NULL"),
                ("UK", "(subject_id, section)", "UNIQUE KEY")
            ]
        },
        {
            "name": "evaluations",
            "tag": "CENTRAL CORE TRANSACTION",
            "header_color": (190, 24, 93),     # Rose/Pink (#BE185D)
            "border_color": (244, 63, 94),
            "x": 1070, "y": 560, "w": 490,
            "fields": [
                ("PK", "id", "INT AUTO_INCREMENT"),
                ("FK", "student_id", "VARCHAR(36) (Admin Audit Only)"),
                ("ENC", "anonymous_student_ref", "VARCHAR(255) (AES-256 Token)"),
                ("FK", "faculty_id", "VARCHAR(36) -> faculty.id"),
                ("FK", "academic_period_id", "INT -> academic_periods.id"),
                ("", "rating", "INT (1 to 5 Likert Mean)"),
                ("", "comment", "TEXT (Sanitized feedback)"),
                ("", "strengths", "TEXT (Positive remarks)"),
                ("", "weaknesses", "TEXT (Improvement areas)"),
                ("", "sentiment", "ENUM('positive','neutral','negative')"),
                ("", "sentiment_score", "DECIMAL(5,2) (-1.00 to +1.00)"),
                ("", "created_at", "TIMESTAMP")
            ]
        },
        {
            "name": "evaluation_responses",
            "tag": "ATOMIC LIKERT DETAIL",
            "header_color": (126, 34, 206),    # Purple (#7E22CE)
            "border_color": (168, 85, 247),
            "x": 1070, "y": 1180, "w": 490,
            "fields": [
                ("PK", "id", "INT AUTO_INCREMENT"),
                ("FK", "evaluation_id", "INT (ON DELETE CASCADE)"),
                ("FK", "question_id", "INT -> evaluation_questions.id"),
                ("", "rating", "INT (1 to 5 Likert Score)"),
                ("", "text_response", "TEXT NULL")
            ]
        },
        {
            "name": "evaluation_questions",
            "tag": "INSTRUMENT QUESTION BANK",
            "header_color": (13, 148, 136),    # Teal/Emerald (#0D9488)
            "border_color": (20, 184, 166),
            "x": 1690, "y": 1180, "w": 470,
            "fields": [
                ("PK", "id", "INT AUTO_INCREMENT"),
                ("", "category", "VARCHAR(100) (Pedagogy/Mgmt)"),
                ("", "question_type", "ENUM('rating','text')"),
                ("", "category_description", "TEXT NULL"),
                ("", "question", "TEXT (Standardized Indicator)"),
                ("", "sort_order", "INT DEFAULT 0"),
                ("", "is_active", "TINYINT(1) DEFAULT 1"),
                ("", "created_at", "TIMESTAMP")
            ]
        },
        {
            "name": "audit_logs",
            "tag": "GOVERNANCE & AUDIT",
            "header_color": (71, 85, 105),     # Slate (#475569)
            "border_color": (148, 163, 184),
            "x": 80, "y": 1220, "w": 430,
            "fields": [
                ("PK", "id", "INT AUTO_INCREMENT"),
                ("", "user_id", "VARCHAR(36) (Audited User)"),
                ("", "action", "VARCHAR(100) (LOGIN, SUBMIT)"),
                ("", "details", "TEXT (Context & Parameters)"),
                ("", "ip_address", "VARCHAR(45)"),
                ("", "created_at", "TIMESTAMP")
            ]
        }
    ]

    # Pre-calculate card heights
    for ent in entities:
        ent["h"] = 52 + len(ent["fields"]) * 30 + 10

    # Helper for drawing lines with arrows and labels
    def draw_rel(points, color, label="", dashed=False, label_pos=None):
        if dashed:
            for i in range(len(points) - 1):
                p1, p2 = points[i], points[i+1]
                dx, dy = p2[0] - p1[0], p2[1] - p1[1]
                dist = (dx**2 + dy**2)**0.5
                if dist == 0: continue
                ux, uy = dx/dist, dy/dist
                step = 14
                curr = 0
                while curr < dist:
                    x_start = p1[0] + ux * curr
                    y_start = p1[1] + uy * curr
                    curr += step * 0.6
                    x_end = p1[0] + ux * min(curr, dist)
                    y_end = p1[1] + uy * min(curr, dist)
                    draw.line([(x_start, y_start), (x_end, y_end)], fill=color, width=3)
                    curr += step * 0.4
        else:
            for i in range(len(points) - 1):
                draw.line([points[i], points[i+1]], fill=color, width=3)

        # Arrow polygon at end
        p_end = points[-1]
        p_prev = points[-2]
        dx, dy = p_end[0] - p_prev[0], p_end[1] - p_prev[1]
        length = (dx**2 + dy**2)**0.5
        if length > 0:
            ux, uy = dx/length, dy/length
            arrow_size = 10
            left_x = p_end[0] - ux * arrow_size - uy * (arrow_size * 0.6)
            left_y = p_end[1] - uy * arrow_size + ux * (arrow_size * 0.6)
            right_x = p_end[0] - ux * arrow_size + uy * (arrow_size * 0.6)
            right_y = p_end[1] - uy * arrow_size - ux * (arrow_size * 0.6)
            draw.polygon([(p_end[0], p_end[1]), (left_x, left_y), (right_x, right_y)], fill=color)

        if label and label_pos:
            tw = font_line_label.getlength(label)
            th = 18
            lx, ly = label_pos
            draw.rounded_rectangle([lx - 8, ly - 4, lx + tw + 8, ly + th + 4], radius=4, fill=(15, 23, 42), outline=color, width=1)
            draw.text((lx, ly), label, font=font_line_label, fill=color)

    # 1. academic_periods -> evaluations (Amber)
    draw_rel([(825, 475), (825, 520), (1200, 520), (1200, 555)], (245, 158, 11), "1:N (Scopes Period)", label_pos=(860, 495))

    # 2. students -> student_subjects (Blue)
    draw_rel([(295, 615), (295, 735)], (59, 130, 246), "1:N (Enrollment)", label_pos=(305, 665))

    # 3. subjects -> student_subjects (Teal)
    draw_rel([(580, 830), (515, 830)], (20, 184, 166), "1:N (Course Code)", label_pos=(525, 800))

    # 4. subjects -> faculty_subjects (Teal)
    draw_rel([(980, 720), (1030, 720), (1030, 1030), (1600, 1030), (1600, 720), (1635, 720)], (20, 184, 166), "1:N (Course Offerings)", label_pos=(1050, 1035))

    # 5. faculty -> faculty_subjects (Blue)
    draw_rel([(2130, 720), (2055, 720)], (59, 130, 246), "1:N (Teaches)", label_pos=(2060, 690))

    # 6. faculty -> evaluations (Blue)
    draw_rel([(2130, 620), (2080, 620), (2080, 520), (1500, 520), (1500, 555)], (59, 130, 246), "1:N (Evaluatee)", label_pos=(1600, 495))

    # 7. students -> evaluations (Gold Dashed - Cryptographic Anonymization)
    draw_rel([(510, 440), (1030, 440), (1030, 650), (1065, 650)], (245, 158, 11), "1:N (Crypto-Decoupled Anonymity)", dashed=True, label_pos=(580, 445))

    # 8. evaluations -> evaluation_responses (Purple)
    draw_rel([(1315, 990), (1315, 1175)], (168, 85, 247), "1:N (Cascade Delete)", label_pos=(1325, 1075))

    # 9. evaluation_questions -> evaluation_responses (Emerald)
    draw_rel([(1690, 1280), (1565, 1280)], (16, 185, 129), "1:N (Instrument Items)", label_pos=(1575, 1250))

    # Render Entity Cards
    for ent in entities:
        x, y, w, h = ent["x"], ent["y"], ent["w"], ent["h"]

        # Card container
        draw.rounded_rectangle([x, y, x + w, y + h], radius=10, fill=(24, 33, 47), outline=ent["border_color"], width=2)

        # Header background
        draw.rounded_rectangle([x, y, x + w, y + 44], radius=10, fill=ent["header_color"])
        draw.rectangle([x, y + 26, x + w, y + 44], fill=ent["header_color"]) # square bottom corners

        # Card Title & Tag
        draw.text((x + 14, y + 11), ent["name"], font=font_card_title, fill=(255, 255, 255))
        tag_w = font_card_tag.getlength(ent["tag"])
        draw.rounded_rectangle([x + w - tag_w - 24, y + 11, x + w - 10, y + 33], radius=4, fill=(15, 23, 42))
        draw.text((x + w - tag_w - 17, y + 14), ent["tag"], font=font_card_tag, fill=(241, 245, 249))

        # Field Rows
        curr_y = y + 54
        for idx, (ktype, fname, ftype) in enumerate(ent["fields"]):
            # Solid alternating row background (No transparency!)
            if idx % 2 == 1:
                draw.rectangle([x + 2, curr_y - 2, x + w - 2, curr_y + 26], fill=(33, 46, 65))
            else:
                draw.rectangle([x + 2, curr_y - 2, x + w - 2, curr_y + 26], fill=(24, 33, 47))

            # Key badge
            if ktype == "PK":
                draw.rounded_rectangle([x + 12, curr_y + 2, x + 38, curr_y + 20], radius=3, fill=(234, 179, 8))
                draw.text((x + 16, curr_y + 3), "PK", font=font_key, fill=(0, 0, 0))
            elif ktype == "FK":
                draw.rounded_rectangle([x + 12, curr_y + 2, x + 38, curr_y + 20], radius=3, fill=(59, 130, 246))
                draw.text((x + 17, curr_y + 3), "FK", font=font_key, fill=(255, 255, 255))
            elif ktype == "UK":
                draw.rounded_rectangle([x + 12, curr_y + 2, x + 38, curr_y + 20], radius=3, fill=(16, 185, 129))
                draw.text((x + 16, curr_y + 3), "UK", font=font_key, fill=(255, 255, 255))
            elif ktype == "ENC":
                draw.rounded_rectangle([x + 10, curr_y + 2, x + 42, curr_y + 20], radius=3, fill=(244, 63, 94))
                draw.text((x + 13, curr_y + 3), "ENC", font=font_key, fill=(255, 255, 255))

            # Field name: Pure crisp white
            draw.text((x + 50, curr_y + 3), fname, font=font_field, fill=(255, 255, 255))
            
            # Type on right: Bright sky blue (#7DD3FC) for maximum contrast and legibility
            tw = font_type.getlength(ftype)
            draw.text((x + w - tw - 16, curr_y + 4), ftype, font=font_type, fill=(125, 211, 252))

            curr_y += 30

    # Legend at bottom right
    leg_x = width - 780
    leg_y = height - 120
    draw.rounded_rectangle([leg_x, leg_y, width - 60, height - 35], radius=10, fill=(24, 33, 47), outline=(51, 65, 85), width=2)
    
    items = [
        ("PK", (234, 179, 8), "Primary Key"),
        ("FK", (59, 130, 246), "Foreign Key"),
        ("UK", (16, 185, 129), "Unique Key"),
        ("ENC", (244, 63, 94), "AES-256 Token"),
    ]
    cur_lx = leg_x + 20
    for tag, col, desc in items:
        draw.rounded_rectangle([cur_lx, leg_y + 16, cur_lx + 32, leg_y + 33], radius=3, fill=col)
        draw.text((cur_lx + 5, leg_y + 17), tag, font=font_key, fill=(0,0,0) if tag=="PK" else (255,255,255))
        draw.text((cur_lx + 38, leg_y + 16), desc, font=font_legend, fill=(226, 232, 240))
        cur_lx += 140

    draw.line([(cur_lx + 10, leg_y + 25), (cur_lx + 40, leg_y + 25)], fill=(245, 158, 11), width=3)
    draw.text((cur_lx + 46, leg_y + 16), "Decoupled Anonymity", font=font_legend, fill=(226, 232, 240))

    # Save output
    output_path = "FEFAS_Entity_Relationship_Diagram.png"
    img.save(output_path, "PNG")
    print(f"High-resolution ERD diagram generated successfully: {output_path} ({os.path.getsize(output_path)} bytes)")

if __name__ == "__main__":
    create_erd()
