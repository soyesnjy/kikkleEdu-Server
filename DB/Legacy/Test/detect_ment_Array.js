// 심리 검사 결과 분석 감지 멘트
const test_result_ment = [
  // 학교생활
  { text: "선생님이싫어", class: "School" },
  { text: "선생님이 싫어", class: "School" },
  { text: "숙제하기싫어", class: "School" },
  { text: "숙제하기 싫어", class: "School" },
  // 친구관계
  { text: "친구가없어", class: "Friend" },
  { text: "친구가 없어", class: "Friend" },
  // 가족관계
  { text: "엄마가미워", class: "Family" },
  { text: "엄마가 미워", class: "Family" },
  { text: "아빠가미워", class: "Family" },
  { text: "아빠가 미워", class: "Family" },
  { text: "동생이미워", class: "Family" },
  { text: "동생이 미워", class: "Family" },
  // 전반적기분
  { text: "기분나빠", class: "Mood" },
  { text: "기분별로야", class: "Mood" },
  { text: "짜증나", class: "Mood" },
  // 불안
  { text: "불안해", class: "Unrest" },
  { text: "떨려", class: "Unrest" },
  // 우울
  { text: "우울해", class: "Sad" },
  { text: "슬퍼", class: "Sad" },
  { text: "슬프다", class: "Sad" },
  // 신체증상
  { text: "몸이안좋아", class: "Health" },
  { text: "몸이 안좋아", class: "Health" },
  { text: "몸이이상해", class: "Health" },
  { text: "몸이 이상해", class: "Health" },
  // 주의집중
  { text: "집중이안돼", class: "Attention" },
  { text: "집중이 힘들어", class: "Attention" },
  // 과잉 행동
  { text: "참기힘들어", class: "Movement" },
  { text: "참기 힘들어", class: "Movement" },
  // 분노
  { text: "화난다", class: "Angry" },
  { text: "화가나", class: "Angry" },
  { text: "화나", class: "Angry" },
  // 자기인식
  { text: "나는뭘까", class: "Self" },
  { text: "나는 뭘까", class: "Self" },
  { text: "나는뭐지", class: "Self" },
  { text: "나는 뭐지", class: "Self" },
];

// 인지행동 검사 감지 멘트
const cb_solution_ment = [
  // 학교생활
  { text: "학교가기싫어", class: "school" },
  { text: "학교가기 싫어", class: "school" },
  { text: "학교가싫어", class: "school" },
  { text: "학교가 싫어", class: "school" },
  // 친구관계
  { text: "친구가미워", class: "friend" },
  { text: "친구가 미워", class: "friend" },
  // 가족관계
  { text: "부모님이무서워", class: "family" },
  { text: "부모님이 무서워", class: "family" },
  // 그외
  { text: "그외인지", class: "etc" },
];

module.exports = {
  test_result_ment,
  cb_solution_ment,
};
