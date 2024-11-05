// MySQL 접근
const mysql = require("mysql");
const { dbconfig_ai, dbconfig_kk } = require("../DB/database");

// 키클 DB 연결
const connection_KK = mysql.createConnection(dbconfig_kk);
connection_KK.connect();

const { KK_User_Table_Info } = require("../DB/database_table_info");

const teacherController = {
  // KKTeacher Data READ
  getKKTeacherDataRead: (req, res) => {
    // console.log("KK Teacher Data READ API 호출");
    let parseDayofweek;
    try {
      const query = req.query;
      const {
        classIdx,
        dayofweek,
        partTime,
        classTag,
        teacherIdx,
        main,
        classType,
      } = query; // classIdx 필수, dayofweek 선택

      // console.log(query);

      parseDayofweek = dayofweek ? dayofweek.split(",") : null; // String -> Array

      const teacher_table = KK_User_Table_Info["teacher"].table;
      const teacher_class_table = KK_User_Table_Info["teacher_class"].table;
      const class_table = KK_User_Table_Info["class"].table;

      const select_query = `
  SELECT
  ${!teacherIdx ? "DISTINCT" : ""}
  ${
    teacherIdx
      ? `t.kk_teacher_idx,
      t.kk_teacher_name,
      t.kk_teacher_profileImg_path,
      t.kk_teacher_phoneNum,
      t.kk_teacher_introduction,
      t.kk_teacher_education,
      t.kk_teacher_history,
      t.kk_teacher_location,
      t.kk_teacher_dayofweek,
      t.kk_teacher_time,
      GROUP_CONCAT(
        CONCAT(
            c.kk_class_idx
        ) SEPARATOR '/'
    ) AS kk_teacher_class_idxs,
      GROUP_CONCAT(
        CONCAT(
            c.kk_class_title
        ) SEPARATOR ' / '
    ) AS kk_teacher_class_titles`
      : `t.kk_teacher_idx, t.kk_teacher_introduction, t.kk_teacher_name, t.kk_teacher_profileImg_path`
  }
  FROM ${teacher_table} AS t
  ${
    classIdx || classTag || teacherIdx || classType
      ? `LEFT JOIN ${teacher_class_table} AS tc ON t.kk_teacher_idx = tc.kk_teacher_idx`
      : ""
  }
  ${
    classTag || teacherIdx || classType
      ? `LEFT JOIN ${class_table} AS c ON c.kk_class_idx = tc.kk_class_idx`
      : ""
  }
  WHERE t.kk_teacher_approve_status = '1'
  ${
    parseDayofweek
      ? `AND (${parseDayofweek
          .map((day) => `t.kk_teacher_dayofweek LIKE '%${day}%'`)
          .join(" OR ")})`
      : ""
  }
  ${partTime ? ` AND t.kk_teacher_time LIKE '%${partTime}%'` : ""}
  ${classIdx ? ` AND tc.kk_class_idx = ${classIdx}` : ""}
  ${classTag ? ` AND c.kk_class_tag = '${classTag}'` : ""}
  ${classType ? ` AND c.kk_class_type LIKE '%${classType}%'` : ""}
  ${
    teacherIdx
      ? ` AND t.kk_teacher_idx = ${teacherIdx} GROUP BY t.kk_teacher_idx`
      : ""
  }
  ${
    main || classType
      ? "ORDER BY RAND()"
      : "ORDER BY t.kk_teacher_created_at DESC"
  }
  ${main ? "LIMIT 5" : ""}
  ${classType ? "LIMIT 4" : ""};
`;

      // console.log(select_query);
      // 데이터베이스 쿼리 실행
      connection_KK.query(select_query, null, (err, data) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            message: err.sqlMessage,
          });
        }
        // 결과 반환
        return res.status(200).json({
          message: "Teacher Access Success! - 200 OK",
          data,
        });
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
};

module.exports = {
  teacherController,
};
