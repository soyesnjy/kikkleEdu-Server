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
    console.log("KK Teacher Data READ API 호출");
    try {
      const query = req.query;
      const { classIdx, dayofweek } = query; // classIdx 필수, dayofweek 선택
      const teacher_table = KK_User_Table_Info["teacher"].table;
      const teacher_class_table = KK_User_Table_Info["teacher_class"].table;

      // 회원가입 시 KK_User_Table_Info 데이터를 로드하지 못하는 버그로 인해 사용 불가
      // const teacher_attribute = KK_User_Table_Info["teacher"].attribute;
      // const teacher_class_attribute =
      //   KK_User_Table_Info["teacher_class"].attribute;

      // teacher_class 테이블 Join Select
      // kk_teacher 테이블과 kk_teacher_class 테이블을 kk_teacher_idx 속성으로 Join
      // 이후 query 조건을 통해
      const select_query = `SELECT t.kk_teacher_idx, t.kk_teacher_introduction, t.kk_teacher_name FROM ${teacher_table} AS t JOIN ${teacher_class_table} AS tc ON t.kk_teacher_idx = tc.kk_teacher_idx WHERE tc.kk_class_idx = ${classIdx}${` AND t.kk_teacher_approve_status = '1'`}${
        dayofweek ? ` AND t.kk_teacher_dayofweek LIKE '%${dayofweek}%'` : ""
      } ORDER BY t.kk_teacher_created_at DESC;`;

      // console.log(select_query);
      // 데이터베이스 쿼리 실행
      connection_KK.query(select_query, null, (err, data) => {
        if (err) {
          console.log(err);
          return res.status(404).json({
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
