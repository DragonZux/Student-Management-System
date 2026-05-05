from typing import Dict, Optional, Tuple, Any

def get_grading_config():
    """
    Returns the standard mapping configuration for easy verification.
    """
    return [
        {"min": 9.0, "max": 10.0, "letter": "A+", "point": 4.0, "desc": "Xuất sắc"},
        {"min": 8.5, "max": 8.9,  "letter": "A",  "point": 4.0, "desc": "Giỏi"},
        {"min": 8.0, "max": 8.4,  "letter": "B+", "point": 3.5, "desc": "Khá giỏi"},
        {"min": 7.0, "max": 7.9,  "letter": "B",  "point": 3.0, "desc": "Khá"},
        {"min": 6.5, "max": 6.9,  "letter": "C+", "point": 2.5, "desc": "Trung bình khá"},
        {"min": 5.5, "max": 6.4,  "letter": "C",  "point": 2.0, "desc": "Trung bình"},
        {"min": 5.0, "max": 5.4,  "letter": "D+", "point": 1.5, "desc": "Trung bình yếu"},
        {"min": 4.0, "max": 4.9,  "letter": "D",  "point": 1.0, "desc": "Yếu (Ngưỡng đạt)"},
        {"min": 0.0, "max": 3.9,  "letter": "F",  "point": 0.0, "desc": "Kém (Trượt)"},
    ]

def map_score_to_letter(score_10: float) -> Dict[str, Any]:
    """
    Converts a 10-point scale score to a full grade info object.
    """
    config = get_grading_config()
    # Ensure score is within 0-10
    val = max(0.0, min(10.0, round(score_10, 1)))
    
    for grade in config:
        if val >= grade["min"]:
            return {
                "score_10": val,
                "letter": grade["letter"],
                "point_4": grade["point"],
                "is_passed": grade["letter"] != "F",
                "description": grade["desc"]
            }
    
    # Fallback for unexpected values
    return {"score_10": val, "letter": "F", "point_4": 0.0, "is_passed": False, "description": "Kém"}

def calculate_enrollment_grade(
    attendance: float,
    midterm: float,
    final: float,
    weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    The main logic to calculate a student's final grade.
    Verify this formula: Final = (Att * W1) + (Mid * W2) + (Fin * W3)
    """
    if not weights:
        weights = {"attendance": 0.1, "midterm": 0.3, "final": 0.6}
    
    # Calculate weighted average
    raw_final = (
        attendance * weights.get("attendance", 0.1) +
        midterm * weights.get("midterm", 0.3) +
        final * weights.get("final", 0.6)
    )
    
    # Map to letter grade
    grade_info = map_score_to_letter(raw_final)
    
    # Return full audit data
    return {
        "components": {
            "attendance": attendance,
            "midterm": midterm,
            "final": final
        },
        "weights": weights,
        "result": grade_info
    }
