from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple


MUMBAI_REGION = {"mumbai", "navi mumbai", "thane"}
DELHI_NCR_REGION = {"delhi", "gurugram", "noida"}
BENGALURU_REGION = {"bengaluru", "bangalore"}


PRIMARY_CONCEPT_KEYWORDS = {
    "healthcare": ["gnm", "anm", "healthcare assistant", "patient support", "vitals monitoring"],
    "tailoring": ["tailoring", "fashion design", "alteration", "stitching", "embroidery", "pattern making"],
    "bookkeeping": ["b.com", "tally", "bookkeeping", "invoice processing", "account reconciliation", "gst"],
    "qa_tech": ["bca", "bsc it", "programming", "software testing", "automation testing", "debugging", "sql", "python"],
    "digital": ["digital marketing", "social media", "content creation", "community management", "campaign coordination", "analytics", "canva"],
    "beauty": ["beautician", "skin care", "product knowledge", "hygiene management"],
    "retail_sales": ["retail operations", "store operations", "customer service", "merchandising", "sales"],
    "documentation": ["computer basics", "documentation", "typing", "record maintenance", "attention to detail"],
}


JOB_CONCEPT_KEYWORDS = {
    "healthcare": [
        "nursing assistant",
        "care assistant",
        "patient support",
        "clinic coordinator",
        "hygiene protocols",
        "patient coordination",
    ],
    "tailoring": [
        "tailor",
        "alteration specialist",
        "sampling tailor",
        "boutique assistant",
        "tailoring and alteration",
        "accurate body measurements",
        "machine operation",
        "basic quality checks",
        "fabric measurement",
    ],
    "bookkeeping": [
        "bookkeeper",
        "accounts coordinator",
        "accounts assistant",
        "finance executive",
        "monthly reconciliation",
        "invoice processing",
        "ledger maintenance",
    ],
    "qa_tech": [
        "test analyst",
        "junior qa engineer",
        "software support executive",
        "technical support associate",
        "basic scripting",
        "test case execution",
        "bug tracking",
        "issue resolution",
    ],
    "digital": [
        "community manager",
        "content coordinator",
        "social media executive",
        "digital marketing assistant",
        "campaign tracking",
        "social media posting",
        "content calendar planning",
        "basic ad operations",
    ],
    "beauty": [
        "beauty consultant",
        "beautician",
        "spa therapist",
        "salon associate",
        "service hygiene",
    ],
    "retail_sales": [
        "sales executive",
        "retail associate",
        "store assistant",
        "cashier",
        "customer handling",
        "basic sales reporting",
        "stock arrangement",
        "cash/pos operations",
    ],
    "documentation": [
        "documentation assistant",
        "mis assistant",
        "data entry operator",
        "basic documentation",
        "typing",
    ],
    "admin_support": [
        "front desk executive",
        "hotel coordinator",
        "appointment management",
        "booking management",
        "complaint resolution",
    ],
    "education": [
        "tutor",
        "primary teacher",
        "learning facilitator",
        "pre-school educator",
    ],
}


COMPATIBLE_CONCEPTS = {
    "healthcare": {"admin_support", "documentation"},
    "tailoring": {"retail_sales"},
    "bookkeeping": {"documentation", "admin_support", "retail_sales"},
    "qa_tech": {"documentation", "admin_support"},
    "digital": {"retail_sales", "admin_support"},
    "beauty": {"retail_sales"},
    "retail_sales": {"admin_support"},
    "documentation": {"admin_support", "bookkeeping"},
}


STOPWORDS = {
    "and",
    "for",
    "the",
    "with",
    "basic",
    "associate",
    "assistant",
    "executive",
    "specialist",
    "manager",
    "junior",
    "role",
}


def normalize_text(value: str) -> str:
    return " ".join((value or "").strip().lower().split())


def joined_text(parts: List[str]) -> str:
    return " | ".join(part for part in parts if part)


def contains_any(text: str, patterns: List[str]) -> bool:
    return any(pattern in text for pattern in patterns)


def city_region(city: str) -> str | None:
    city = normalize_text(city)
    if city in MUMBAI_REGION:
        return "mumbai_region"
    if city in DELHI_NCR_REGION:
        return "delhi_ncr"
    if city in BENGALURU_REGION:
        return "bengaluru_region"
    return None


def same_or_near_city(user_city: str, job_city: str) -> bool:
    user_city = normalize_text(user_city)
    job_city = normalize_text(job_city)
    if not user_city or not job_city:
        return False
    if user_city == job_city:
        return True
    user_region = city_region(user_city)
    job_region = city_region(job_city)
    return user_region is not None and user_region == job_region


def extract_concepts(text: str, keyword_map: Dict[str, List[str]]) -> Set[str]:
    concepts: Set[str] = set()
    for concept, keywords in keyword_map.items():
        if contains_any(text, keywords):
            concepts.add(concept)
    return concepts


def simple_tokenize(text: str) -> Set[str]:
    cleaned = []
    for char in text.lower():
        cleaned.append(char if char.isalnum() or char.isspace() else " ")
    tokens = {"".join(token) for token in "".join(cleaned).split()}
    return {token for token in tokens if len(token) > 2 and token not in STOPWORDS}


def user_text(record: Dict[str, Any]) -> Tuple[str, str]:
    user = record.get("user_summary", {})
    qualification = user.get("qualification", "")
    skills = user.get("skills", [])
    return qualification, joined_text([qualification, *skills])


def job_text(record: Dict[str, Any]) -> str:
    job = record.get("job_summary", {})
    return joined_text([job.get("job_title", ""), *job.get("requirements", [])])


def job_title_text(record: Dict[str, Any]) -> str:
    return normalize_text(record.get("job_summary", {}).get("job_title", ""))


def job_requirement_text(record: Dict[str, Any]) -> str:
    return normalize_text(joined_text(record.get("job_summary", {}).get("requirements", [])))


def user_primary_and_secondary_concepts(record: Dict[str, Any]) -> Tuple[str | None, Set[str]]:
    qualification, skill_text = user_text(record)
    qualification_text = normalize_text(qualification)
    primary = None
    for concept, keywords in PRIMARY_CONCEPT_KEYWORDS.items():
        if contains_any(qualification_text, keywords):
            primary = concept
            break
    secondary = extract_concepts(normalize_text(skill_text), PRIMARY_CONCEPT_KEYWORDS)
    return primary, secondary


def job_concepts(record: Dict[str, Any]) -> Set[str]:
    return extract_concepts(normalize_text(job_text(record)), JOB_CONCEPT_KEYWORDS)


def role_fit(record: Dict[str, Any]) -> Tuple[int, str]:
    primary, secondary = user_primary_and_secondary_concepts(record)
    title_concepts = extract_concepts(job_title_text(record), JOB_CONCEPT_KEYWORDS)
    concepts = job_concepts(record)
    user_skill_tokens = simple_tokenize(joined_text([user_text(record)[1]]))
    job_skill_tokens = simple_tokenize(job_text(record))
    token_overlap = len(user_skill_tokens & job_skill_tokens)

    if primary and primary in title_concepts:
        return 3, f"primary profile matches {primary.replace('_', ' ')} role family"

    if not primary and len(secondary & title_concepts) >= 1:
        return 3, "main visible skills align strongly with the job title"

    if primary and primary in concepts:
        return 2, f"user background partially aligns with {primary.replace('_', ' ')} requirements"

    if len(secondary & title_concepts) >= 1:
        matched = sorted(secondary & title_concepts)[0].replace("_", " ")
        return 2, f"user skills partially align with {matched} work"

    if len(secondary & concepts) >= 2:
        return 3, "multiple user skills align with the job family"

    if secondary & concepts:
        matched = sorted(secondary & concepts)[0].replace("_", " ")
        return 2, f"user skills partially align with {matched} work"

    if primary and primary in COMPATIBLE_CONCEPTS and title_concepts & COMPATIBLE_CONCEPTS[primary]:
        return 2, "job is adjacent to the user's main profile"

    if token_overlap >= 2:
        return 2, "several skills overlap with the job requirements"

    if token_overlap == 1:
        return 1, "only limited skill overlap is visible"

    return 0, "skill and role fit look weak from the available information"


def constraint_texts(record: Dict[str, Any]) -> List[str]:
    user = record.get("user_summary", {})
    return [normalize_text(item) for item in user.get("constraints", [])]


def benefit_text(record: Dict[str, Any]) -> str:
    job = record.get("job_summary", {})
    return normalize_text(joined_text(job.get("benefits", [])))


def job_type(record: Dict[str, Any]) -> str:
    return normalize_text(record.get("job_summary", {}).get("job_type", ""))


def job_location(record: Dict[str, Any]) -> str:
    return record.get("job_summary", {}).get("location", "")


def user_location(record: Dict[str, Any]) -> str:
    return record.get("user_summary", {}).get("location", "")


def job_supports_remote(record: Dict[str, Any]) -> bool:
    benefits = benefit_text(record)
    return job_type(record) == "remote" or "work from home options" in benefits


def job_supports_remote_or_hybrid(record: Dict[str, Any]) -> bool:
    benefits = benefit_text(record)
    return job_type(record) in {"remote", "hybrid"} or "work from home options" in benefits


def job_supports_part_time(record: Dict[str, Any]) -> bool:
    return job_type(record) == "part-time"


def job_supports_flex(record: Dict[str, Any]) -> bool:
    benefits = benefit_text(record)
    return contains_any(
        benefits,
        [
            "flexible working hours",
            "paid time off",
            "childcare support",
            "maternity leave",
            "rejoining support after career break",
        ],
    ) or job_supports_part_time(record)


def job_supports_safety(record: Dict[str, Any]) -> bool:
    benefits = benefit_text(record)
    return contains_any(
        benefits,
        [
            "safe transport support",
            "on-site security support",
            "anti-harassment grievance cell",
            "women leadership mentorship",
        ],
    )


def job_supports_health(record: Dict[str, Any]) -> bool:
    benefits = benefit_text(record)
    return contains_any(
        benefits,
        [
            "flexible working hours",
            "mental health counseling",
            "health insurance",
            "lactation room and wellness support",
        ],
    )


def job_has_shift_signal(record: Dict[str, Any]) -> bool:
    job = normalize_text(job_text(record))
    return "shift communication" in job or contains_any(
        job,
        [
            "nursing assistant",
            "care assistant",
            "patient support associate",
            "retail associate",
            "store assistant",
            "sales executive",
            "beauty consultant",
            "spa therapist",
            "salon associate",
            "hotel coordinator",
        ],
    )


def job_has_heavy_signal(record: Dict[str, Any]) -> bool:
    job = normalize_text(job_text(record))
    return "stock arrangement" in job or contains_any(job, ["store assistant", "retail associate"])


def detect_constraint_status(record: Dict[str, Any]) -> Tuple[bool, List[str], int]:
    constraints = constraint_texts(record)
    benefits = benefit_text(record)
    jtype = job_type(record)
    ucity = user_location(record)
    jcity = job_location(record)
    violation_reasons: List[str] = []
    support_points = 0

    if any("relocate" in constraint and ("नहीं" in constraint or "शक्य नाही" in constraint or "cannot" in constraint) for constraint in constraints):
        if same_or_near_city(ucity, jcity) or job_supports_remote(record):
            support_points += 1
        else:
            violation_reasons.append("job appears to require work outside the user's current city")

    if any(("remote" in constraint or "hybrid" in constraint) and ("चाहिए" in constraint or "हवे" in constraint or "need" in constraint) for constraint in constraints):
        if job_supports_remote_or_hybrid(record):
            support_points += 1
        else:
            violation_reasons.append("user needs remote or hybrid work but the job looks mostly on-site")

    if any("part-time" in constraint for constraint in constraints):
        if job_supports_part_time(record):
            support_points += 1
        else:
            violation_reasons.append("user asked for part-time work and this role is not part-time")

    if any(
        keyword in constraint
        for constraint in constraints
        for keyword in ["cannot work after 8 pm", "overnight shift", "late night", "रात में", "रात्री", "prefer day shift"]
    ):
        if "prefer day shift" in " | ".join(constraints):
            if job_supports_flex(record):
                support_points += 1
        elif job_has_shift_signal(record) and jtype != "remote":
            violation_reasons.append("job shows shift-work signals that may conflict with the user's time restriction")

    if any(keyword in constraint for constraint in constraints for keyword in ["heavy lifting", "heavy lifting tasks"]):
        if job_has_heavy_signal(record):
            violation_reasons.append("job may include physical stock or lifting duties")

    if any(keyword in constraint for constraint in constraints for keyword in ["safety", "cctv", "safe transport", "anti-harassment", "women-friendly workplace culture", "women-friendly"]):
        if job_supports_safety(record):
            support_points += 1

    if any(keyword in constraint for constraint in constraints for keyword in ["ergonomic seating", "short breaks", "health management", "health condition", "स्वास्थ्य"]):
        if job_supports_health(record):
            support_points += 1

    if any(keyword in constraint for constraint in constraints for keyword in ["weekly off", "flexible timing", "caregiving", "childcare", "maternity"]):
        if job_supports_flex(record):
            support_points += 1

    if any(keyword in constraint for constraint in constraints for keyword in ["shared device", "async communication", "low-bandwidth", "company-provided laptop"]):
        if job_supports_remote_or_hybrid(record):
            support_points += 1
        elif contains_any(normalize_text(job_text(record)), ["front desk", "customer handling", "appointment management", "cash/pos operations"]):
            violation_reasons.append("user needs async or remote-friendly work but the role looks more synchronous")

    if any("prefer location near jaipur" in constraint for constraint in constraints):
        if normalize_text(jcity) == "jaipur":
            support_points += 1

    if any("thane" in constraint for constraint in constraints):
        if same_or_near_city("thane", jcity):
            support_points += 1

    return bool(violation_reasons), violation_reasons, support_points


def annotate_record(record: Dict[str, Any]) -> Dict[str, Any]:
    labeled = dict(record)
    fit_score, fit_reason = role_fit(record)
    has_violation, violation_reasons, support_points = detect_constraint_status(record)
    job = record.get("job_summary", {})

    if has_violation:
        relevance = 0
        note = violation_reasons[0]
    elif fit_score >= 3 and support_points >= 1:
        relevance = 2
        note = f"strong role fit and useful support for constraints in a {job.get('job_type', '')} setup"
    elif fit_score >= 2:
        relevance = 1
        if support_points >= 1:
            note = f"{fit_reason}; role is workable but not ideal"
        else:
            note = f"{fit_reason}; support for constraints is limited"
    else:
        relevance = 0
        note = fit_reason

    if relevance == 2 and not same_or_near_city(user_location(record), job_location(record)) and not job_supports_remote(record):
        relevance = 1
        note = "role fit is good, but location practicality is not ideal"

    labeled["relevance"] = relevance
    labeled["constraint_violation"] = has_violation
    labeled["notes"] = note
    labeled["source"] = "ai_assisted_rubric_v1"
    labeled["label_reason_tags"] = sorted(
        {
            "hard_constraint_conflict" if has_violation else "",
            "strong_fit" if fit_score >= 3 else "",
            "moderate_fit" if fit_score == 2 else "",
            "weak_fit" if fit_score <= 1 else "",
            "constraint_support" if support_points > 0 else "",
        }
        - {""}
    )
    return labeled


def label_payload(payload: Any) -> Dict[str, Any]:
    if isinstance(payload, dict):
        records = payload.get("records", [])
        labeled_records = [annotate_record(record) for record in records]
        updated_payload = dict(payload)
        updated_payload["records"] = labeled_records
        updated_payload["annotation_metadata"] = {
            "method": "ai_assisted_rubric_v1",
            "generated_at": datetime.now().isoformat(),
            "warning": "These are AI-assisted draft labels created from the visible summaries and rubric rules. Human spot-checking is strongly recommended before presenting them as final manual gold labels.",
        }
        return updated_payload

    labeled_records = [annotate_record(record) for record in payload]
    return {
        "records": labeled_records,
        "annotation_metadata": {
            "method": "ai_assisted_rubric_v1",
            "generated_at": datetime.now().isoformat(),
            "warning": "These are AI-assisted draft labels created from the visible summaries and rubric rules. Human spot-checking is strongly recommended before presenting them as final manual gold labels.",
        },
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create AI-assisted draft labels for the manual gold annotation file.")
    parser.add_argument(
        "--input",
        default="backend/models/manual_gold_annotation_template.json",
        help="Path to the manual gold annotation template JSON file.",
    )
    parser.add_argument(
        "--output",
        default="backend/models/manual_gold_annotation_ai_assisted.json",
        help="Path to save the AI-assisted labeled JSON file.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)
    payload = json.loads(input_path.read_text(encoding="utf-8"))
    labeled_payload = label_payload(payload)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(labeled_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved AI-assisted labels to {output_path.resolve()}")
    print(f"Records labeled: {len(labeled_payload.get('records', []))}")


if __name__ == "__main__":
    main()
