// MySQL 접근
const mysql = require("mysql");
const { dbconfig_ai, dbconfig_kk } = require("../DB/database");

// AI DB 연결
const connection_AI = mysql.createConnection(dbconfig_ai);
connection_AI.connect();

// 키클 DB 연결
const connection_KK = mysql.createConnection(dbconfig_kk);
connection_KK.connect();

// 구글 권한 관련
const { google } = require("googleapis");

// GCP IAM 서비스 계정 인증
const serviceAccount = {
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  project_id: process.env.GOOGLE_PROJECT_ID,
};

const auth_google_drive = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth: auth_google_drive });

const { KK_User_Table_Info } = require("../DB/database_table_info");

const fileDriveSave = async (fileData) => {
  // 첨부파일 Google Drive 저장
  const { fileName, fileType, baseData } = fileData;
  const [baseType, zipBase64] = baseData.split(",");
  const bufferStream = new stream.PassThrough();
  bufferStream.end(Buffer.from(zipBase64, "base64"));

  const fileMetadata = {
    name: fileName,
  };

  const media = {
    mimeType: fileType,
    body: bufferStream,
  };

  // 파일 업로드
  const file = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: "id, webViewLink, webContentLink",
  });

  // 파일을 Public으로 설정
  await drive.permissions.create({
    fileId: file.data.id,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  // soyesnjy@gmail.com 계정에게 파일 공유 설정 (writer 권한)
  await drive.permissions.create({
    fileId: file.data.id,
    requestBody: {
      role: "writer",
      type: "user",
      emailAddress: "soyesnjy@gmail.com",
    },
    // transferOwnership: true, // role:'owner' 일 경우
  });

  // Public URL을 가져오기 위해 파일 정보를 다시 가져옴
  const uploadFile = await drive.files.get({
    fileId: file.data.id,
    fields: "id, webViewLink, webContentLink",
  });

  return uploadFile;
};

const ReservationController = {
  // KK Reservation Data READ
  getKKReservationDataRead: (req, res) => {
    console.log("KK Reservation Data READ API 호출");
    try {
      const query = req.query;
      const { date } = query; // classIdx 필수, dayofweek 선택
      const reservation_table = KK_User_Table_Info["reservation"].table;
      const class_table = KK_User_Table_Info["class"].table;
      const agency_table = KK_User_Table_Info["agency"].table;
      const reservation_teacher_table =
        KK_User_Table_Info["reservation_teacher"].table;
      const teacher_table = KK_User_Table_Info["teacher"].table;

      const select_query = `SELECT 
    r.kk_reservation_idx,
    r.kk_teacher_idx,
    r.kk_reservation_date,
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
    ) AS teacher_info
FROM 
    ${reservation_table} AS r
JOIN 
    ${class_table} AS c ON r.kk_class_idx = c.kk_class_idx
JOIN 
    ${agency_table} AS a ON r.kk_agency_idx = a.kk_agency_idx
JOIN 
    ${reservation_teacher_table} AS rt ON r.kk_reservation_idx = rt.kk_reservation_idx
JOIN 
    ${teacher_table} AS t ON rt.kk_teacher_idx = t.kk_teacher_idx
${date ? `WHERE kk_reservation_date LIKE '%${date}%'` : ""}
GROUP BY 
    r.kk_reservation_idx, c.kk_class_title, a.kk_agency_name
ORDER BY 
    r.kk_reservation_created_at DESC;
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
        // console.log(data);
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

      // TODO# 예약 DB INSERT Reservation
      if (true) {
        const reservation_table = KK_User_Table_Info["reservation"].table;
        const reservation_attribute =
          KK_User_Table_Info["reservation"].attribute;

        // INSERT Reservation
        delete reservation_attribute.pKey; // kk_reservation_idx
        delete reservation_attribute.attr10; // kk_reservation_created_at
        delete reservation_attribute.attr11; // kk_reservation_updated_at

        const insert_query = `INSERT INTO ${reservation_table} (${Object.values(
          reservation_attribute
        ).join(", ")}) VALUES (${Object.values(reservation_attribute)
          .map((el) => "?")
          .join(", ")})`;
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
          attr8: "", //reservationCand.join("/")
          attr9: 0,
        };
        // console.log(insert_value_obj);

        // 계정 생성 (비동기 처리)
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
              const table = KK_User_Table_Info["reservation_teacher"].table;
              const attribute =
                KK_User_Table_Info["reservation_teacher"].attribute;
              const insert_query = `INSERT INTO ${table} (${attribute.attr1}, ${
                attribute.attr2
              }) VALUES ${reservationCand
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

            // 담당 강사가 결정되는 시점에서 attend table에 row insert
            // // teacher_class Table Insert
            // const reservation_id = rows.insertId; // 삽입한 강사의 pKey
            // const attend_table = KK_User_Table_Info["attend"].table;
            // const attend_attribute = KK_User_Table_Info["attend"].attribute;

            // const insert_query = `INSERT INTO ${attend_table} (${
            //   attend_attribute.attr1
            // }, ${attend_attribute.attr2}, ${
            //   attend_attribute.attr3
            // }) VALUES ${sortedReservationDate
            //   .map((el) => {
            //     return `(${reservation_id}, ${el}, 0)`;
            //   })
            //   .join(", ")}`;

            // connection_KK.query(insert_query, null, (err) => {
            //   if (error) {
            //     console.log(error);
            //     res.status(400).json({ message: error.sqlMessage });
            //   } else {
            //     console.log("Reservation Row DB INSERT Success!");
            //     res.status(200).json({
            //       message: "Reservation Row DB INSERT Success! - 200 OK",
            //     });
            //   }
            // });
          }
        );
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error - 500 Bad Gateway" });
    }
  },
  // TODO# KK Reservation Data UPDATE
  postKKReservationDataUpdate: async (req, res) => {
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

      const reservation_table = KK_User_Table_Info["reservation"].table;
      const reservation_attribute = KK_User_Table_Info["reservation"].attribute;

      const update_query = `UPDATE ${reservation_table} SET ${reservation_attribute.attr3} = ?, ${reservation_attribute.attr9} = ? WHERE kk_reservation_idx = ?`;
      // console.log(update_query);

      const update_value_obj = {
        attr3: teacherIdx,
        attr9: approveStatus,
        pKey: reservationIdx,
      };

      // console.log(update_value_obj);

      if (true) {
        connection_KK.query(
          update_query,
          Object.values(update_value_obj),
          (error, rows, fields) => {
            if (error) {
              console.log(error);
              res.status(400).json({ message: error.sqlMessage });
            } else if (attendTrigger) {
              // attend Table Insert
              const table = KK_User_Table_Info["attend"].table;
              const attribute = KK_User_Table_Info["attend"].attribute;
              const insert_query = `INSERT INTO ${table} (${attribute.attr1}, ${
                attribute.attr2
              }, ${attribute.attr3}) VALUES ${dateArr
                .map((el) => {
                  return `(${reservationIdx}, '${el}', 0)`;
                })
                .join(", ")}`;

              console.log(insert_query);

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
            } else {
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
  // KK Reservation Data DELETE
  deleteKKReservationDataDelete: (req, res) => {
    console.log("Reservation Data DELETE API 호출");
    const { reservationIdx } = req.query;
    try {
      const reservation_table = KK_User_Table_Info["reservation"].table;
      const delete_query = `DELETE FROM ${reservation_table} WHERE kk_reservation_idx = ?`;

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
  ReservationController,
};
