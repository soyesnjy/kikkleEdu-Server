// MySQL 접근
const mysql = require("mysql");
const { dbconfig_kk } = require("../DB/database");

// 키클 DB 연결
const connection_KK = mysql.createConnection(dbconfig_kk);
connection_KK.connect();

const { KK_User_Table_Info } = require("../DB/database_table_info");

// 동기식 DB 접근 함수 1. Promise 생성 함수
function queryAsync(connection, query, parameters) {
  return new Promise((resolve, reject) => {
    connection.query(query, parameters, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}
// 프로미스 resolve 반환값 사용. (User Data return)
async function fetchUserData(connection, query) {
  try {
    let results = await queryAsync(connection, query, []);
    // console.log(results[0]);
    return results;
  } catch (error) {
    console.error(error);
  }
}

const mypageController = {
  // KK Teacher Attend Data READ
  getKKTeacherAttendDataRead: async (req, res) => {
    console.log("KK Teacher Attend Data READ API 호출");
    try {
      const { pageNum, userIdx } = req.query;
      // 클라이언트로부터 페이지 번호 받기 (기본값: 1)
      // console.log(pageNum);
      const page = pageNum || 1;
      const limit = 10; // 한 페이지에 보여줄 리뷰의 수
      const offset = (page - 1) * limit;

      if (true) {
        // Pagination Last Number Select
        // const count_query = `SELECT COUNT(*) FROM kk_reservation WHERE kk_teacher_idx = '${userIdx}'`;
        const count_query = `SELECT COUNT(*)
FROM kk_attend AS a
JOIN kk_reservation AS r ON a.kk_reservation_idx = r.kk_reservation_idx
WHERE r.kk_teacher_idx = '${userIdx}' AND r.kk_reservation_approve_status = '1'`;
        const count_data = await fetchUserData(connection_KK, count_query);
        const lastPageNum = Math.ceil(count_data[0]["COUNT(*)"] / limit);
        // console.log(lastPageNum);

        // SQL 쿼리 준비: 최신순으로 유저 데이터 가져오기
        // const select_query = `SELECT * FROM ${user_table} WHERE kk_${userClass}_approve_status = '0' ORDER BY kk_${userClass}_created_at DESC LIMIT ? OFFSET ?`;
        const select_query = `SELECT
    c.kk_class_title,
    t.kk_teacher_name,
    a.kk_attend_idx,
    a.kk_attend_date,
    a.kk_attend_status,
    ag.kk_agency_name
FROM kk_attend AS a
JOIN kk_reservation AS r ON a.kk_reservation_idx = r.kk_reservation_idx
JOIN kk_teacher AS t ON r.kk_teacher_idx = t.kk_teacher_idx
JOIN kk_class AS c ON r.kk_class_idx = c.kk_class_idx
JOIN kk_agency AS ag ON r.kk_agency_idx = ag.kk_agency_idx
WHERE r.kk_teacher_idx = '${userIdx}'
AND r.kk_reservation_approve_status = '1'
ORDER BY a.kk_attend_date DESC LIMIT ? OFFSET ?;
`;
        const select_values = [limit, offset];
        // 데이터베이스 쿼리 실행
        connection_KK.query(select_query, select_values, (err, data) => {
          if (err) {
            console.log(err);
            return res.status(400).json({
              message: "User SignUp Request READ Fail! - 400",
              page: -1,
              limit: -1,
              lastPageNum: -1,
              data: [],
            });
          }
          // 결과 반환
          return res.status(200).json({
            message: "User SignUp Request READ Success! - 200",
            page,
            limit,
            lastPageNum,
            data: data,
          });
        });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
  // KK Teacher Attend Data Update
  postKKTeacherAttendDataUpdate: (req, res) => {
    console.log("Teacher Attend Data Update API 호출");
    const { AttendData } = req.body;
    // console.log(AttendData);
    let parseData;
    try {
      if (typeof AttendData === "string") {
        parseData = JSON.parse(AttendData);
      } else parseData = AttendData;

      const { attendIdx, attendStatus } = parseData;

      // Input 없을 경우
      if (!attendIdx) {
        return res
          .status(400)
          .json({ message: "Non Attend Input Value - 400 Bad Request" });
      }

      const update_query = `UPDATE kk_attend SET kk_attend_status = ? WHERE kk_attend_idx = ?`;
      const update_value = [attendStatus, attendIdx];

      // 데이터베이스 쿼리 실행
      connection_KK.query(update_query, update_value, (err, data) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            message: err.sqlMessage,
          });
        }
        // 결과 반환
        return res.status(200).json({
          message: "Attend Update Success! - 200 OK",
        });
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
  // TODO# KK Agency Reservation Data READ
  getKKAgencyReservationDataRead: async (req, res) => {
    console.log("KK Agency Reservation Data READ API 호출");
    try {
      const { pageNum, userIdx } = req.query;
      // 클라이언트로부터 페이지 번호 받기 (기본값: 1)
      // console.log(pageNum);
      const page = pageNum || 1;
      const limit = 10; // 한 페이지에 보여줄 리뷰의 수
      const offset = (page - 1) * limit;

      if (true) {
        // Pagination Last Number Select
        // const count_query = `SELECT COUNT(*) FROM kk_reservation WHERE kk_teacher_idx = '${userIdx}'`;
        const count_query = `SELECT COUNT(*)
FROM kk_attend AS a
JOIN kk_reservation AS r ON a.kk_reservation_idx = r.kk_reservation_idx
WHERE r.kk_teacher_idx = '${userIdx}' AND r.kk_reservation_approve_status = '1'`;
        const count_data = await fetchUserData(connection_KK, count_query);
        const lastPageNum = Math.ceil(count_data[0]["COUNT(*)"] / limit);
        // console.log(lastPageNum);

        // SQL 쿼리 준비: 최신순으로 유저 데이터 가져오기
        // const select_query = `SELECT * FROM ${user_table} WHERE kk_${userClass}_approve_status = '0' ORDER BY kk_${userClass}_created_at DESC LIMIT ? OFFSET ?`;
        const select_query = `SELECT
    c.kk_class_title,
    t.kk_teacher_name,
    a.kk_attend_idx,
    a.kk_attend_date,
    a.kk_attend_status,
    ag.kk_agency_name
FROM kk_attend AS a
JOIN kk_reservation AS r ON a.kk_reservation_idx = r.kk_reservation_idx
JOIN kk_teacher AS t ON r.kk_teacher_idx = t.kk_teacher_idx
JOIN kk_class AS c ON r.kk_class_idx = c.kk_class_idx
JOIN kk_agency AS ag ON r.kk_agency_idx = ag.kk_agency_idx
WHERE r.kk_teacher_idx = '${userIdx}'
AND r.kk_reservation_approve_status = '1'
ORDER BY a.kk_attend_date DESC LIMIT ? OFFSET ?;
`;
        const select_values = [limit, offset];
        // 데이터베이스 쿼리 실행
        connection_KK.query(select_query, select_values, (err, data) => {
          if (err) {
            console.log(err);
            return res.status(400).json({
              message: "User SignUp Request READ Fail! - 400",
              page: -1,
              limit: -1,
              lastPageNum: -1,
              data: [],
            });
          }
          // 결과 반환
          return res.status(200).json({
            message: "User SignUp Request READ Success! - 200",
            page,
            limit,
            lastPageNum,
            data: data,
          });
        });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
};

module.exports = {
  mypageController,
};
