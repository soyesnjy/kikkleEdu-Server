// stream 데이터 처리
const stream = require("stream");

// MySQL 접근
const mysql = require("mysql");
const { dbconfig, dbconfig_ai, dbconfig_kk } = require("../DB/database");

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

// Database Table Info
const {
  // KK_User_Table_Info,
} = require("../DB/database_table_info");

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
      attr11: "kk_teacher_file_path", // drive 저장 path
      attr12: "kk_teacher_approve_status", // default: 0, 관리자 수정
      attr13: "kk_teacher_created_at",
      attr14: "kk_teacher_updated_at",
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
      attr3: "kk_class_type",
      attr4: "kk_class_file_path",
      attr5: "kk_class_created_at",
      attr6: "kk_class_updated_at",
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
      attr8: "kk_reservation_cand_teacher", // Array String
      attr9: "kk_reservation_approve_status",
      attr10: "kk_reservation_created_at",
      attr11: "kk_reservation_updated_at",
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
};

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

const user_kk_select = async (user_table, user_attribute, parsepUid) => {
  const select_query = `SELECT * FROM ${user_table} WHERE ${user_attribute.attr1}='${parsepUid}'`;
  const select_data = await fetchUserData(connection_KK, select_query);

  return select_data;
};

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

const signupController = {
  // AI 중복 체크
  dupleCheckAIHandler: (req, res) => {
    const { id, vrNum, type } = req.body;

    // MySQL DB 연동
    if (type === "id") {
      connection.query(
        `SELECT * FROM teacher WHERE (teacher_uid = '${id}')`,
        (error, rows, fields) => {
          if (error) console.log(error);
          if (rows.length) {
            res.json({ data: "Fail" });
          } else res.json({ data: "Success" });
        }
      );
    } else {
      connection.query(
        `SELECT * FROM teacher WHERE (vr_number = '${vrNum}')`,
        (error, rows, fields) => {
          if (error) console.log(error);
          if (rows.length) {
            res.json({ data: "Fail" });
          } else res.json({ data: "Success" });
        }
      );
    }
  },
  // KK 회원가입 Create
  postSignupDataCreate: async (req, res) => {
    const { SignUpData } = req.body;
    // console.log(SignUpData);

    let parseSignUpData;
    // const regex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/; // 한글 및 한글 자모를 포함하는 정규 표현식
    try {
      // 입력값 파싱
      if (typeof SignUpData === "string") {
        parseSignUpData = JSON.parse(SignUpData);
      } else parseSignUpData = SignUpData;

      const {
        // 강사 회원가입 데이터
        pUid, // uid 공통
        userClass, // teacher || agency
        passWord, // pwd 공통
        name, // 이름 공통
        phoneNumber, // 전화번호 공통
        possLocal, // 강사 수업 가능 지역
        possDay, // 강사 수업 가능 요일
        possClass, // 강사 가능 수업
        possTime,
        career, // 강사 경력
        education, // 강사 학력
        fileData, // 첨부파일 공통
        // 기관 회원가입 데이터
        address, // 기관 주소
        typeA, // 기관 타입
      } = parseSignUpData;

      // Input 없을 경우
      if (!pUid || !passWord || !fileData) {
        return res
          .status(400)
          .json({ message: "Non Sign Up Input Value - 400 Bad Request" });
      }

      // 입력값이 한글일 경우
      // if (regex.test(pUid) || regex.test(passWard)) {
      //   return res
      //     .status(400)
      //     .json({ message: "Non Korean Input Value - 400 Bad Request" });
      // }
      console.log(`User Create API 호출 - ${userClass}`);
      // const user_table = KK_User_Table_Info[userClass].table;
      // const user_attribute = KK_User_Table_Info[userClass].attribute;

      // 1. SELECT TEST (row가 있는지 없는지 검사)
      const select_query = `SELECT * FROM ${
        userClass === "teacher" ? "kk_teacher" : "kk_agency"
      } WHERE kk_${userClass}_uid ='${pUid}'`;
      const user_data = await fetchUserData(connection_KK, select_query);

      // 2. DUPLICATE USER (row 중복검사)
      if (user_data[0]) {
        // 같은 uid의 User가 이미 존재하는 경우
        return res
          .status(403)
          .json({ message: "Duplicate User - 403 Forbidden" });
      }
      // 3. INSERT USER (row가 없는 경우). 중복 검사 통과
      else {
        if (userClass === "teacher") {
          // Public URL을 가져오기 위해 파일 정보를 다시 가져옴
          const uploadFile = await fileDriveSave(fileData);

          // 2024.08.30: import 에러로 인한 String 처리
          const insert_query = `INSERT INTO kk_teacher (kk_teacher_uid, kk_teacher_pwd, kk_teacher_introduction, kk_teacher_name, kk_teacher_phoneNum, kk_teacher_profileImg_path, kk_teacher_location, kk_teacher_dayofweek, kk_teacher_history, kk_teacher_education, kk_teacher_time, kk_teacher_file_path, kk_teacher_approve_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          // console.log(insert_query);

          // INSERT Value 명시
          const insert_value_obj = {
            attr1: pUid,
            attr2: passWord,
            attr3: "", // 강사 소개글 (관리자)
            attr4: name,
            attr5: phoneNumber,
            attr6: "", // 강사 프로필 사진 (관리자)
            attr7: possLocal,
            attr8: possDay.sort((a, b) => a - b).join("/"),
            attr9: career,
            attr10: education,
            attr11: possTime.sort((a, b) => a - b).join("/"), // 강사 희망 시간대
            attr12: uploadFile.data.webViewLink, // 첨부파일 경로
            attr13: 0,
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
                // teacher_class Table Insert
                const teacher_id = rows.insertId; // 삽입한 강사의 pKey
                const table = KK_User_Table_Info["teacher_class"].table;
                const attribute = KK_User_Table_Info["teacher_class"].attribute;
                const insert_query = `INSERT INTO ${table} (${
                  attribute.attr1
                }, ${attribute.attr2}) VALUES ${possClass
                  .map((el) => {
                    return `(${teacher_id}, ${el})`;
                  })
                  .join(", ")}`;

                connection_KK.query(insert_query, null, (err) => {
                  if (error) {
                    console.log(error);
                    res.status(400).json({ message: error.sqlMessage });
                  } else {
                    console.log("Teacher Row DB INSERT Success!");
                    res
                      .status(200)
                      .json({ message: "Teacher SignUp Success! - 200 OK" });
                  }
                });
              }
            }
          );
        } else {
          // Public URL을 가져오기 위해 파일 정보를 다시 가져옴
          const uploadFile = await fileDriveSave(fileData);

          // 2024.08.30: import 에러로 인한 String 처리
          const insert_query = `INSERT INTO kk_agency (kk_agency_uid, kk_agency_pwd, kk_agency_name, kk_agency_address, kk_agency_phoneNum, kk_agency_type, kk_agency_file_path, kk_agency_approve_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
          // console.log(insert_query);

          // INSERT Value 명시
          const insert_value_obj = {
            attr1: pUid,
            attr2: passWord,
            attr3: name,
            attr4: address,
            attr5: phoneNumber,
            attr6: typeA,
            attr7: uploadFile.data.webContentLink,
            attr8: 0,
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
                console.log("Agency Row DB INSERT Success!");
                res
                  .status(200)
                  .json({ message: "Agency SignUp Success! - 200 OK" });
              }
            }
          );
        }
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error - 500 Bad Gateway" });
    }
  },
  // KK 회원가입 Select - approve_status === 0인 계정 select
  getSignupDataRead: async (req, res) => {
    // console.log("User Data READ API 호출");
    try {
      const { pageNum, userClass, name } = req.query;
      // 클라이언트로부터 페이지 번호 받기 (기본값: 1)
      // console.log(pageNum);
      const page = pageNum || 1;
      const limit = 5; // 한 페이지에 보여줄 리뷰의 수
      const offset = (page - 1) * limit;

      if (true) {
        const user_table = KK_User_Table_Info[userClass].table;
        // const user_attribute = KK_User_Table_Info[userClass].attribute;

        // Pagination Last Number Select
        const count_query = `SELECT COUNT(*) FROM ${user_table} ${
          userClass === "agency" ? `WHERE kk_agency_type != 'admin' ` : ""
        }`;
        const count_data = await fetchUserData(connection_KK, count_query);
        const lastPageNum = Math.ceil(count_data[0]["COUNT(*)"] / limit);
        // console.log(lastPageNum);

        // SQL 쿼리 준비: 최신순으로 유저 데이터 가져오기
        // const select_query = `SELECT * FROM ${user_table} WHERE kk_${userClass}_approve_status = '0' ORDER BY kk_${userClass}_created_at DESC LIMIT ? OFFSET ?`;
        const select_query = `SELECT * FROM ${user_table} ${
          userClass === "agency" ? `WHERE kk_agency_type != 'admin' ` : ""
        }${
          name ? `WHERE kk_${userClass}_name LIKE '%${name}%' ` : ""
        }ORDER BY kk_${userClass}_created_at DESC LIMIT ? OFFSET ?`;

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
  // KK 회원가입 Update - 승인,프로필 이미지, 소개말 등 update
  postSignupDataUpdate: async (req, res) => {
    const { SignUpData } = req.body;
    // console.log(SignUpData);

    let parseSignUpData, parsepUid;
    try {
      // 입력값 파싱
      if (typeof SignUpData === "string") {
        parseSignUpData = JSON.parse(SignUpData);
      } else parseSignUpData = SignUpData;

      const {
        // 강사 회원가입 데이터
        userIdx, // 회원 idx
        // pUid, // uid 공통
        userClass, // teacher || agency
        // passWord, // pwd 공통
        introduce,
        name, // 이름 공통
        phoneNum, // 전화번호 공통
        location, // 강사 수업 가능 지역
        // possDay, // 강사 수업 가능 요일
        // possClass, // 강사 가능 수업
        history, // 강사 경력
        education, // 강사 학력
        fileData, // 첨부파일 공통
        approveStatus, // 승인 상태 공통
        // 기관 회원가입 데이터
        address, // 기관 주소
        typeA, // 기관 타입
      } = parseSignUpData;

      // Input 없을 경우
      if (!userClass) {
        return res
          .status(400)
          .json({ message: "Non Sign Up Input Value - 400 Bad Request" });
      }

      const user_table = KK_User_Table_Info[userClass].table;
      const user_attribute = KK_User_Table_Info[userClass].attribute;

      if (userClass === "teacher") {
        // Public URL을 가져오기 위해 파일 정보를 다시 가져옴
        let uploadFile = "";
        if (fileData) uploadFile = await fileDriveSave(fileData);

        if (!fileData) delete user_attribute.attr6; // fileData를 업데이트하지 않는 경우 목록에서 삭제
        delete user_attribute.pKey;
        delete user_attribute.attr1;
        delete user_attribute.attr2;
        delete user_attribute.attr8;
        delete user_attribute.attr11;
        delete user_attribute.attr13;
        delete user_attribute.attr14;

        const update_query = `UPDATE ${user_table} SET ${Object.values(
          user_attribute
        )
          .map((el) => {
            return `${el} = ?`;
          })
          .join(", ")} WHERE kk_teacher_idx = ?`;
        // console.log(update_query);

        const update_value_obj = {
          attr3: introduce, // 강사 소개글 (관리자)
          attr4: name,
          attr5: phoneNum,
          ...(uploadFile && { attr6: uploadFile.data.webViewLink }), // 강사 프로필 사진 (관리자)
          attr7: location,
          attr9: history,
          attr10: education,
          attr12: approveStatus,
          pKey: userIdx,
        };

        // console.log(update_value_obj);

        if (true) {
          // 계정 생성 (비동기 처리)
          connection_KK.query(
            update_query,
            Object.values(update_value_obj),
            (error, rows, fields) => {
              if (error) {
                console.log(error);
                res.status(400).json({ message: error.sqlMessage });
              } else {
                console.log("Teacher Row DB UPDATE Success!");
                res
                  .status(200)
                  .json({ message: "Teacher SignUp Update Success! - 200 OK" });
              }
            }
          );
        }
      }
      // TODO# 기관 Update
      else {
        // Public URL을 가져오기 위해 파일 정보를 다시 가져옴
        // let uploadFile = "";
        // if (fileData) uploadFile = await fileDriveSave(fileData);

        delete user_attribute.pKey;
        delete user_attribute.attr1;
        delete user_attribute.attr2;
        delete user_attribute.attr7;
        delete user_attribute.attr9;
        delete user_attribute.attr10;

        // const update_query = `UPDATE ${user_table} SET (${Object.values(
        //   user_attribute
        // ).join(", ")}) VALUES (${Object.values(user_attribute)
        //   .map((el) => "?")
        //   .join(", ")})`;

        const update_query = `UPDATE ${user_table} SET ${Object.values(
          user_attribute
        )
          .map((el) => {
            return `${el} = ?`;
          })
          .join(", ")} WHERE kk_agency_idx = ?`;
        // console.log(update_query);

        // INSERT Value 명시
        const update_value_obj = {
          attr3: name,
          attr4: address,
          attr5: phoneNum,
          attr6: typeA,
          attr8: approveStatus,
          pKey: userIdx,
        };
        // console.log(update_value_obj);

        if (true) {
          // 계정 생성 (비동기 처리)
          connection_KK.query(
            update_query,
            Object.values(update_value_obj),
            (error, rows, fields) => {
              if (error) {
                console.log(error);
                res.status(400).json({ message: error.sqlMessage });
              } else {
                console.log("Agency Row DB Update Success!");
                res
                  .status(200)
                  .json({ message: "Agency Update Success! - 200 OK" });
              }
            }
          );
        }
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error - 500 Bad Gateway" });
    }
  },
  // KK 회원가입 DELETE
  deleteReviewDataDelete: (req, res) => {
    console.log("KK 회원 DELETE API 호출");
    // console.log(req.query);
    const { userClass, userIdx } = req.query;

    try {
      const user_table = KK_User_Table_Info[userClass].table;
      // const user_attribute = KK_User_Table_Info[userClass].attribute;

      const delete_query = `DELETE FROM ${user_table} WHERE kk_${userClass}_idx = ?`;

      connection_KK.query(delete_query, [userIdx], (err) => {
        if (err) {
          console.log(err);
          res.status(400).json({ message: err.sqlMessage });
        } else {
          console.log("User DB Delete Success!");
          res.status(200).json({ message: "User DB Delete Success!" });
        }
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
};

const signupController_Regercy = {
  // VR 중복 체크
  dupleCheckHandler: (req, res) => {
    const { id, vrNum, type } = req.body;

    // MySQL DB 연동
    if (type === "id") {
      connection.query(
        `SELECT * FROM teacher WHERE (teacher_uid = '${id}')`,
        (error, rows, fields) => {
          if (error) console.log(error);
          if (rows.length) {
            res.json({ data: "Fail" });
          } else res.json({ data: "Success" });
        }
      );
    } else {
      connection.query(
        `SELECT * FROM teacher WHERE (vr_number = '${vrNum}')`,
        (error, rows, fields) => {
          if (error) console.log(error);
          if (rows.length) {
            res.json({ data: "Fail" });
          } else res.json({ data: "Success" });
        }
      );
    }
  },
  // VR 회원가입
  signupHandler: (req, res) => {
    const { id, pwd, name, age, email, vrNum } = req.body;
    // 서버측 2중 보안
    if (!id || !pwd || !vrNum) res.json({ data: "Fail" });
    // MySQL DB 연동
    connection.query(
      `INSERT INTO teacher VALUES ('${vrNum}', '${id}', '${pwd}')`,
      (error) => {
        if (error) {
          console.log(error);
          res.json({ data: "Fail" });
        } else res.json({ data: "Success" });
      }
    );
  },
};

module.exports = {
  signupController,
};
