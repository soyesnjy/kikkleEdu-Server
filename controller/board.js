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

const BoardController = {
  // KK Board Data READ
  getKKBoardDataRead: async (req, res) => {
    // console.log("KK Board Data READ API 호출");
    try {
      const query = req.query;
      const { pageNum, boardIdx } = query; // 날짜 검색
      // console.log(boardIdx);
      const page = pageNum || 1;
      const limit = 10; // 한 페이지에 보여줄 리뷰의 수
      const offset = (page - 1) * limit;

      // Pagination Last Number Select
      const count_query = `SELECT COUNT(*) FROM kk_board`;
      const count_data = await fetchUserData(connection_KK, count_query);
      const lastPageNum = Math.ceil(count_data[0]["COUNT(*)"] / limit);
      // console.log(lastPageNum);
      let select_query;
      if (boardIdx) {
        select_query = `SELECT 
      b.kk_board_title,
      b.kk_board_content,
      b.kk_board_private,
      b.kk_board_created_at,
      a.kk_agency_type,
      a.kk_agency_name
  FROM 
      kk_board AS b
  JOIN 
      kk_agency AS a ON b.kk_agency_idx = a.kk_agency_idx
  WHERE b.kk_board_idx = '${boardIdx}'
  ORDER BY 
      b.kk_board_created_at DESC LIMIT ? OFFSET ?;
  `;
      } else {
        select_query = `SELECT 
      b.kk_board_idx,
      b.kk_board_type,
      b.kk_board_title,
      b.kk_board_private,
      b.kk_board_created_at,
      a.kk_agency_type,
      a.kk_agency_name
  FROM 
      kk_board AS b
  JOIN 
      kk_agency AS a ON b.kk_agency_idx = a.kk_agency_idx
  ORDER BY 
      CASE 
          WHEN a.kk_agency_type = 'admin' THEN 0
          ELSE 1
      END,
      b.kk_board_created_at DESC 
  LIMIT ? OFFSET ?;
  `;
      }

      // console.log(select_query);
      // 데이터베이스 쿼리 실행
      connection_KK.query(select_query, [limit, offset], (err, data) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            message: err.sqlMessage,
          });
        }
        // console.log(data);
        // 결과 반환
        return res.status(200).json({
          message: "Board Access Success! - 200 OK",
          page,
          limit,
          lastPageNum,
          data: data.map((row) => {
            return {
              number: row.kk_board_idx,
              title: row.kk_board_title,
              content: row.kk_board_content ? row.kk_board_content : "",
              author: row.kk_agency_name,
              date: row.kk_board_created_at,
              isNotice: row.kk_board_type === "notice",
              isPrivate: row.kk_board_private,
            };
          }),
        });
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
  // TODO# KK Board Data CREATE
  postKKBoardDataCreate: async (req, res) => {
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
        agencyIdx, // 기관 idx
        classIdx, // 수업 idx
        reservationDate, // 날짜 Array
        reservationTime, // 수업 시간대 (오전/오후/야간)
        reservationCand, // 강사 후보 Array
      } = parseData;

      // Input 없을 경우
      if (
        !agencyIdx ||
        !classIdx ||
        !reservationDate.length ||
        !reservationTime ||
        !reservationCand.length
      ) {
        return res
          .status(400)
          .json({ message: "Non Input Value - 400 Bad Request" });
      }

      const sortedReservationDate = [
        ...reservationDate.sort((a, b) => new Date(a) - new Date(b)),
      ];
      // console.log(sortedReservationDate);

      // 예약 DB INSERT Reservation
      if (true) {
        // INSERT Reservation
        const insert_query = `INSERT INTO kk_reservation (kk_agency_idx, kk_class_idx, kk_teacher_idx, kk_reservation_date, kk_reservation_start_date, kk_reservation_end_date, kk_reservation_time, kk_reservation_approve_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        // console.log(insert_query);

        // INSERT Value 명시
        const insert_value_obj = {
          attr1: agencyIdx,
          attr2: classIdx,
          attr3: null, // 강사 idx. 관리자 페이지에서 update
          attr4: sortedReservationDate.join("/"),
          attr5: sortedReservationDate[0],
          attr6: sortedReservationDate[sortedReservationDate.length - 1],
          attr7: reservationTime,
          attr8: 0,
        };
        // console.log(insert_value_obj);

        // 예약 생성
        connection_KK.query(
          insert_query,
          Object.values(insert_value_obj),
          (error, rows, fields) => {
            if (error) {
              console.log(error);
              res.status(400).json({ message: error.sqlMessage });
            } else {
              // reservation_teacher Table Insert
              const reservaion_id = rows.insertId; // 삽입한 강사의 pKey

              const insert_query = `INSERT INTO kk_reservation_teacher (kk_reservation_idx, kk_teacher_idx) VALUES ${reservationCand
                .map((el) => {
                  return `(${reservaion_id}, ${el})`;
                })
                .join(", ")}`;

              connection_KK.query(insert_query, null, (err) => {
                if (error) {
                  console.log(error);
                  res.status(400).json({ message: error.sqlMessage });
                } else {
                  console.log("Reservation Row DB INSERT Success!");
                  res.status(200).json({
                    message: "Reservation Row DB INSERT Success! - 200 OK",
                  });
                }
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
  // TODO# KK Board Data UPDATE
  postKKBoardDataUpdate: async (req, res) => {
    const { SignUpData } = req.body;
    console.log(SignUpData);

    let parseSignUpData;
    try {
      // 입력값 파싱
      if (typeof SignUpData === "string") {
        parseSignUpData = JSON.parse(SignUpData);
      } else parseSignUpData = SignUpData;

      const {
        reservationIdx,
        dateArr,
        teacherIdx,
        attendTrigger,
        approveStatus, // 승인 상태 공통
      } = parseSignUpData;

      // Input 없을 경우
      if (!reservationIdx) {
        return res
          .status(400)
          .json({ message: "Non Reservation Input Value - 400 Bad Request" });
      }

      // const reservation_table = KK_User_Table_Info["reservation"].table;
      // const reservation_attribute = KK_User_Table_Info["reservation"].attribute;

      const update_query = `UPDATE kk_reservation SET kk_teacher_idx = ?, kk_reservation_approve_status = ? WHERE kk_reservation_idx = ?`;
      // console.log(update_query);

      const update_value_obj = {
        attr3: teacherIdx,
        attr9: approveStatus,
        pKey: reservationIdx,
      };

      // console.log(update_value_obj);

      // reservationIdx에 연결된 attend row select
      const select_query = `SELECT * FROM kk_attend WHERE kk_reservation_idx = ${reservationIdx}`;
      const select_attend_data = await fetchUserData(
        connection_KK,
        select_query
      );

      // console.log(select_attend_data);

      if (true) {
        connection_KK.query(
          update_query,
          Object.values(update_value_obj),
          (error, rows, fields) => {
            if (error) {
              console.log(error);
              res.status(400).json({ message: error.sqlMessage });
            }
            // 첫 강사 확정일 경우 && attend table에 reservationIdx와 연결된 row가 없을 경우
            else if (attendTrigger && !select_attend_data.length) {
              // attend Table Insert
              // 2024.08.30: import 에러 관련 처리
              const insert_query = `INSERT INTO kk_attend (kk_reservation_idx, kk_attend_date, kk_attend_status) VALUES ${dateArr
                .map((el) => {
                  return `(${reservationIdx}, '${el}', 0)`;
                })
                .join(", ")}`;

              // console.log(insert_query);

              connection_KK.query(insert_query, null, (err) => {
                if (error) {
                  console.log(error);
                  res.status(400).json({ message: error.sqlMessage });
                } else {
                  console.log("Reservation Update && Attend Insert Success!");
                  res.status(200).json({
                    message:
                      "Reservation Update && Attend Insert Success! - 200 OK",
                  });
                }
              });
            }
            // 확정 강사 수정일 경우
            else {
              console.log("Reservation Row DB INSERT Success!");
              res.status(200).json({
                message: "Reservation Update Success! - 200 OK",
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
  // TODO# KK Board Data DELETE
  deleteKKBoardDataDelete: (req, res) => {
    console.log("Reservation Data DELETE API 호출");
    const { reservationIdx } = req.query;
    try {
      const delete_query = `DELETE FROM kk_reservation WHERE kk_reservation_idx = ?`;

      connection_KK.query(delete_query, [reservationIdx], (err) => {
        if (err) {
          console.log(err);
          res.json({ message: err.sqlMessage });
        } else {
          console.log("Reservation DB Delete Success!");
          res.status(200).json({ message: "Reservation DB Delete Success!" });
        }
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
};

module.exports = {
  BoardController,
};