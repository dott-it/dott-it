#!/usr/bin/env python3
"""Extract IngestedUnitManifest rows from content-pipeline processed JSON."""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

AO_PATTERN = re.compile(r"ASSESSMENT OPPORTUNITY", re.I)
BUILDING_PATTERN = re.compile(r"Building towards:\s*", re.I)
LOOK_PATTERN = re.compile(r"What to (?:look/listen for|look for|listen for):?\s*", re.I)
DO_PATTERN = re.compile(r"What to do:\s*", re.I)
PE_PATTERN = re.compile(r"Building towards:\s*(\d+\.[A-Z0-9]+)", re.I)
BOUNDARY_PATTERN = re.compile(
    r"(?:^|\n)(?:\d+\s*·\s|End of day\b|MATERIALS:|ADDITIONAL GUIDANCE|KEY IDEAS|ALTERNATE ACTIVITY)",
    re.I,
)

# 8.1-specific handouts treated as formal assessments (Jess ingest rules)
EXTRA_HANDOUT_ASSESSMENTS: dict[int, dict[str, Any]] = {
    7: {
        "fileMatch": re.compile(r"Handout Looking back Explaining", re.I),
        "title": "Looking Back — Explaining Collisions",
        "assessmentType": "lesson-reflection",
        "isSummative": False,
    },
    8: {
        "fileMatch": re.compile(r"Handout Modeling other force", re.I),
        "keyMatch": re.compile(r"Answer Key Key for modeling", re.I),
        "title": "Modeling Other Force Interactions",
        "assessmentType": "formative",
        "isSummative": False,
    },
    14: {
        "fileMatch": re.compile(r"Handout Stakeholder Feedback Form", re.I),
        "title": "Stakeholder Feedback Form",
        "assessmentType": "peer-feedback",
        "isSummative": False,
    },
}


def unit_id_prefix(unit_id: str) -> str:
    return unit_id.replace(".", "")


def lesson_file_prefix(unit_id: str, lesson_num: int) -> str:
    return f"{unit_id} Lesson {lesson_num}"


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def extract_pe_code(building: str) -> str | None:
    match = PE_PATTERN.search(building)
    return match.group(1) if match else None


def classify_assessment_type(building: str, look: str, what_to_do: str, title: str = "") -> str:
    blob = f"{building} {look} {what_to_do} {title}".lower()
    if any(
        k in blob
        for k in ("performance task", "cheerleading headgear", "cheerleading assessment", "end-of-unit")
    ) or re.search(r"part [12][:\s].*assessment", blob):
        return "summative"
    if "pre-assessment" in blob or "pre assessment" in blob:
        return "pre-assessment"
    if "looking back" in blob or "lesson reflection" in blob:
        return "lesson-reflection"
    if "peer feedback" in blob or "stakeholder feedback" in blob or "feedback form" in blob:
        return "peer-feedback"
    return "formative"


def short_title_from_fields(building: str, look: str, lesson_num: int, index: int) -> str:
    look_match = re.search(
        r"(?:look/listen for|look for|listen for):?\s*(.{12,58}?)(?:\.|$)", look, re.I | re.S
    )
    if look_match:
        return look_match.group(1).strip()[:58]
    building_body = re.sub(r"^Building towards:\s*\d+\.[A-Z0-9]+\s*", "", building, flags=re.I).strip()
    if building_body:
        clause = re.split(r"[.—]\s+", building_body)[0].strip()
        if len(clause) > 8:
            return clause[:58]
    return f"Lesson {lesson_num:02d} · Check-in {index}"


def title_from_assessment_file(unit_id: str, lesson_num: int, filename: str) -> str:
    title = filename.replace(".docx.json", "")
    title = re.sub(rf"^{re.escape(unit_id)} Lesson \d+ Assessment\s*", "", title, flags=re.I).strip()
    part_match = re.match(r"^Part (\d+) Cheerleading$", title, re.I)
    if part_match:
        return f"Cheerleading Performance Task (Part {part_match.group(1)})"
    return title


def extract_opportunities_from_text(
    page_content: str,
    lesson_num: int,
    unit_id: str,
    id_prefix: str,
) -> list[dict[str, Any]]:
    opportunities: list[dict[str, Any]] = []
    matches = list(AO_PATTERN.finditer(page_content))
    if not matches:
        return opportunities

    for index, match in enumerate(matches, start=1):
        start = match.end()
        end = matches[index].start() if index < len(matches) else len(page_content)
        block = page_content[start:end].strip()

        boundary = BOUNDARY_PATTERN.search(block)
        if boundary:
            block = block[: boundary.start()].strip()

        building = ""
        look = ""
        what_to_do = ""

        building_match = BUILDING_PATTERN.search(block)
        if building_match:
            after = block[building_match.start() :]
            look_match = LOOK_PATTERN.search(after)
            do_match = DO_PATTERN.search(after)
            stops = [m.start() for m in (look_match, do_match) if m]
            stop = min(stops) if stops else len(after)
            building = after[:stop].strip()

        look_match = LOOK_PATTERN.search(block)
        if look_match:
            after = block[look_match.start() :]
            do_match = DO_PATTERN.search(after)
            stop = do_match.start() if do_match else len(after)
            look = after[:stop].strip()

        do_match = DO_PATTERN.search(block)
        if do_match:
            what_to_do = block[do_match.start() :].strip()
            boundary = BOUNDARY_PATTERN.search(what_to_do)
            if boundary:
                what_to_do = what_to_do[: boundary.start()].strip()

        if not building and not look:
            if len(block) < 80:
                continue
            what_to_do = what_to_do or block[:500].strip()

        short = short_title_from_fields(building, look, lesson_num, index)
        raw_type = classify_assessment_type(building, look, what_to_do, short)
        assessment_type = None if raw_type in ("formative", "lesson-reflection") else raw_type

        row: dict[str, Any] = {
            "id": f"{id_prefix}-{lesson_num}-ao-{index}",
            "lesson": f"Lesson {lesson_num:02d}",
            "lessonNum": lesson_num,
            "source": "te-opportunity",
            "title": short,
            "shortTitle": short,
            "peCode": extract_pe_code(building),
            "buildingTowards": building or None,
            "lookListenFor": look or None,
            "whatToDo": what_to_do or None,
            "isSummative": raw_type == "summative",
            "description": (
                f"OpenSciEd Unit {unit_id} Lesson {lesson_num:02d} — "
                "assessment opportunity from Teacher Edition."
            ),
            "files": {
                "studentHandout": None,
                "teacherGuide": None,
                "answerKey": None,
                "googleForm": None,
                "rubric": None,
            },
        }
        if assessment_type:
            row["assessmentType"] = assessment_type
        opportunities.append(row)

    return opportunities


def is_english_file(name: str) -> bool:
    return "Lección" not in name and "Lecci" not in name


def list_lesson_dirs(processed_root: Path) -> list[Path]:
    return sorted(
        [p for p in processed_root.iterdir() if p.is_dir() and re.match(r"Lesson \d+", p.name)],
        key=lambda p: int(re.search(r"Lesson (\d+)", p.name).group(1)),
    )


def find_teacher_edition_json(lesson_dir: Path, unit_id: str) -> Path | None:
    matches = [
        p
        for p in lesson_dir.glob("*.json")
        if "Teacher Edition" in p.name and unit_id in p.name and is_english_file(p.name)
    ]
    return matches[0] if matches else None


def match_answer_key(assessment_name: str, key_files: list[Path]) -> Path | None:
    if not key_files:
        return None
    if "Part 1" in assessment_name:
        return next((k for k in key_files if "Part 1" in k.name), key_files[0])
    if "Part 2" in assessment_name:
        return next((k for k in key_files if "Part 2" in k.name), key_files[0])
    if "Soccer" in assessment_name:
        return next((k for k in key_files if "Soccer" in k.name), key_files[0])
    if "Assessment 1" in assessment_name:
        return next((k for k in key_files if "Key 1" in k.name), key_files[0])
    if "Assessment 2" in assessment_name:
        return next((k for k in key_files if "Key 2" in k.name), key_files[0])
    return key_files[0]


def list_formal_assessments(
    lesson_dir: Path,
    lesson_num: int,
    unit_id: str,
    id_prefix: str,
    te_rel: str | None,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    json_files = [p for p in lesson_dir.glob("*.json") if is_english_file(p.name)]

    assessment_files = [
        p
        for p in json_files
        if re.search(r"Assessment", p.name, re.I)
        and "Answer Key" not in p.name
        and "Teacher Edition" not in p.name
        and unit_id in p.name
    ]
    key_files = [p for p in json_files if "Answer Key" in p.name]

    for af in assessment_files:
        title = title_from_assessment_file(unit_id, lesson_num, af.name)
        is_summative = lesson_num == 15 or "Cheerleading" in title
        key = match_answer_key(af.name, key_files)
        rows.append(
            {
                "id": f"{id_prefix}-{lesson_num}-{slugify(title)}",
                "lesson": f"Lesson {lesson_num:02d}",
                "lessonNum": lesson_num,
                "source": "formal-assessment",
                "title": title,
                "assessmentType": "summative" if is_summative else "formative",
                "isSummative": is_summative,
                "description": f"OpenSciEd Unit {unit_id} Lesson {lesson_num:02d} — {title}.",
                "files": {
                    "studentHandout": af.name.replace(".json", ""),
                    "teacherGuide": te_rel,
                    "answerKey": key.name.replace(".json", "") if key else None,
                    "googleForm": None,
                    "rubric": None,
                },
            }
        )

    extra = EXTRA_HANDOUT_ASSESSMENTS.get(lesson_num) if unit_id == "8.1" else None
    if extra:
        handout = next((p for p in json_files if extra["fileMatch"].search(p.name)), None)
        if handout:
            key = (
                next((p for p in json_files if extra.get("keyMatch") and extra["keyMatch"].search(p.name)), None)
                if extra.get("keyMatch")
                else None
            )
            rows.append(
                {
                    "id": f"{id_prefix}-{lesson_num}-{slugify(extra['title'])}",
                    "lesson": f"Lesson {lesson_num:02d}",
                    "lessonNum": lesson_num,
                    "source": "formal-assessment",
                    "title": extra["title"],
                    "assessmentType": extra["assessmentType"],
                    "isSummative": extra.get("isSummative", False),
                    "description": f"OpenSciEd Unit {unit_id} Lesson {lesson_num:02d} — {extra['title']}.",
                    "files": {
                        "studentHandout": handout.name.replace(".json", ""),
                        "teacherGuide": te_rel,
                        "answerKey": key.name.replace(".json", "") if key else None,
                        "googleForm": None,
                        "rubric": None,
                    },
                }
            )

    return rows


def ingest_unit(
    processed_root: Path,
    unit_id: str,
    unit_title: str,
    description: str,
    standards: list[str],
) -> dict[str, Any]:
    id_prefix = unit_id_prefix(unit_id)
    lesson_dirs = list_lesson_dirs(processed_root)
    lessons: list[dict[str, Any]] = []
    assessments: list[dict[str, Any]] = []

    for lesson_dir in lesson_dirs:
        lesson_num = int(re.search(r"Lesson (\d+)", lesson_dir.name).group(1))
        te_json = find_teacher_edition_json(lesson_dir, unit_id)
        te_rel = te_json.name.replace(".json", "") if te_json else None

        lessons.append(
            {
                "lessonNum": lesson_num,
                "title": f"Lesson {lesson_num}",
                "teacherEditionPath": te_rel,
            }
        )

        if te_json:
            page_content = json.loads(te_json.read_text(encoding="utf-8")).get("page_content", "")
            assessments.extend(
                extract_opportunities_from_text(page_content, lesson_num, unit_id, id_prefix)
            )

        formal_rows = list_formal_assessments(lesson_dir, lesson_num, unit_id, id_prefix, te_rel)
        for row in formal_rows:
            row["standards"] = standards
        assessments.extend(formal_rows)

    for row in assessments:
        if row.get("source") == "te-opportunity" and "standards" not in row:
            row["standards"] = standards

    packaged_handouts = {
        row["files"]["studentHandout"]
        for row in assessments
        if row.get("source") == "formal-assessment" and row["files"].get("studentHandout")
    }
    assessments = [
        row
        for row in assessments
        if not (
            row.get("source") == "te-opportunity"
            and row["files"].get("studentHandout")
            and row["files"]["studentHandout"] in packaged_handouts
        )
    ]

    assessments.sort(
        key=lambda row: (
            row["lessonNum"],
            0 if row["source"] == "formal-assessment" else 1,
            row.get("title") or "",
        )
    )

    return {
        "unitId": unit_id,
        "unitTitle": unit_title,
        "description": description,
        "lessonCount": len(lesson_dirs),
        "ingestedFrom": str(processed_root),
        "ingestedAt": datetime.now(timezone.utc).isoformat(),
        "lessons": lessons,
        "assessments": assessments,
    }


def main() -> None:
    if len(sys.argv) < 6:
        print(
            "Usage: extract-from-content-pipeline.py "
            "<processed-unit-dir> <output.json> <unit-id> <unit-title> <description>",
            file=sys.stderr,
        )
        sys.exit(1)

    processed_root = Path(sys.argv[1])
    out_path = Path(sys.argv[2])
    unit_id = sys.argv[3]
    unit_title = sys.argv[4]
    description = sys.argv[5]
    standards = json.loads(sys.argv[6]) if len(sys.argv) > 6 else ["MS-PS2-1", "MS-PS2-2"]

    manifest = ingest_unit(processed_root, unit_id, unit_title, description, standards)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    te_opps = [a for a in manifest["assessments"] if a["source"] == "te-opportunity"]
    formal = [a for a in manifest["assessments"] if a["source"] == "formal-assessment"]
    print(
        f"Wrote {len(manifest['assessments'])} rows "
        f"({len(te_opps)} TE opportunities, {len(formal)} formal) → {out_path}"
    )


if __name__ == "__main__":
    main()
