// MySQL 접근
const mysql = require("mysql");
const { dbconfig_kk } = require("../DB/database");

// 키클 DB 연결
const connection_KK = mysql.createConnection(dbconfig_kk);
connection_KK.connect();

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

const SchedulerController = {
  // KK Schedule Data READ
  getKKSchedulerDataRead: async (req, res) => {
    try {
      const query = req.query;
      const { monthQuery, searchQuery } = query;
      // console.log(query);

      const select_query = `
      SELECT
      kk_scheduler_idx AS id,
      kk_scheduler_title AS title,
      DATE_FORMAT(kk_scheduler_start, '%Y-%m-%dT%H:%i:%s') AS start,
      DATE_FORMAT(kk_scheduler_end, '%Y-%m-%dT%H:%i:%s')   AS end,
      kk_scheduler_backgroundColor AS backgroundColor,
      JSON_OBJECT(
        'teacherName',      kk_scheduler_teacher,
        'courseName',       kk_scheduler_courseName,
        'participants',     kk_scheduler_participants,
        'times',            kk_scheduler_times,
        'courseTimes',      kk_scheduler_courseTimes,
        'notes',            kk_scheduler_notes
      ) AS extendedProps
      FROM kk_scheduler
      WHERE MONTH(kk_scheduler_start) IN (
        CASE WHEN ${monthQuery} = 1  THEN 12 ELSE ${monthQuery} - 1 END,
        ${monthQuery},
        CASE WHEN ${monthQuery} = 12 THEN 1  ELSE ${monthQuery} + 1 END
      )
      ${searchQuery ? `AND kk_scheduler_teacher LIKE '%${searchQuery}%'` : ""}
      `;

      // console.log(select_query);
      // 데이터베이스 쿼리 실행
      connection_KK.query(select_query, null, (err, rows) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            message: err.sqlMessage,
          });
        }
        // extendedProps 속성 파싱
        const data = rows.map((row) => {
          return {
            ...row,
            extendedProps: row.extendedProps
              ? JSON.parse(row.extendedProps)
              : {},
          };
        });
        // 결과 반환
        return res.status(200).json({
          message: "Scheduler Access Success! - 200 OK",
          data,
        });
      });
    } catch (err) {
      delete err.headers;
      console.error(err);
      return res.status(500).json({
        message: `Server Error : ${err.message}`,
      });
    }
  },
  // KK Schedule Data CREATE
  postKKSchedulerDataCreate: async (req, res) => {
    const { data } = req.body;
    // console.log(data);
    let parseData;

    try {
      // 입력값 파싱
      if (typeof data === "string") {
        parseData = JSON.parse(data);
      } else parseData = data;

      const { title, start, end, extendedProps, backgroundColor } = parseData;

      // 필수 Input 없을 경우1
      if (!title || !start || !end || !extendedProps || !backgroundColor) {
        console.log("Non Input Value - 400");
        return res.status(400).json({ message: "Non Input Value - 400" });
      }

      const {
        teacherName,
        courseName,
        participants,
        times,
        courseTimes,
        notes,
      } = extendedProps;

      // 필수 Input 없을 경우2
      if (
        !teacherName ||
        !courseName ||
        participants < 0 ||
        !times ||
        !courseTimes
      ) {
        console.log("Non Input Value - 400");
        return res.status(400).json({ message: "Non Input Value - 400" });
      }

      // INSERT Board
      const insert_query = `INSERT INTO kk_scheduler
      (kk_scheduler_start,
      kk_scheduler_end,
      kk_scheduler_title,
      kk_scheduler_teacher,
      kk_scheduler_courseName,
      kk_scheduler_participants,
      kk_scheduler_times,
      kk_scheduler_backgroundColor,
      kk_scheduler_courseTimes,
      kk_scheduler_notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      // console.log(insert_query);

      // INSERT Value 명시
      const insert_value = [
        start,
        end, // 강사 idx. 관리자 페이지에서 update
        title,
        teacherName,
        courseName,
        participants,
        times,
        backgroundColor,
        courseTimes,
        notes,
      ];

      // console.log(insert_value_obj);

      // 게시글 생성
      connection_KK.query(insert_query, insert_value, (error, result) => {
        if (error) {
          console.log(error);
          return res.status(400).json({ message: error.sqlMessage });
        }
        return res.status(200).json({
          message: "Scheduler Row DB INSERT Success! - 200 OK",
          data: {
            id: result.insertId,
          },
        });
      });
    } catch (err) {
      delete err.headers;
      console.error(err);
      return res.status(500).json({
        message: `Server Error : ${err.message}`,
      });
    }
  },
  // KK Schedule Data Drag UPDATE
  postKKSchedulerDataDragUpdate: async (req, res) => {
    const { data } = req.body;
    // console.log(data);
    let parseData;

    try {
      // 입력값 파싱
      if (typeof data === "string") {
        parseData = JSON.parse(data);
      } else parseData = data;

      const { id, start, end } = parseData;

      // 필수 Input 없을 경우
      if (!id || !start || !end) {
        console.log("Non Input Value - 400");
        return res.status(400).json({ message: "Non Input Value - 400" });
      }

      // Update SQL Query
      const update_query = `UPDATE kk_scheduler SET
      kk_scheduler_start = ?,
      kk_scheduler_end = ?
      WHERE kk_scheduler_idx = ?`;

      // Update Value 명시
      const update_value = [start, end, id];

      try {
        await queryAsync(connection_KK, update_query, update_value);
        return res.status(200).json({
          message: "Scheduler Row DB UPDATE Success! - 200 OK",
        });
      } catch (err) {
        console.error("Error executing query:", err);
        return res.status(500).json({
          message: `Server Error: ${err.sqlMessage}`,
        });
      }
    } catch (err) {
      delete err.headers;
      console.error(err);
      return res.status(500).json({
        message: `Server Error : ${err.message}`,
      });
    }
  },
  // KK Schedule Data Click UPDATE
  postKKSchedulerDataClickUpdate: async (req, res) => {
    const { data } = req.body;
    // console.log(data);
    let parseData;

    try {
      // 입력값 파싱
      if (typeof data === "string") {
        parseData = JSON.parse(data);
      } else parseData = data;

      const { id, title, end, extendedProps, backgroundColor } = parseData;

      // 필수 Input 없을 경우
      if (!id || !title || !end || !extendedProps || !backgroundColor) {
        console.log("Non Input Value - 400");
        return res.status(400).json({ message: "Non Input Value - 400" });
      }

      const {
        teacherName,
        courseName,
        participants,
        times,
        courseTimes,
        notes,
      } = extendedProps;

      // 필수 Input 없을 경우2
      if (
        !teacherName ||
        !courseName ||
        participants < 0 ||
        !times ||
        !courseTimes
      ) {
        console.log("Non Input Value - 400");
        return res.status(400).json({ message: "Non Input Value - 400" });
      }

      // Update SQL Query
      const update_query = `UPDATE kk_scheduler SET
      kk_scheduler_title = ?,
      kk_scheduler_end = ?,
      kk_scheduler_backgroundColor = ?,
      kk_scheduler_teacher = ?,
      kk_scheduler_courseName = ?,
      kk_scheduler_participants = ?,
      kk_scheduler_times = ?,
      kk_scheduler_courseTimes = ?,
      kk_scheduler_notes = ?
      WHERE kk_scheduler_idx = ?`;

      // Update Value
      const update_value = [
        title,
        end,
        backgroundColor,
        teacherName,
        courseName,
        participants,
        times,
        courseTimes,
        notes,
        id,
      ];

      try {
        await queryAsync(connection_KK, update_query, update_value);
        return res.status(200).json({
          message: "Scheduler Row DB UPDATE Success! - 200 OK",
        });
      } catch (err) {
        console.error("Error executing query:", err);
        return res.status(500).json({
          message: `Server Error: ${err.sqlMessage}`,
        });
      }
    } catch (err) {
      delete err.headers;
      console.error(err);
      return res.status(500).json({
        message: `Server Error : ${err.message}`,
      });
    }
  },
  // KK Schedule Data DELETE
  deleteKKSchedulerDataDelete: (req, res) => {
    const { eventId } = req.query;
    try {
      const delete_query = `DELETE FROM kk_scheduler WHERE kk_scheduler_idx = ?`;

      connection_KK.query(delete_query, [eventId], (err) => {
        if (err) {
          console.log(err);
          return res.json({ message: err.sqlMessage });
        }
        return res
          .status(200)
          .json({ message: "Scheduler DB Delete Success!" });
      });
    } catch (err) {
      delete err.headers;
      console.error(err);
      return res.status(500).json({
        message: `Server Error : ${err.message}`,
      });
    }
  },
};

module.exports = {
  SchedulerController,
};
