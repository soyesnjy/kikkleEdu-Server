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
  // #TODO: KK Schedule Data READ
  getKKSchedulerDataRead: async (req, res) => {
    try {
      const query = req.query;
      const { monthQuery, searchQuery } = query;
      console.log(query);

      let select_query;

      select_query = `
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
      WHERE MONTH(kk_scheduler_start) = ${monthQuery}
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
  // #TODO: KK Schedule Data CREATE
  postKKSchedulerDataCreate: async (req, res) => {
    const { data } = req.body;
    // console.log(data);
    let parseData;

    try {
      // 입력값 파싱
      if (typeof data === "string") {
        parseData = JSON.parse(data);
      } else parseData = data;

      const {
        // 예약 데이터
        agencyIdx, // default userIdx === dummy 계정
        title,
        content,
        isPrivate,
      } = parseData;

      // Input 없을 경우
      if (!agencyIdx || !title || !content) {
        return res
          .status(400)
          .json({ message: "Non Input Value - 400 Bad Request" });
      }

      const select_query = `SELECT kk_agency_type FROM kk_agency WHERE kk_agency_idx='${agencyIdx}'`;
      const select_data = await fetchUserData(connection_KK, select_query);

      // 게시글 DB INSERT
      if (true) {
        // INSERT Board
        const insert_query = `INSERT INTO kk_board
        (kk_agency_idx, 
        kk_board_type, 
        kk_board_title, 
        kk_board_content, 
        kk_board_reply, 
        kk_board_private) 
        VALUES (?, ?, ?, ?, ?, ?)`;
        // console.log(insert_query);

        // INSERT Value 명시
        const insert_value_obj = {
          attr1: agencyIdx,
          attr2: select_data[0].kk_agency_type === "admin" ? "notice" : "",
          attr3: title, // 강사 idx. 관리자 페이지에서 update
          attr4: content,
          attr5: "",
          attr6: isPrivate ? 1 : 0,
        };
        // console.log(insert_value_obj);

        // 게시글 생성
        connection_KK.query(
          insert_query,
          Object.values(insert_value_obj),
          (error, rows, fields) => {
            if (error) {
              console.log(error);
              res.status(400).json({ message: error.sqlMessage });
            } else {
              console.log("Board Row DB INSERT Success!");
              res.status(200).json({
                message: "Board Row DB INSERT Success! - 200 OK",
              });
            }
          }
        );
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error - 500 Bad Gateway" });
    }
  },
  // #TODO: KK Schedule Data UPDATE
  postKKSchedulerDataUpdate: async (req, res) => {
    const { data } = req.body;
    // console.log(data);
    let parseData;

    try {
      // 입력값 파싱
      if (typeof data === "string") {
        parseData = JSON.parse(data);
      } else parseData = data;

      const { boardIdx, title, content } = parseData;

      // 필수 Input 없을 경우
      if (!boardIdx || !title || !content) {
        console.log("Non Input Value - 400");
        return res.status(400).json({ message: "Non Input Value - 400" });
      }

      // 게시글 DB update

      // update Board
      const update_query = `UPDATE kk_board SET
      kk_board_title = ?,
      kk_board_content = ?
      WHERE kk_board_idx = ?`;

      // update Value 명시
      const update_value_obj = {
        attr3: title, // 강사 idx. 관리자 페이지에서 update
        attr4: content,
        pKey: boardIdx,
      };

      try {
        await queryAsync(
          connection_KK,
          update_query,
          Object.values(update_value_obj)
        );
        console.log(`Board Row DB UPDATE Success!`);
        return res.status(200).json({
          message: "Board Row DB UPDATE Success! - 200 OK",
        });
      } catch (err) {
        console.error("Error executing query:", err);
        return res.status(500).json({
          message: `Server Error: ${err.sqlMessage}`,
        });
      }

      // 게시글 생성
      // connection_KK.query(
      //   update_query,
      //   Object.values(update_value_obj),
      //   (error, rows, fields) => {
      //     if (error) {
      //       console.log(error);
      //       res.status(400).json({ message: error.sqlMessage });
      //     } else {
      //       console.log("Board Row DB INSERT Success!");
      //       res.status(200).json({
      //         message: "Board Row DB INSERT Success! - 200 OK",
      //       });
      //     }
      //   }
      // );
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error - 500 Bad Gateway" });
    }
  },
  // #TODO: KK Schedule Data DELETE
  deleteKKSchedulerDataDelete: (req, res) => {
    console.log("Board Data DELETE API 호출");
    const { boardIdx } = req.query;
    try {
      const delete_query = `DELETE FROM kk_board WHERE kk_board_idx = ?`;

      connection_KK.query(delete_query, [boardIdx], (err) => {
        if (err) {
          console.log(err);
          res.json({ message: err.sqlMessage });
        } else {
          console.log("Board DB Delete Success!");
          res.status(200).json({ message: "Board DB Delete Success!" });
        }
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
};

module.exports = {
  SchedulerController,
};
