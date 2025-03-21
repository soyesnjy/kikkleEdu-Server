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

const ReservationController = {
  // KK Reservation Data READ
  getKKReservationDataRead: async (req, res) => {
    // console.log("KK Reservation Data READ API 호출");
    try {
      const query = req.query;
      const { date, pageNum } = query; // 날짜 검색
      // console.log(pageNum);
      const page = pageNum || 1;
      const limit = 10; // 한 페이지에 보여줄 리뷰의 수
      const offset = (page - 1) * limit;

      // Pagination Last Number Select
      // const count_query = `SELECT COUNT(*) FROM kk_reservation AS r
      // LEFT JOIN kk_teacher AS t ON r.kk_teacher_idx = t.kk_teacher_idx
      // WHERE (r.kk_teacher_idx IS NULL OR t.kk_teacher_approve_status = 1)`;

      const count_query = `
      SELECT COUNT(*)
      FROM (
          SELECT r.kk_reservation_idx
          FROM kk_reservation AS r
          JOIN kk_class AS c ON r.kk_class_idx = c.kk_class_idx
          JOIN kk_agency AS a ON r.kk_agency_idx = a.kk_agency_idx
          JOIN kk_reservation_teacher AS rt ON r.kk_reservation_idx = rt.kk_reservation_idx
          JOIN kk_teacher AS t ON rt.kk_teacher_idx = t.kk_teacher_idx
          WHERE t.kk_teacher_approve_status = 1
          ${date ? `AND r.kk_reservation_date LIKE '%${date}%'` : ""}
          GROUP BY r.kk_reservation_idx
      ) AS count_table`;

      const select_query = `SELECT 
      r.kk_reservation_idx,
      r.kk_teacher_idx,
      r.kk_reservation_date,
      r.kk_reservation_time,
      r.kk_reservation_approve_status,
      r.kk_class_idx,
      c.kk_class_title,
      a.kk_agency_name,
      a.kk_agency_phoneNum,
      GROUP_CONCAT(
          CONCAT(
              'kk_teacher_idx:',t.kk_teacher_idx,', ',
              'kk_teacher_name:',t.kk_teacher_name
          ) SEPARATOR ' | '
      ) AS teacher_info , (${count_query}) AS total_count
      FROM kk_reservation AS r
      JOIN kk_class AS c ON r.kk_class_idx = c.kk_class_idx
      JOIN kk_agency AS a ON r.kk_agency_idx = a.kk_agency_idx
      JOIN kk_reservation_teacher AS rt ON r.kk_reservation_idx = rt.kk_reservation_idx
      JOIN kk_teacher AS t ON rt.kk_teacher_idx = t.kk_teacher_idx
      WHERE t.kk_teacher_approve_status = 1
      ${date ? `AND kk_reservation_date LIKE '%${date}%'` : ""}
      GROUP BY r.kk_reservation_idx, c.kk_class_title, a.kk_agency_name
      ORDER BY r.kk_reservation_created_at DESC LIMIT ? OFFSET ?;
      `;

      // console.log(select_query);
      // 데이터베이스 쿼리 실행
      connection_KK.query(select_query, [limit, offset], (err, data) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            message: err.sqlMessage,
          });
        }
        const total_count = data.length > 0 ? data[0].total_count : 0;
        const lastPageNum = Math.ceil(total_count / limit);
        // console.log(total_count);
        // 결과 반환
        return res.status(200).json({
          message: "Teacher Access Success! - 200 OK",
          page,
          limit,
          lastPageNum,
          data,
        });
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
  // KK Reservation Data CREATE
  postKKReservationDataCreate: async (req, res) => {
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
        const insert_query = `INSERT INTO kk_reservation 
        (
        kk_agency_idx,
        kk_class_idx,
        kk_teacher_idx,
        kk_reservation_date,
        kk_reservation_start_date,
        kk_reservation_end_date,
        kk_reservation_time,
        kk_reservation_approve_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
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
                  // console.log("Reservation Row DB INSERT Success!");
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
  // KK Reservation Data UPDATE
  postKKReservationDataUpdate: async (req, res) => {
    const { SignUpData } = req.body;
    // console.log(SignUpData);

    let parseSignUpData, sortedReservationDate;
    try {
      // 입력값 파싱
      if (typeof SignUpData === "string") {
        parseSignUpData = JSON.parse(SignUpData);
      } else parseSignUpData = SignUpData;

      const {
        reservationIdx,
        dateArr,
        teacherIdx,
        attendTrigger, // 첫 강사 매칭 트리거
        approveStatus, // 승인 상태 공통
      } = parseSignUpData;

      // Input 없을 경우
      if (!reservationIdx) {
        return res
          .status(400)
          .json({ message: "Non Reservation Input Value - 400 Bad Request" });
      }

      // dateArr 정렬
      if (dateArr) {
        sortedReservationDate = [
          ...dateArr.sort((a, b) => new Date(a) - new Date(b)),
        ];
      }

      const reservation_table = KK_User_Table_Info["reservation"].table;
      // const reservation_attribute = KK_User_Table_Info["reservation"].attribute;

      const update_query = `UPDATE
      ${reservation_table} SET kk_teacher_idx = ?,
      ${dateArr ? "kk_reservation_date = ?," : ""}
      kk_reservation_approve_status = ?
      WHERE kk_reservation_idx = ?`;

      const update_value_obj = {
        attr3: teacherIdx,
        ...(dateArr && {
          attr4: sortedReservationDate.join("/"),
        }),
        attr9: approveStatus,
        pKey: reservationIdx,
      };

      try {
        // 예약 Table 수정
        await queryAsync(
          connection_KK,
          update_query,
          Object.values(update_value_obj)
        );

        // 날짜 수정인 경우 => attend Talbe 삭제 후 수정
        if (attendTrigger || dateArr) {
          // 출석 테이블 기존 날짜 삭제 (Delete kk_attend)
          const delete_query = `DELETE FROM kk_attend WHERE kk_reservation_idx = ${reservationIdx};`;
          await queryAsync(connection_KK, delete_query, null);

          // 갱신된 날짜 삽입 (Insert kk_attend)
          const insert_query = `INSERT INTO kk_attend
          (kk_reservation_idx, kk_attend_date, kk_attend_status) 
          VALUES ${sortedReservationDate
            .map((el) => {
              return `(${reservationIdx}, '${el}', 0)`;
            })
            .join(", ")}`;
          await queryAsync(connection_KK, insert_query, null);
        }
      } catch (err) {
        console.error("Error executing query:", err);
        return res.status(500).json({
          message: `Server Error: ${err.sqlMessage}`,
        });
      }

      // Table 수정 종료
      return res.status(200).json({
        message: "Reservation Update Success! - 200 OK",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error - 500 Bad Gateway" });
    }
  },
  // KK Reservation Data DELETE
  deleteKKReservationDataDelete: (req, res) => {
    // console.log("Reservation Data DELETE API 호출");
    const { reservationIdx } = req.query;
    try {
      const delete_query = `DELETE FROM kk_reservation WHERE kk_reservation_idx = ?`;

      connection_KK.query(delete_query, [reservationIdx], (err) => {
        if (err) {
          console.log(err);
          res.json({ message: err.sqlMessage });
        } else {
          // console.log("Reservation DB Delete Success!");
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
  ReservationController,
};
