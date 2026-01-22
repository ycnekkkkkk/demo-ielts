from typing import Dict, Any
from app.services.gemini_service import GeminiService
from app.models.test_session import Phase
import json
import re


class ScoringService:
    """Service for scoring test phases using Gemini"""

    # IELTS Band conversion tables (adjusted for test: 20 questions total)
    # Note: raw_score = 0 means no answers or all wrong → band = 0.0 (not 2.5)
    # Based on 20 questions (4 sections x 5 questions each)
    # Scaled to IELTS standard: 0-9.0 bands, where 100% = 9.0
    # Even distribution: scaled from 40-question standard
    LISTENING_BANDS = {
        0: 0.0,  # No answers or all wrong = 0.0
        1: 2.5,  # 1/20 = 5% → 2.5 band
        2: 2.5,  # 2/20 = 10% → 2.5 band
        3: 3.0,  # 3/20 = 15% → 3.0 band
        4: 3.5,  # 4/20 = 20% → 3.5 band
        5: 4.0,  # 5/20 = 25% → 4.0 band
        6: 4.5,  # 6/20 = 30% → 4.5 band
        7: 5.0,  # 7/20 = 35% → 5.0 band
        8: 5.5,  # 8/20 = 40% → 5.5 band
        9: 6.0,  # 9/20 = 45% → 6.0 band
        10: 6.5,  # 10/20 = 50% → 6.5 band
        11: 7.0,  # 11/20 = 55% → 7.0 band
        12: 7.5,  # 12/20 = 60% → 7.5 band
        13: 8.0,  # 13/20 = 65% → 8.0 band
        14: 8.5,  # 14/20 = 70% → 8.5 band
        15: 9.0,  # 15/20 = 75% → 9.0 band
        16: 9.0,  # 16/20 = 80% → 9.0 band
        17: 9.0,  # 17/20 = 85% → 9.0 band
        18: 9.0,  # 18/20 = 90% → 9.0 band
        19: 9.0,  # 19/20 = 95% → 9.0 band
        20: 9.0,  # 20/20 = 100% → 9.0 band (perfect score, IELTS maximum)
    }

    # IELTS Band conversion tables (adjusted for test: 10 questions total)
    # Note: raw_score = 0 means no answers or all wrong → band = 0.0 (not 2.5)
    # Based on 10 questions (2 passages x 5 questions each)
    # Scaled to IELTS standard: 0-9.0 bands, where 100% = 9.0
    # Even distribution: scaled from 40-question standard
    READING_BANDS = {
        0: 0.0,  # No answers or all wrong = 0.0
        1: 2.5,  # 1/10 = 10% → 2.5 band
        2: 3.5,  # 2/10 = 20% → 3.5 band
        3: 4.5,  # 3/10 = 30% → 4.5 band
        4: 5.5,  # 4/10 = 40% → 5.5 band
        5: 6.5,  # 5/10 = 50% → 6.5 band
        6: 7.5,  # 6/10 = 60% → 7.5 band
        7: 8.5,  # 7/10 = 70% → 8.5 band
        8: 9.0,  # 8/10 = 80% → 9.0 band
        9: 9.0,  # 9/10 = 90% → 9.0 band
        10: 9.0,  # 10/10 = 100% → 9.0 band (perfect score, IELTS maximum)
    }

    def __init__(self):
        self.gemini = GeminiService()

    def normalize_answer(self, answer: str) -> str:
        """Normalize answer for comparison - handles variations in spacing, case, punctuation"""
        if not answer:
            return ""
        # Convert to lowercase
        normalized = answer.lower()
        # Remove leading/trailing whitespace
        normalized = normalized.strip()
        # Normalize multiple spaces to single space
        normalized = re.sub(r"\s+", " ", normalized)
        # Remove common punctuation that might cause issues (but keep essential ones)
        # Remove periods, commas at the end (common in fill-in-the-blank)
        normalized = normalized.rstrip(".,;:")
        return normalized.strip()

    def compare_answers(self, user_answer: str, correct_answer: str) -> bool:
        """
        Compare answers with strict matching:
        1. Reject empty user answers immediately
        2. Exact match after normalization
        3. Check if correct answer is contained in user answer (for longer responses) - but only if user answer is meaningful
        4. Word-by-word comparison for multi-word answers - but stricter
        """
        # CRITICAL FIX: Reject empty or whitespace-only answers immediately
        if not user_answer or not user_answer.strip():
            return False

        # CRITICAL FIX: Reject if correct answer is empty (shouldn't happen, but safety check)
        if not correct_answer or not correct_answer.strip():
            return False

        normalized_user = self.normalize_answer(user_answer)
        normalized_correct = self.normalize_answer(correct_answer)

        # CRITICAL FIX: After normalization, if user answer is empty, reject
        if not normalized_user:
            return False

        # Case 1: Exact match (most reliable)
        if normalized_user == normalized_correct:
            return True

        # Case 2: If user wrote a longer sentence, check if correct answer is in it
        # Example: correct="london", user="the city is london" -> True
        # BUT: Only if user answer is at least 2x longer (to avoid false matches)
        if len(normalized_user) >= len(normalized_correct) * 2:
            # Check if correct answer appears as a complete word/phrase
            # Use word boundaries to avoid partial matches
            # Create pattern that matches the correct answer as a whole word
            pattern = r"\b" + re.escape(normalized_correct) + r"\b"
            if re.search(pattern, normalized_user, re.IGNORECASE):
                return True

            # Also check if all words from correct answer are in user answer
            words_correct = set(normalized_correct.split())
            words_user = set(normalized_user.split())
            # If all words from correct answer are in user answer AND user has more words
            if (
                words_correct
                and words_correct.issubset(words_user)
                and len(words_user) > len(words_correct)
            ):
                return True

        # Case 3: Word-by-word comparison for multi-word answers - STRICTER
        # Only if both have multiple words
        words_user = set(normalized_user.split())
        words_correct = set(normalized_correct.split())

        if len(words_user) > 1 and len(words_correct) > 1:
            # Calculate overlap ratio - but require HIGHER threshold (90% instead of 80%)
            intersection = words_user.intersection(words_correct)
            union = words_user.union(words_correct)
            if union:
                overlap_ratio = len(intersection) / len(union)
                # CRITICAL FIX: Require 90% overlap (was 80%) and same number of words
                if overlap_ratio >= 0.9 and len(words_user) == len(words_correct):
                    return True

        # Case 4: Fuzzy matching for typos - STRICTER
        # Only for very short answers (1-2 words) and require 95% similarity (was 85%)
        if len(normalized_correct.split()) <= 2 and len(normalized_user.split()) <= 2:
            # Simple character-based similarity
            if self._simple_similarity(normalized_user, normalized_correct) >= 0.95:
                return True

        return False

    def _simple_similarity(self, str1: str, str2: str) -> float:
        """Calculate simple similarity ratio between two strings"""
        if not str1 or not str2:
            return 0.0

        # Use longest common subsequence ratio
        longer = str1 if len(str1) > len(str2) else str2
        shorter = str1 if len(str1) <= len(str2) else str2

        if not longer:
            return 1.0

        # Count matching characters in order
        matches = 0
        shorter_idx = 0
        for char in longer:
            if shorter_idx < len(shorter) and char == shorter[shorter_idx]:
                matches += 1
                shorter_idx += 1

        return matches / len(longer) if longer else 0.0

    def score_listening(
        self, content: Dict[str, Any], answers: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Score Listening section (objective questions)"""
        correct_count = 0
        total_questions = 0
        detailed_results = []

        sections = content.get("listening", {}).get("sections", [])
        for section in sections:
            section_id = section.get("id")
            questions = section.get("questions", [])

            for question in questions:
                qid = question.get("id")
                total_questions += 1
                user_answer = answers.get(f"listening_s{section_id}_q{qid}", "")
                correct_answer = str(question.get("correct_answer", ""))

                # Use flexible comparison that handles variations
                is_correct = self.compare_answers(user_answer, correct_answer)
                if is_correct:
                    correct_count += 1

                detailed_results.append(
                    {
                        "question_id": qid,
                        "section_id": section_id,
                        "user_answer": user_answer,
                        "correct_answer": correct_answer,
                        "is_correct": is_correct,
                    }
                )

        raw_score = correct_count

        # Check if user provided any answers (non-empty)
        has_any_answer = any(
            answers.get(f"listening_s{section.get('id')}_q{q.get('id')}", "").strip()
            for section in sections
            for q in section.get("questions", [])
        )

        # CRITICAL FIX: Also check if raw_score matches total_questions (perfect score)
        # If user got perfect score but we know they left blanks, something is wrong
        # Double-check: if raw_score = total_questions, verify all answers are non-empty
        if raw_score == total_questions and total_questions > 0:
            # Verify all answers are actually provided and non-empty
            all_answers_provided = all(
                bool(
                    answers.get(
                        f"listening_s{section.get('id')}_q{q.get('id')}", ""
                    ).strip()
                )
                for section in sections
                for q in section.get("questions", [])
            )
            # If not all answers provided but got perfect score, something is wrong
            if not all_answers_provided:
                print(
                    f"WARNING: Perfect score but missing answers! raw_score={raw_score}, total={total_questions}"
                )
                # Recalculate - this shouldn't happen with fixed compare_answers, but safety check
                raw_score = 0
                for section in sections:
                    for question in section.get("questions", []):
                        qid = question.get("id")
                        user_answer = answers.get(
                            f"listening_s{section.get('id')}_q{qid}", ""
                        )
                        if not user_answer or not user_answer.strip():
                            continue  # Skip empty answers
                        correct_answer = str(question.get("correct_answer", ""))
                        if self.compare_answers(user_answer, correct_answer):
                            raw_score += 1

        # Logic:
        # - No answers → 0.0
        # - Has answers but all wrong (raw_score = 0) → 0.0
        # - Has answers and some correct (raw_score > 0) → use band table
        if not has_any_answer:
            band = 0.0  # No answers provided = 0.0
        elif raw_score == 0:
            band = 0.0  # Answered but all wrong = 0.0 (not 2.5)
        else:
            # Only use band table when raw_score > 0
            band = self.LISTENING_BANDS.get(raw_score, 0.0)

        return {
            "raw_score": raw_score,
            "total_questions": total_questions,
            "band": round(band, 1),
            "detailed_results": detailed_results,
        }

    def score_reading(
        self, content: Dict[str, Any], answers: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Score Reading section (objective questions)"""
        correct_count = 0
        total_questions = 0
        detailed_results = []

        passages = content.get("reading", {}).get("passages", [])
        for passage in passages:
            passage_id = passage.get("id")
            questions = passage.get("questions", [])

            for question in questions:
                qid = question.get("id")
                question_type = question.get("type", "")
                items = question.get("items", [])

                # Handle multi-item matching (e.g., matching headings with paragraphs A-E)
                if items and len(items) > 0:
                    # Each item is scored separately
                    correct_answer_str = str(question.get("correct_answer", ""))
                    # Parse correct_answer format: "A:i, B:ii, C:iii" or similar
                    correct_answers_dict = {}
                    if correct_answer_str:
                        # Parse format like "A:i, B:ii, C:iii"
                        pairs = [p.strip() for p in correct_answer_str.split(",")]
                        for pair in pairs:
                            if ":" in pair:
                                item, answer = pair.split(":", 1)
                                correct_answers_dict[item.strip()] = answer.strip()

                    # Score each item
                    for item in items:
                        total_questions += 1
                        answer_key = f"reading_p{passage_id}_q{qid}_{item}"
                        user_answer = answers.get(answer_key, "")
                        correct_answer = correct_answers_dict.get(item, "")

                        is_correct = (
                            self.compare_answers(user_answer, correct_answer)
                            if correct_answer
                            else False
                        )
                        if is_correct:
                            correct_count += 1

                        detailed_results.append(
                            {
                                "question_id": qid,
                                "item": item,
                                "passage_id": passage_id,
                                "user_answer": user_answer,
                                "correct_answer": correct_answer,
                                "is_correct": is_correct,
                            }
                        )
                else:
                    # Single answer question
                    total_questions += 1
                    user_answer = answers.get(f"reading_p{passage_id}_q{qid}", "")
                    correct_answer = str(question.get("correct_answer", ""))

                    # Use flexible comparison that handles variations
                    is_correct = self.compare_answers(user_answer, correct_answer)
                    if is_correct:
                        correct_count += 1

                    detailed_results.append(
                        {
                            "question_id": qid,
                            "passage_id": passage_id,
                            "user_answer": user_answer,
                            "correct_answer": correct_answer,
                            "is_correct": is_correct,
                        }
                    )

        raw_score = correct_count

        # Check if user provided any answers (non-empty)
        # Handle both single and multi-item questions
        has_any_answer = False
        for passage in passages:
            for q in passage.get("questions", []):
                qid = q.get("id")
                passage_id = passage.get("id")
                items = q.get("items", [])

                if items and len(items) > 0:
                    # Check if any item has an answer
                    for item in items:
                        answer_key = f"reading_p{passage_id}_q{qid}_{item}"
                        if answers.get(answer_key, "").strip():
                            has_any_answer = True
                            break
                    if has_any_answer:
                        break
                else:
                    # Single answer question
                    if answers.get(f"reading_p{passage_id}_q{qid}", "").strip():
                        has_any_answer = True
                        break
            if has_any_answer:
                break

        # CRITICAL FIX: Also check if raw_score matches total_questions (perfect score)
        # If user got perfect score but we know they left blanks, something is wrong
        # Double-check: if raw_score = total_questions, verify all answers are non-empty
        if raw_score == total_questions and total_questions > 0:
            # Verify all answers are actually provided and non-empty
            # Handle both single and multi-item questions
            all_answers_provided = True
            for passage in passages:
                for q in passage.get("questions", []):
                    qid = q.get("id")
                    passage_id = passage.get("id")
                    items = q.get("items", [])

                    if items and len(items) > 0:
                        # Check all items have answers
                        for item in items:
                            answer_key = f"reading_p{passage_id}_q{qid}_{item}"
                            if not answers.get(answer_key, "").strip():
                                all_answers_provided = False
                                break
                        if not all_answers_provided:
                            break
                    else:
                        # Single answer question
                        if not answers.get(f"reading_p{passage_id}_q{qid}", "").strip():
                            all_answers_provided = False
                            break
                if not all_answers_provided:
                    break

            # If not all answers provided but got perfect score, something is wrong
            if not all_answers_provided:
                print(
                    f"WARNING: Perfect score but missing answers! raw_score={raw_score}, total={total_questions}"
                )
                # Recalculate - this shouldn't happen with fixed compare_answers, but safety check
                raw_score = 0
                for passage in passages:
                    for question in passage.get("questions", []):
                        qid = question.get("id")
                        passage_id = passage.get("id")
                        items = question.get("items", [])

                        if items and len(items) > 0:
                            # Recalculate for multi-item
                            correct_answer_str = str(question.get("correct_answer", ""))
                            correct_answers_dict = {}
                            if correct_answer_str:
                                pairs = [
                                    p.strip() for p in correct_answer_str.split(",")
                                ]
                                for pair in pairs:
                                    if ":" in pair:
                                        item, answer = pair.split(":", 1)
                                        correct_answers_dict[item.strip()] = (
                                            answer.strip()
                                        )

                            for item in items:
                                answer_key = f"reading_p{passage_id}_q{qid}_{item}"
                                user_answer = answers.get(answer_key, "")
                                if not user_answer or not user_answer.strip():
                                    continue
                                correct_answer = correct_answers_dict.get(item, "")
                                if correct_answer and self.compare_answers(
                                    user_answer, correct_answer
                                ):
                                    raw_score += 1
                        else:
                            # Single answer question
                            user_answer = answers.get(
                                f"reading_p{passage_id}_q{qid}", ""
                            )
                            if not user_answer or not user_answer.strip():
                                continue
                            correct_answer = str(question.get("correct_answer", ""))
                            if self.compare_answers(user_answer, correct_answer):
                                raw_score += 1

        # Logic:
        # - No answers → 0.0
        # - Has answers but all wrong (raw_score = 0) → 0.0
        # - Has answers and some correct (raw_score > 0) → use band table
        if not has_any_answer:
            band = 0.0
        elif raw_score == 0:
            band = 0.0  # Answered but all wrong = 0.0 (not 2.5)
        else:
            band = self.READING_BANDS.get(raw_score, 0.0)

        return {
            "raw_score": raw_score,
            "total_questions": total_questions,
            "band": round(band, 1),
            "detailed_results": detailed_results,
        }

    def score_speaking(
        self, content: Dict[str, Any], answers: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Score Speaking section using Gemini (4 IELTS criteria) - Optimized for token limits"""
        # Check if user provided any answers
        part1_questions = content.get("speaking", {}).get("part1", [])
        part2 = content.get("speaking", {}).get("part2", {})
        part3_questions = content.get("speaking", {}).get("part3", [])

        # Collect all answer keys
        all_answer_keys = []
        for q in part1_questions:
            all_answer_keys.append(f"speaking_part1_{q.get('id')}")
        if part2:
            all_answer_keys.append("speaking_part2")
        for q in part3_questions:
            all_answer_keys.append(f"speaking_part3_{q.get('id')}")

        # Check if any answer exists and is not empty
        has_any_answer = any(answers.get(key, "").strip() for key in all_answer_keys)

        # If no answers provided, return 0.0 scores
        if not has_any_answer:
            return {
                "fluency_coherence": 0.0,
                "lexical_resource": 0.0,
                "grammatical_range": 0.0,
                "pronunciation": 0.0,
                "overall_band": 0.0,
                "feedback": "No answers provided",
            }

        system_instruction = """You are an IELTS examiner. Evaluate speaking using 4 criteria: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, Pronunciation. 
        
Test format: Part 1 (3-4 intro questions), Part 2 (1 cue card with topic and bullet points), Part 3 (3-4 analytical questions).
Return JSON only."""

        def truncate_text(text: str, max_words: int = 100) -> str:
            """Truncate text to max words to reduce token usage"""
            if not text:
                return ""
            words = text.split()
            if len(words) <= max_words:
                return text
            return " ".join(words[:max_words]) + "..."

        # Extract part 1 answers (keys like speaking_part1_1, speaking_part1_2, etc.)
        part1_questions = content.get("speaking", {}).get("part1", [])
        part1_answers_dict = {}
        for q in part1_questions:
            qid = q.get("id")
            answer_key = f"speaking_part1_{qid}"
            if answer_key in answers:
                part1_answers_dict[qid] = answers[answer_key]

        # Extract part 2 answer
        speaking_part2_answer = answers.get("speaking_part2", "")

        # Extract part 3 answers (keys like speaking_part3_1, speaking_part3_2, etc.)
        part3_questions = content.get("speaking", {}).get("part3", [])
        part3_answers_dict = {}
        for q in part3_questions:
            qid = q.get("id")
            answer_key = f"speaking_part3_{qid}"
            if answer_key in answers:
                part3_answers_dict[qid] = answers[answer_key]

        part2 = content.get("speaking", {}).get("part2", {})

        # Truncate part2 answer to reduce token usage
        speaking_part2_answer = truncate_text(speaking_part2_answer, max_words=200)

        # Build optimized prompt - shorter format, limit questions
        part1_items = []
        for q in part1_questions[:4]:  # Limit to first 4 questions
            qid = q.get("id")
            q_text = q.get("question", "")[:100]  # Limit question length
            a_text = truncate_text(part1_answers_dict.get(qid, ""), 50)
            part1_items.append(f"Q{qid}: {q_text}\nA: {a_text}")
        part1_text = "\n".join(part1_items)

        part3_items = []
        for q in part3_questions[:4]:  # Limit to first 4 questions
            qid = q.get("id")
            q_text = q.get("question", "")[:100]  # Limit question length
            a_text = truncate_text(part3_answers_dict.get(qid, ""), 80)
            part3_items.append(f"Q{qid}: {q_text}\nA: {a_text}")
        part3_text = "\n".join(part3_items)

        # Optimized prompt - shorter and more focused
        task_card = part2.get("task_card", "")[:200]  # Limit task card length
        topic = part2.get("topic", "")
        prompt = f"""Evaluate IELTS Speaking:

Part 1 (3-4 intro questions):
{part1_text}

Part 2 (Cue card - topic: {topic}):
{task_card}
Answer: {speaking_part2_answer}

Part 3 (3-4 analytical questions):
{part3_text}

Evaluate using IELTS criteria (0-9.0 bands). Return JSON only:
{{"fluency_coherence":7.0,"lexical_resource":7.0,"grammatical_range":7.0,"pronunciation":7.0,"overall_band":7.0,"feedback":"Brief feedback"}}"""

        try:
            print("Calling Gemini API for Speaking scoring...")
            result = self.gemini.generate_json(prompt, system_instruction)
            print("Gemini API response received for Speaking")
            return {
                "fluency_coherence": result.get("fluency_coherence", 5.0),
                "lexical_resource": result.get("lexical_resource", 5.0),
                "grammatical_range": result.get("grammatical_range", 5.0),
                "pronunciation": result.get("pronunciation", 5.0),
                "overall_band": result.get("overall_band", 5.0),
                "feedback": result.get("feedback", ""),
            }
        except Exception as e:
            print(f"Speaking scoring error: {e}")
            import traceback

            print(traceback.format_exc())
            # Fallback scores
            return {
                "fluency_coherence": 5.0,
                "lexical_resource": 5.0,
                "grammatical_range": 5.0,
                "pronunciation": 5.0,
                "overall_band": 5.0,
                "feedback": "Không thể đánh giá tự động",
            }

    def score_writing(
        self, content: Dict[str, Any], answers: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Score Writing section using Gemini (4 IELTS criteria) - Optimized for token limits"""
        # Check if Task 1 exists in content (for backward compatibility)
        has_task1 = bool(content.get("writing", {}).get("task1"))
        task1_answer = answers.get("writing_task1", "").strip() if has_task1 else ""
        task2_answer = answers.get("writing_task2", "").strip()

        # Check if user provided any answers
        has_any_answer = bool(task2_answer or (has_task1 and task1_answer))

        # If no answers provided, return 0.0 scores
        if not has_any_answer:
            result = {
                "task2": {
                    "task_response": 0.0,
                    "coherence_cohesion": 0.0,
                    "lexical_resource": 0.0,
                    "grammatical_range": 0.0,
                    "overall_band": 0.0,
                },
                "overall_band": 0.0,
                "feedback": "No answers provided",
            }
            # Include task1 only if it exists in content
            if has_task1:
                result["task1"] = {
                    "task_achievement": 0.0,
                    "coherence_cohesion": 0.0,
                    "lexical_resource": 0.0,
                    "grammatical_range": 0.0,
                    "overall_band": 0.0,
                }
            return result

        system_instruction = """You are an IELTS examiner. Evaluate writing using 4 criteria: Task Achievement/Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy. 

Test format: Task 1 (50-80 words: describe chart/graph), Task 2 (100-120 words: social essay).
Return JSON only."""

        def truncate_text(text: str, max_words: int = 150) -> str:
            """Truncate text to max words to reduce token usage"""
            if not text:
                return ""
            words = text.split()
            if len(words) <= max_words:
                return text
            return " ".join(words[:max_words]) + "..."

        # Truncate answers to reduce token usage
        # Task 2: 80-100 words expected (short test format)
        task2_answer = truncate_text(task2_answer, max_words=120)

        # Only include Task 1 if it exists
        if has_task1 and task1_answer:
            task1_answer = truncate_text(task1_answer, max_words=100)
            task1_instructions = (
                content.get("writing", {}).get("task1", {}).get("instructions", "")
            )
        else:
            task1_instructions = ""
            task1_answer = ""

        task2_question = content.get("writing", {}).get("task2", {}).get("question", "")

        # Get word limits from content
        task1_word_limit = (
            content.get("writing", {}).get("task1", {}).get("word_limit", 80)
        )
        task2_word_limit = (
            content.get("writing", {}).get("task2", {}).get("word_limit", 120)
        )

        # Build prompt based on available tasks
        if has_task1 and task1_answer:
            # Both Task 1 and Task 2 (standard format)
            prompt = f"""Evaluate IELTS Writing:

Task 1 (Chart/Graph description - target: {task1_word_limit} words):
Instructions: {task1_instructions}
Answer: {task1_answer}

Task 2 (Essay - target: {task2_word_limit} words):
Question: {task2_question}
Answer: {task2_answer}

Evaluate using IELTS criteria (0-9.0 bands). Consider word count targets: Task 1 ({task1_word_limit} words), Task 2 ({task2_word_limit} words).
Return JSON only:
{{"task1":{{"task_achievement":7.0,"coherence_cohesion":7.0,"lexical_resource":7.0,"grammatical_range":7.0,"overall_band":7.0}},"task2":{{"task_response":7.0,"coherence_cohesion":7.0,"lexical_resource":7.0,"grammatical_range":7.0,"overall_band":7.0}},"overall_band":7.0,"feedback":"Brief feedback"}}"""
        else:
            # Only Task 2 (fallback if Task 1 missing)
            prompt = f"""Evaluate IELTS Writing Task 2 (Essay - target: {task2_word_limit} words):

Question: {task2_question}
Answer: {task2_answer}

Evaluate using IELTS criteria (0-9.0 bands). Consider word count target: {task2_word_limit} words.
Return JSON only:
{{"task2":{{"task_response":7.0,"coherence_cohesion":7.0,"lexical_resource":7.0,"grammatical_range":7.0,"overall_band":7.0}},"overall_band":7.0,"feedback":"Brief feedback"}}"""

        try:
            print("Calling Gemini API for Writing scoring...")
            result = self.gemini.generate_json(prompt, system_instruction)
            print("Gemini API response received for Writing")

            task2_scores = result.get("task2", {})

            # Build result based on available tasks
            writing_result = {
                "task2": {
                    "task_response": task2_scores.get("task_response", 5.0),
                    "coherence_cohesion": task2_scores.get("coherence_cohesion", 5.0),
                    "lexical_resource": task2_scores.get("lexical_resource", 5.0),
                    "grammatical_range": task2_scores.get("grammatical_range", 5.0),
                    "overall_band": task2_scores.get("overall_band", 5.0),
                },
                "overall_band": result.get(
                    "overall_band", task2_scores.get("overall_band", 5.0)
                ),
                "feedback": result.get("feedback", ""),
            }

            # Include Task 1 scores only if it exists
            if has_task1:
                task1_scores = result.get("task1", {})
                writing_result["task1"] = {
                    "task_achievement": task1_scores.get("task_achievement", 5.0),
                    "coherence_cohesion": task1_scores.get("coherence_cohesion", 5.0),
                    "lexical_resource": task1_scores.get("lexical_resource", 5.0),
                    "grammatical_range": task1_scores.get("grammatical_range", 5.0),
                    "overall_band": task1_scores.get("overall_band", 5.0),
                }
                # If both tasks exist, overall_band should consider both
                if task1_scores.get("overall_band") and task2_scores.get(
                    "overall_band"
                ):
                    writing_result["overall_band"] = round(
                        (
                            task1_scores.get("overall_band", 0)
                            + task2_scores.get("overall_band", 0)
                        )
                        / 2.0,
                        1,
                    )

            return writing_result
        except Exception as e:
            print(f"Writing scoring error: {e}")
            import traceback

            print(traceback.format_exc())
            # Fallback scores
            fallback_result = {
                "task2": {
                    "task_response": 5.0,
                    "coherence_cohesion": 5.0,
                    "lexical_resource": 5.0,
                    "grammatical_range": 5.0,
                    "overall_band": 5.0,
                },
                "overall_band": 5.0,
                "feedback": "Không thể đánh giá tự động",
            }
            # Include Task 1 only if it exists
            if has_task1:
                fallback_result["task1"] = {
                    "task_achievement": 5.0,
                    "coherence_cohesion": 5.0,
                    "lexical_resource": 5.0,
                    "grammatical_range": 5.0,
                    "overall_band": 5.0,
                }
            return fallback_result

    def aggregate_results(
        self,
        phase1_scores: Dict[str, Any],
        phase2_scores: Dict[str, Any],
        phase1_type: Phase,
        phase2_type: Phase,
    ) -> Dict[str, Any]:
        """Aggregate final IELTS results from both phases"""
        results = {
            "listening": 0.0,
            "reading": 0.0,
            "writing": 0.0,
            "speaking": 0.0,
        }

        # Extract scores from phase 1
        if phase1_type == Phase.LISTENING_SPEAKING:
            results["listening"] = phase1_scores.get("listening", {}).get("band", 0.0)
            results["speaking"] = phase1_scores.get("speaking", {}).get(
                "overall_band", 0.0
            )
        elif phase1_type == Phase.READING_WRITING:
            results["reading"] = phase1_scores.get("reading", {}).get("band", 0.0)
            results["writing"] = phase1_scores.get("writing", {}).get(
                "overall_band", 0.0
            )

        # Extract scores from phase 2
        if phase2_type == Phase.LISTENING_SPEAKING:
            results["listening"] = phase2_scores.get("listening", {}).get("band", 0.0)
            results["speaking"] = phase2_scores.get("speaking", {}).get(
                "overall_band", 0.0
            )
        elif phase2_type == Phase.READING_WRITING:
            results["reading"] = phase2_scores.get("reading", {}).get("band", 0.0)
            results["writing"] = phase2_scores.get("writing", {}).get(
                "overall_band", 0.0
            )

        # Calculate overall band (average of 4 skills)
        overall = round(
            (
                results["listening"]
                + results["reading"]
                + results["writing"]
                + results["speaking"]
            )
            / 4.0,
            1,
        )

        results["overall"] = overall

        return results

    def generate_detailed_analysis(
        self,
        phase1_scores: Dict[str, Any],
        phase2_scores: Dict[str, Any],
        phase1_type: Phase,
        phase2_type: Phase,
        phase1_content: Dict[str, Any],
        phase2_content: Dict[str, Any],
        phase1_answers: Dict[str, Any],
        phase2_answers: Dict[str, Any],
        final_results: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Generate detailed analysis including IELTS framework and beyond-IELTS insights - Optimized for token limits"""
        system_instruction = (
            """Giám khảo IELTS. Phân tích tiếng Anh. Trả về TIẾNG VIỆT. Chỉ JSON."""
        )

        # Prepare data for analysis
        listening_score = final_results.get("listening", 0)
        reading_score = final_results.get("reading", 0)
        writing_score = final_results.get("writing", 0)
        speaking_score = final_results.get("speaking", 0)
        overall_score = final_results.get("overall", 0)

        # Collect summaries (compact format - direct extraction)
        listening_summary = ""
        reading_summary = ""

        if phase1_type == Phase.LISTENING_SPEAKING and phase1_scores.get("listening"):
            l1 = phase1_scores["listening"]
            listening_summary += f"P1:{l1.get('raw_score', 0)}/{l1.get('total_questions', 0)}={l1.get('band', 0):.1f} "
        if phase2_type == Phase.LISTENING_SPEAKING and phase2_scores.get("listening"):
            l2 = phase2_scores["listening"]
            listening_summary += f"P2:{l2.get('raw_score', 0)}/{l2.get('total_questions', 0)}={l2.get('band', 0):.1f}"

        if phase1_type == Phase.READING_WRITING and phase1_scores.get("reading"):
            r1 = phase1_scores["reading"]
            reading_summary += f"P1:{r1.get('raw_score', 0)}/{r1.get('total_questions', 0)}={r1.get('band', 0):.1f} "
        if phase2_type == Phase.READING_WRITING and phase2_scores.get("reading"):
            r2 = phase2_scores["reading"]
            reading_summary += f"P2:{r2.get('raw_score', 0)}/{r2.get('total_questions', 0)}={r2.get('band', 0):.1f}"

        # Compact summaries
        writing_summary = ""
        if phase1_scores.get("writing"):
            w1 = phase1_scores["writing"]
            # Check if Task 1 exists
            task1_band = (
                w1.get("task1", {}).get("overall_band", 0) if w1.get("task1") else 0
            )
            if task1_band > 0:
                writing_summary += f"P1:T1={task1_band:.1f} T2={w1.get('task2', {}).get('overall_band', 0):.1f} O={w1.get('overall_band', 0):.1f} "
            else:
                writing_summary += f"P1:T2={w1.get('task2', {}).get('overall_band', 0):.1f} O={w1.get('overall_band', 0):.1f} "
        if phase2_scores.get("writing"):
            w2 = phase2_scores["writing"]
            # Check if Task 1 exists
            task1_band = (
                w2.get("task1", {}).get("overall_band", 0) if w2.get("task1") else 0
            )
            if task1_band > 0:
                writing_summary += f"P2:T1={task1_band:.1f} T2={w2.get('task2', {}).get('overall_band', 0):.1f} O={w2.get('overall_band', 0):.1f}"
            else:
                writing_summary += f"P2:T2={w2.get('task2', {}).get('overall_band', 0):.1f} O={w2.get('overall_band', 0):.1f}"

        speaking_summary = ""
        if phase1_scores.get("speaking"):
            s1 = phase1_scores["speaking"]
            speaking_summary += f"P1:FC={s1.get('fluency_coherence', 0):.1f} LR={s1.get('lexical_resource', 0):.1f} GR={s1.get('grammatical_range', 0):.1f} P={s1.get('pronunciation', 0):.1f} O={s1.get('overall_band', 0):.1f} "
        if phase2_scores.get("speaking"):
            s2 = phase2_scores["speaking"]
            speaking_summary += f"P2:FC={s2.get('fluency_coherence', 0):.1f} LR={s2.get('lexical_resource', 0):.1f} GR={s2.get('grammatical_range', 0):.1f} P={s2.get('pronunciation', 0):.1f} O={s2.get('overall_band', 0):.1f}"

        # Sample answers for analysis (reduced to save tokens)
        def sample_answer(text: str, max_words: int = 20) -> str:
            if not text:
                return ""
            words = text.split()
            if len(words) <= max_words:
                return text
            return " ".join(words[:max_words]) + "..."

        # Reduce samples further to save tokens
        writing_samples = ""
        if phase1_answers.get("writing_task2"):
            writing_samples += (
                f"W1:{sample_answer(phase1_answers['writing_task2'], 15)} "
            )
        if phase2_answers.get("writing_task2"):
            writing_samples += (
                f"W2:{sample_answer(phase2_answers['writing_task2'], 15)}"
            )

        # Only 1 speaking sample total
        speaking_samples = ""
        for key in list(phase1_answers.keys()):
            if key.startswith("speaking_"):
                speaking_samples += f"S1:{sample_answer(phase1_answers[key], 15)}"
                break
        if not speaking_samples:
            for key in list(phase2_answers.keys()):
                if key.startswith("speaking_"):
                    speaking_samples += f"S2:{sample_answer(phase2_answers[key], 15)}"
                    break

        # Split into 2 separate API calls: Key 1 for IELTS, Key 2 for Beyond IELTS
        ielts_analysis = {}
        beyond_ielts = {}

        # Part 1: IELTS Analysis using Key 1 (ultra-compact Vietnamese)
        ielts_prompt = f"""IELTS (TIẾNG VIỆT):

Scores: L={listening_score:.1f} R={reading_score:.1f} W={writing_score:.1f} S={speaking_score:.1f} O={overall_score:.1f}
Data: L:{listening_summary if listening_summary else 'N/A'} R:{reading_summary if reading_summary else 'N/A'} W:{writing_summary if writing_summary else 'N/A'} S:{speaking_summary if speaking_summary else 'N/A'}
Samples: W:{writing_samples[:80] if writing_samples else 'N/A'} S:{speaking_samples[:80] if speaking_samples else 'N/A'}

Phân tích (TIẾNG VIỆT):
- R: mạnh/yếu, dạng câu (MC,T/F/NG,matching,fill-blank)
- L: mạnh/yếu, dạng câu (MC,fill-blank,matching,short)
- W: 4 tiêu chí (TR,CC,LR,GR) - mạnh/yếu từng tiêu chí (chỉ Task 2 nếu không có T1)
- S: 4 tiêu chí (FC,LR,GR,P) - mạnh/yếu từng tiêu chí

JSON (TIẾNG VIỆT): {{"ielts_analysis":{{"reading":{{"strengths":[],"weaknesses":[],"question_type_analysis":{{}}}}, "listening":{{"strengths":[],"weaknesses":[],"question_type_analysis":{{}}}}, "writing":{{"task_achievement":{{"score":0,"strengths":[],"weaknesses":[]}}, "coherence_cohesion":{{"score":0,"strengths":[],"weaknesses":[]}}, "lexical_resource":{{"score":0,"strengths":[],"weaknesses":[]}}, "grammatical_range":{{"score":0,"strengths":[],"weaknesses":[]}}, "overall_assessment":""}}, "speaking":{{"fluency_coherence":{{"score":0,"strengths":[],"weaknesses":[]}}, "lexical_resource":{{"score":0,"strengths":[],"weaknesses":[]}}, "grammatical_range":{{"score":0,"strengths":[],"weaknesses":[]}}, "pronunciation":{{"score":0,"strengths":[],"weaknesses":[]}}, "overall_assessment":""}}}}}}"""

        # Part 2: Beyond IELTS Analysis using Key 2 - Separate analysis for each skill
        beyond_prompt = f"""Beyond IELTS (TIẾNG VIỆT) - Phân tích riêng từng kỹ năng:

Scores: L={listening_score:.1f} R={reading_score:.1f} W={writing_score:.1f} S={speaking_score:.1f} O={overall_score:.1f}
Data: L:{listening_summary if listening_summary else 'N/A'} R:{reading_summary if reading_summary else 'N/A'} W:{writing_summary if writing_summary else 'N/A'} S:{speaking_summary if speaking_summary else 'N/A'}
Samples: W:{writing_samples[:80] if writing_samples else 'N/A'} S:{speaking_samples[:80] if speaking_samples else 'N/A'}

Phân tích riêng từng kỹ năng (TIẾNG VIỆT):
- LISTENING: phản xạ nghe, tốc độ xử lý, khả năng nắm bắt thông tin, ảnh hưởng ngôn ngữ mẹ đẻ
- READING: tốc độ đọc, khả năng hiểu, cách tiếp cận văn bản, ảnh hưởng ngôn ngữ mẹ đẻ
- WRITING: văn phạm, từ vựng, cấu trúc, tự nhiên/dịch máy, lỗi nghĩa
- SPEAKING: phát âm, nhịp điệu, từ vựng, văn phạm, phản xạ, tự nhiên

JSON (TIẾNG VIỆT): {{"beyond_ielts":{{"listening":{{"reflex_level":"","processing_speed":"","comprehension_ability":"","mother_tongue_impact":"","assessment":""}}, "reading":{{"reading_speed":"","comprehension_ability":"","text_approach":"","mother_tongue_impact":"","assessment":""}}, "writing":{{"grammar_errors":"","vocabulary_level":"","structure_quality":"","natural_vs_translated":"","meaning_errors":"","assessment":""}}, "speaking":{{"pronunciation":"","rhythm_stress":"","vocabulary_usage":"","grammar_accuracy":"","reflex_level":"","naturalness":"","assessment":""}}, "overall":{{"reflex_level":"","reception_ability":"","mother_tongue_influence":"","key_strengths":"","key_weaknesses":""}}}}}}"""

        try:
            print("Generating IELTS analysis (using Key 1)...")
            ielts_result = self.gemini.generate_json(
                ielts_prompt, system_instruction, force_key=1
            )
            ielts_analysis = ielts_result.get("ielts_analysis", {})
            print("IELTS analysis generated successfully")
        except Exception as e:
            print(f"Error generating IELTS analysis: {e}")
            ielts_analysis = {}

        try:
            print("Generating Beyond IELTS analysis (using Key 2)...")
            beyond_result = self.gemini.generate_json(
                beyond_prompt, system_instruction, force_key=2
            )
            beyond_ielts = beyond_result.get("beyond_ielts", {})
            print("Beyond IELTS analysis generated successfully")
        except Exception as e:
            print(f"Error generating Beyond IELTS analysis: {e}")
            beyond_ielts = {}

        return {"ielts_analysis": ielts_analysis, "beyond_ielts": beyond_ielts}
