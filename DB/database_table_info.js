const {
  ebt_Result,
  ebt_Consulting,
  ebt_Solution,
} = require("./Legacy/Prompt/psy_test");

// SoyesAI Database Table Info
const User_Table_Info = {
  table: "soyes_ai_User",
  attribute: {
    pKey: "uid",
    attr1: "Email",
    attr2: "passWard",
    attr3: "name",
    attr4: "phoneNumber",
    attr5: "oauth_type",
    attr6: "creation_date",
    attr7: "lastLogin_date",
  },
};
const Plan_Table_Info = {
  Plan: {
    table: "soyes_ai_User_Plan",
    attribute: {
      pKey: "uid",
      attr1: "expirationDate",
      attr2: "plan_status",
    },
  },
  Info: {
    table: "soyes_ai_Plan_Info",
    attribute: {
      pKey: "plan_id",
      attr1: "plan_name",
      attr2: "plan_period",
      attr3: "plan_price",
    },
  },
  Log: {
    table: "soyes_ai_Plan_Log",
    attribute: {
      cKey: "uid",
      attr1: "plan_id",
      attr2: "pay_type",
      attr3: "pay_number",
      attr4: "pay_amount",
      attr5: "pay_tax_free_amount",
    },
  },
};
const EBT_Table_Info = {
  School: {
    ebtClass: "School",
    table: "soyes_ai_Ebt_School",
    attribute: {
      pKey: "uid",
      attr1: "school_question_0",
      attr2: "school_question_1",
      attr3: "school_question_2",
      attr4: "school_question_3",
      attr5: "school_question_4",
      attr6: "school_question_5",
      attr7: "chat",
      attr8: "date",
    },
    result: ebt_Result["School"], // 적용 프롬프트
    consult: ebt_Consulting["School"], // 적용 프롬프트
    solution: ebt_Solution["School"], // 적용 프롬프트
    danger_score: 7.6,
    caution_score: 6.5,
    average: 3.053449951,
    standard: 2.268902495,
  },
  Friend: {
    ebtClass: "Friend",
    table: "soyes_ai_Ebt_Friend",
    attribute: {
      pKey: "uid",
      attr1: "friend_question_0",
      attr2: "friend_question_1",
      attr3: "friend_question_2",
      attr4: "friend_question_3",
      attr5: "friend_question_4",
      attr6: "friend_question_5",
      attr7: "friend_question_6",
      attr8: "friend_question_7",
      attr9: "chat",
      attr10: "date",
    },
    result: ebt_Result["Friend"], // 적용 프롬프트
    consult: ebt_Consulting["Friend"], // 적용 프롬프트
    solution: ebt_Solution["Friend"], // 적용 프롬프트
    danger_score: 9.6,
    caution_score: 8.2,
    average: 4.1379981,
    standard: 2.718721,
  },
  Family: {
    ebtClass: "Family",
    table: "soyes_ai_Ebt_Family",
    attribute: {
      pKey: "uid",
      attr1: "family_question_0",
      attr2: "family_question_1",
      attr3: "family_question_2",
      attr4: "family_question_3",
      attr5: "family_question_4",
      attr6: "family_question_5",
      attr7: "family_question_6",
      attr8: "chat",
      attr9: "date",
    },
    result: ebt_Result["Family"], // 적용 프롬프트
    consult: ebt_Consulting["Family"], // 적용 프롬프트
    solution: ebt_Solution["Family"], // 적용 프롬프트
    danger_score: 8,
    caution_score: 7,
    average: 3,
    standard: 3,
  },
  Mood: {
    ebtClass: "Mood",
    table: "soyes_ai_Ebt_Mood",
    attribute: {
      pKey: "uid",
      attr1: "mood_question_0",
      attr2: "mood_question_1",
      attr3: "mood_question_2",
      attr4: "chat",
      attr5: "date",
    },
    result: ebt_Result["Mood"], // 적용 프롬프트
    consult: ebt_Consulting["Mood"], // 적용 프롬프트
    solution: ebt_Solution["Mood"], // 적용 프롬프트
    danger_score: 5,
    caution_score: 4,
    average: 2,
    standard: 1,
  },
  Unrest: {
    ebtClass: "Unrest",
    table: "soyes_ai_Ebt_Unrest",
    attribute: {
      pKey: "uid",
      attr1: "unrest_question_0",
      attr2: "unrest_question_1",
      attr3: "unrest_question_2",
      attr4: "unrest_question_3",
      attr5: "unrest_question_4",
      attr6: "unrest_question_5",
      attr7: "chat",
      attr8: "date",
    },
    result: ebt_Result["Unrest"], // 적용 프롬프트
    danger_score: 10,
    caution_score: 9,
    average: 5,
    standard: 3,
  },
  Sad: {
    ebtClass: "Sad",
    table: "soyes_ai_Ebt_Sad",
    attribute: {
      pKey: "uid",
      attr1: "sad_question_0",
      attr2: "sad_question_1",
      attr3: "sad_question_2",
      attr4: "sad_question_3",
      attr5: "sad_question_4",
      attr6: "sad_question_5",
      attr7: "sad_question_6",
      attr8: "chat",
      attr9: "date",
    },
    result: ebt_Result["Sad"], // 적용 프롬프트
    danger_score: 10,
    caution_score: 9,
    average: 5,
    standard: 3,
  },
  Health: {
    ebtClass: "Health",
    table: "soyes_ai_Ebt_Health",
    attribute: {
      pKey: "uid",
      attr1: "health_question_0",
      attr2: "health_question_1",
      attr3: "health_question_2",
      attr4: "health_question_3",
      attr5: "health_question_4",
      attr6: "chat",
      attr7: "date",
    },
    result: ebt_Result["Health"], // 적용 프롬프트
    consult: ebt_Consulting["Health"], // 적용 프롬프트
    solution: ebt_Solution["Health"], // 적용 프롬프트
    danger_score: 7,
    caution_score: 6,
    average: 3,
    standard: 2,
  },
  Attention: {
    ebtClass: "Attention",
    table: "soyes_ai_Ebt_Attention",
    attribute: {
      pKey: "uid",
      attr1: "attention_question_0",
      attr2: "attention_question_1",
      attr3: "attention_question_2",
      attr4: "attention_question_3",
      attr5: "attention_question_4",
      attr6: "attention_question_5",
      attr7: "attention_question_6",
      attr8: "chat",
      attr9: "date",
    },
    result: ebt_Result["Attention"], // 적용 프롬프트
    danger_score: 11,
    caution_score: 9,
    average: 5,
    standard: 3,
  },
  Movement: {
    ebtClass: "Movement",
    table: "soyes_ai_Ebt_Movement",
    attribute: {
      pKey: "uid",
      attr1: "movement_question_0",
      attr2: "movement_question_1",
      attr3: "movement_question_2",
      attr4: "movement_question_3",
      attr5: "movement_question_4",
      attr6: "movement_question_5",
      attr7: "movement_question_6",
      attr8: "chat",
      attr9: "date",
    },
    result: ebt_Result["Movement"], // 적용 프롬프트
    danger_score: 8,
    caution_score: 7,
    average: 3,
    standard: 2,
  },
  Angry: {
    ebtClass: "Angry",
    table: "soyes_ai_Ebt_Angry",
    attribute: {
      pKey: "uid",
      attr1: "angry_question_0",
      attr2: "angry_question_1",
      attr3: "angry_question_2",
      attr4: "angry_question_3",
      attr5: "angry_question_4",
      attr6: "angry_question_5",
      attr7: "chat",
      attr8: "date",
    },
    result: ebt_Result["Angry"], // 적용 프롬프트
    danger_score: 8,
    caution_score: 7,
    average: 3,
    standard: 2,
  },
  Self: {
    ebtClass: "Self",
    table: "soyes_ai_Ebt_Self",
    attribute: {
      pKey: "uid",
      attr1: "self_question_0",
      attr2: "self_question_1",
      attr3: "self_question_2",
      attr4: "self_question_3",
      attr5: "self_question_4",
      attr6: "chat",
      attr7: "date",
    },
    result: ebt_Result["Self"], // 적용 프롬프트
    consult: ebt_Consulting["Self"], // 적용 프롬프트
    solution: ebt_Solution["Self"], // 적용 프롬프트
    danger_score: 7.1,
    caution_score: 5.9,
    average: 2.54907677,
    standard: 2.2565882,
  },
  Log: {
    table: "soyes_ai_User_Ebt_Log",
    attribute: {
      cKey: "uid",
      attr1: "date",
      attr2: "ebt_analysis",
      attr3: "ebt_type",
      attr4: "ebt_tScore",
    },
  },
};
const PT_Table_Info = {
  Main: {
    table: "soyes_ai_PT",
    attribute: {
      pKey: "uid",
      attr1: "date",
      attr2: "persanl_result",
      attr3: "chat",
    },
  },

  Log: {
    table: "soyes_ai_User_Pt_Log",
    attribute: {
      cKey: "uid",
      attr1: "date",
      attr2: "persanl_result",
      attr3: "pt_analysis",
    },
  },
};
const Consult_Table_Info = {
  Analysis: {
    table: "soyes_ai_User_Consult_Analysis",
    attribute: {
      pKey: "uid",
      attr1: "ella_psycho_analysis",
      attr2: "ubi_psycho_analysis",
    },
  },
  Log: {
    table: "soyes_ai_User_Consult_Log",
    attribute: {
      pKey: "uid",
      attr1: "avarta_name",
      attr2: "consult_log",
    },
  },
};
const Review_Table_Info = {
  table: "soyes_ai_User_Review_Log",
  attribute: {
    cKey: "uid",
    attr1: "profile_img_url",
    attr2: "content",
  },
};
const Ella_Training_Table_Info = {
  Mood: {
    table: "soyes_training_mood",
    attribute: {
      pKey: "mood_idx",
      fKey: "uid",
      attr1: "mood_round_idx",
      attr2: "mood_name",
      attr3: "mood_score",
      attr4: "mood_todo_list",
      attr5: "mood_talk_list",
      attr6: "mood_avartar",
      attr7: "created_at",
      attr8: "updated_at",
    },
  },
};

// KK User Table Info
const KK_User_Table_Info = {
  teacher: {
    table: "kk_teacher",
    attribute: {
      pKey: "kk_teacher_idx",
      attr1: "kk_teacher_uid",
      attr2: "kk_teacher_pwd",
      attr3: "kk_teacher_introduction", // default: '', 관리자 수정
      attr4: "kk_teacher_name",
      attr5: "kk_teacher_phoneNum",
      attr6: "kk_teacher_profileImg_path", // default: '', 관리자 수정
      attr7: "kk_teacher_location",
      attr8: "kk_teacher_dayofweek", // Array String
      attr9: "kk_teacher_history",
      attr10: "kk_teacher_education",
      attr11: "kk_teacher_time",
      attr12: "kk_teacher_file_path", // drive 저장 path
      attr13: "kk_teacher_approve_status", // default: 0, 관리자 수정
      attr14: "kk_teacher_created_at",
      attr15: "kk_teacher_updated_at",
    },
  },
  agency: {
    table: "kk_agency",
    attribute: {
      pKey: "kk_agency_idx",
      attr1: "kk_agency_uid",
      attr2: "kk_agency_pwd",
      attr3: "kk_agency_name",
      attr4: "kk_agency_address",
      attr5: "kk_agency_phoneNum",
      attr6: "kk_agency_type",
      attr7: "kk_agency_file_path",
      attr8: "kk_agency_approve_status",
      attr9: "kk_agency_created_at",
      attr10: "kk_agency_updated_at",
    },
  },
  class: {
    table: "kk_class",
    attribute: {
      pKey: "kk_class_idx",
      attr1: "kk_class_title",
      attr2: "kk_class_content",
      attr3: "kk_class_info",
      attr4: "kk_class_type",
      attr5: "kk_class_tag",
      attr6: "kk_class_file_path",
      attr7: "kk_class_detail_path",
      attr8: "kk_class_created_at",
      attr9: "kk_class_updated_at",
    },
  },
  teacher_class: {
    table: "kk_teacher_class",
    attribute: {
      pKey: "kk_teacher_class_idx",
      attr1: "kk_teacher_idx",
      attr2: "kk_class_idx",
    },
  },
  reservation: {
    table: "kk_reservation",
    attribute: {
      pKey: "kk_reservation_idx",
      attr1: "kk_agency_idx",
      attr2: "kk_class_idx",
      attr3: "kk_teacher_idx",
      attr4: "kk_reservation_date", // Array String
      attr5: "kk_reservation_start_date",
      attr6: "kk_reservation_end_date",
      attr7: "kk_reservation_time",
      attr8: "kk_reservation_approve_status",
      attr9: "kk_reservation_created_at",
      attr10: "kk_reservation_updated_at",
    },
  },
  reservation_teacher: {
    table: "kk_reservation_teacher",
    attribute: {
      pKey: "kk_reservation_teacher_idx",
      attr1: "kk_reservation_idx",
      attr2: "kk_teacher_idx",
    },
  },
  attend: {
    table: "kk_attend",
    attribute: {
      pKey: "kk_attend_idx",
      attr1: "kk_reservation_idx",
      attr2: "kk_attend_date",
      attr3: "kk_attend_status",
      attr4: "kk_attend_created_at",
      attr5: "kk_attend_updated_at",
    },
  },
  board: {
    table: "kk_board",
    attribute: {
      pKey: "kk_board_idx",
      attr1: "kk_agency_idx",
      attr2: "kk_board_type",
      attr3: "kk_board_title",
      attr4: "kk_board_content",
      attr5: "kk_board_reply",
      attr6: "kk_board_private",
      attr7: "kk_board_created_at",
      attr8: "kk_board_updated_at",
    },
  },
};

module.exports = {
  User_Table_Info,
  Plan_Table_Info,
  EBT_Table_Info,
  PT_Table_Info,
  Consult_Table_Info,
  Review_Table_Info,
  Ella_Training_Table_Info,
  KK_User_Table_Info,
};
