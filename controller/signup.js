// stream 데이터 처리
const stream = require("stream");

// MySQL 접근
const mysql = require("mysql");
const {
  // dbconfig_ai,
  dbconfig_kk,
} = require("../DB/database");

// 키클 DB 연결
const connection_KK = mysql.createConnection(dbconfig_kk);
connection_KK.connect();
// AI DB 연결
// const connection_AI = mysql.createConnection(dbconfig_ai);
// connection_AI.connect();

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

// Cloudinary 설정
const { v2: cloudinary } = require("cloudinary");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Database Table Info
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

// const user_kk_select = async (user_table, user_attribute, parsepUid) => {
//   const select_query = `SELECT * FROM ${user_table} WHERE ${user_attribute.attr1}='${parsepUid}'`;
//   const select_data = await fetchUserData(connection_KK, select_query);

//   return select_data;
// };

const fileDriveSave = async (fileData) => {
  try {
    // 첨부파일 Google Drive 저장
    // const { fileName, fileType, baseData } = fileData;
    // const [_, zipBase64] = baseData.split(",");
    // const bufferStream = new stream.PassThrough();
    // bufferStream.end(Buffer.from(zipBase64, "base64"));

    const { fileName, fileType, baseData } = fileData;
    const [_, zipBase64] = baseData.split(",");
    const buffer = Buffer.from(zipBase64, "base64");
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

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
    // await drive.permissions.create({
    //   fileId: file.data.id,
    //   requestBody: {
    //     role: "writer",
    //     type: "user",
    //     emailAddress: "soyesnjy@gmail.com",
    //   },
    //   // transferOwnership: true, // role:'owner' 일 경우
    // });

    // Public URL을 가져오기 위해 파일 정보를 다시 가져옴
    const uploadFile = await drive.files.get({
      fileId: file.data.id,
      fields: "id, webViewLink, webContentLink",
    });

    return uploadFile;
  } catch (err) {
    console.log(err);
    return;
  }
};

const fileCloudinarySave = async (fileData, oldPublicId) => {
  try {
    const { fileName, fileType, baseData } = fileData;
    const [_, zipBase64] = baseData.split(",");
    const buffer = Buffer.from(zipBase64, "base64");
    // console.log(oldPublicId);
    // 기존 이미지 삭제
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId, {
          resource_type: "image",
        });
        console.log(`기존 이미지 삭제됨: ${oldPublicId}`);
      } catch (deleteErr) {
        console.error(
          `기존 이미지 삭제 실패: ${oldPublicId}`,
          deleteErr.message
        );
      }
    }

    // 새 이미지 업로드
    const cloudinaryUpload = await new Promise((resolve, reject) => {
      const cloudinaryStream = cloudinary.uploader.upload_stream(
        {
          folder: "kikleEdu-teacher-profiles",
          public_id: fileName.split(".")[0],
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.Readable.from(buffer).pipe(cloudinaryStream);
    });

    return cloudinaryUpload.secure_url;
  } catch (err) {
    console.log("Cloudinary 업로드 실패:", err);
    return;
  }
};

const extractPublicId = (secureUrl) => {
  const match = secureUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
  return match ? match[1] : null; // 예: folder/file-name
};

// Cloudinary 업로드 후 DB 업데이트를 위한 마이그레이션 메서드
async function migrateGoogleDriveToCloudinary() {
  try {
    // Google Drive URL 형태로 저장된 이미지만 선택
    const querySelect = `
      SELECT kk_teacher_idx, kk_teacher_profileImg_path
      FROM kk_teacher
      WHERE kk_teacher_profileImg_path LIKE ?
    `;
    const likePattern = "https://drive.google.com/uc?export=view&id=%";

    connection_KK.query(querySelect, [likePattern], async (err, results) => {
      if (err) {
        console.error("DB select error:", err);
        return;
      }
      for (const row of results) {
        const teacherId = row.kk_teacher_idx;
        const googleUrl = row.kk_teacher_profileImg_path;

        try {
          // Cloudinary에 외부 URL 업로드
          const result = await cloudinary.uploader.upload(googleUrl, {
            folder: "kikleEdu-teacher-profiles", // 원하는 폴더명
            public_id: `teacher_${teacherId}`, // 고유한 이름 부여 (확장자 자동 처리)
            resource_type: "image",
          });
          const newUrl = result.secure_url;
          console.log(`Teacher ${teacherId}: Cloudinary URL = ${newUrl}`);

          // DB 업데이트: kk_teacher_profileImg_path 값을 Cloudinary URL로 변경
          const queryUpdate = `
            UPDATE kk_teacher
            SET kk_teacher_profileImg_path = ?
            WHERE kk_teacher_idx = ?
          `;
          connection_KK.query(
            queryUpdate,
            [newUrl, teacherId],
            (updateErr, updateResult) => {
              if (updateErr) {
                console.error(
                  `DB update error for teacher ${teacherId}:`,
                  updateErr
                );
              } else {
                console.log(`Teacher ${teacherId} updated successfully.`);
              }
            }
          );
        } catch (uploadError) {
          console.error(
            `Cloudinary upload error for teacher ${teacherId}:`,
            uploadError
          );
        }
      }
    });
  } catch (error) {
    console.error("Migration error:", error);
  }
}
// 실행
// migrateGoogleDriveToCloudinary();

// 희망 요일 정렬 메서드
const sortDays = (arr) => {
  const dayOrder = ["월", "화", "수", "목", "금", "토", "일"];

  // 요일별로 인덱스를 매핑
  const dayIndex = dayOrder.reduce((acc, day, index) => {
    acc[day] = index;
    return acc;
  }, {});

  // 정렬 수행
  return arr.sort((a, b) => dayIndex[a] - dayIndex[b]).join("/");
};
// 희망 시간 정렬 메서드
const sortTimes = (arr) => {
  const dayOrder = ["오전", "오후", "야간"];

  // 요일별로 인덱스를 매핑
  const dayIndex = dayOrder.reduce((acc, day, index) => {
    acc[day] = index;
    return acc;
  }, {});

  // 정렬 수행
  return arr.sort((a, b) => dayIndex[a] - dayIndex[b]).join("/");
};

// JWT 관련
const { verify } = require("jsonwebtoken");
// JWT 검증
const verifyToken = (type, token) => {
  let secretKey, decoded;
  // access, refresh에 따라 비밀키 선택
  switch (type) {
    case "access":
      secretKey = process.env.ACCESS_SECRET;
      break;
    case "refresh":
      secretKey = process.env.REFRESH_SECRET;
      break;
    default:
      return null;
  }

  try {
    // 토큰을 비밀키로 복호화
    decoded = verify(token, secretKey);
  } catch (err) {
    console.log(`JWT Error: ${err.message}`);
    return null;
  }
  return decoded;
};

const signupController = {
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
        introduce, // 강사 소개글
        career, // 강사 경력
        education, // 강사 학력
        fileData, // 첨부파일 공통
        // 기관 회원가입 데이터
        address, // 기관 주소
        typeA, // 기관 타입
      } = parseSignUpData;

      // Input 없을 경우
      if (!pUid || !passWord) {
        return res
          .status(400)
          .json({ message: "Non Sign Up Input Value - 400 Bad Request" });
      }

      // Input 없을 경우
      if (userClass === "teacher" && !fileData) {
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

      // 1. SELECT TEST (row가 있는지 없는지 검사)
      const select_query = `SELECT * FROM ${
        userClass === "teacher" ? "kk_teacher" : "kk_agency"
      } WHERE kk_${userClass}_uid ='${pUid}'`;
      const user_data = await fetchUserData(connection_KK, select_query);

      // 2. DUPLICATE USER (row 중복검사)
      if (user_data[0]) {
        // 같은 uid의 User가 이미 존재하는 경우
        console.log(`${userClass} Table has Duplicated User - pUid:${pUid}`);
        return res.status(403).json({ message: "중복된 이메일입니다!" });
      }
      // 3. INSERT USER (row가 없는 경우). 중복 검사 통과
      else {
        // 강사 회원가입
        if (userClass === "teacher") {
          // Public URL을 가져오기 위해 파일 정보를 다시 가져옴
          const uploadFile = await fileDriveSave(fileData);
          if (!uploadFile) {
            console.log(`SignUp File Drive Upload Fail - pUid:${pUid}`);
            return res.status(400).json({
              message: "드라이브 파일 업로드 실패",
            });
          }
          // 2024.08.30: import 에러로 인한 String 처리
          const insert_query = `INSERT INTO kk_teacher (
          kk_teacher_uid,
          kk_teacher_pwd,
          kk_teacher_introduction,
          kk_teacher_name,
          kk_teacher_phoneNum,
          kk_teacher_profileImg_path,
          kk_teacher_location,
          kk_teacher_dayofweek,
          kk_teacher_history,
          kk_teacher_education,
          kk_teacher_time,
          kk_teacher_file_path,
          kk_teacher_approve_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          // console.log(insert_query);

          // INSERT Value 명시
          const insert_value_obj = {
            attr1: pUid,
            attr2: passWord,
            attr3: introduce, // 강사 소개글 (관리자)
            attr4: name,
            attr5: phoneNumber,
            attr6: "", // 강사 프로필 사진 (관리자)
            attr7: possLocal,
            attr8: sortDays(possDay),
            attr9: career,
            attr10: education,
            attr11: sortTimes(possTime), // 강사 희망 시간대
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
                console.log(`Teacher Table Insert Error - pUid:${pUid}`);
                console.log(error);
                return res
                  .status(400)
                  .json({ message: "강사 테이블 삽입 에러" });
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
                    console.log(
                      `Teacher_Class Table Insert Error - pUid:${pUid}`
                    );
                    console.log(error);
                    return res
                      .status(400)
                      .json({ message: `강사_수업 테이블 삽입 에러` });
                  } else {
                    console.log(
                      `Teacher Row DB INSERT Success! - pUid:${pUid}`
                    );
                    return res
                      .status(200)
                      .json({ message: "강사 회원가입 성공!" });
                  }
                });
              }
            }
          );
        }
        // 기관 회원가입
        else {
          // Public URL을 가져오기 위해 파일 정보를 다시 가져옴
          const uploadFile = fileData ? await fileDriveSave(fileData) : "";

          // 2024.08.30: import 에러로 인한 String 처리
          const insert_query = `INSERT INTO kk_agency
          (kk_agency_uid,
          kk_agency_pwd,
          kk_agency_name,
          kk_agency_address,
          kk_agency_phoneNum,
          kk_agency_type,
          kk_agency_file_path,
          kk_agency_approve_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
          // console.log(insert_query);

          // INSERT Value 명시
          const insert_value_obj = {
            attr1: pUid,
            attr2: passWord,
            attr3: name,
            attr4: address,
            attr5: phoneNumber,
            attr6: typeA,
            attr7: uploadFile ? uploadFile.data.webContentLink : "",
            attr8: 1,
          };
          // console.log(insert_value_obj);

          // 계정 생성 (비동기 처리)
          connection_KK.query(
            insert_query,
            Object.values(insert_value_obj),
            (error, rows, fields) => {
              if (error) {
                console.log(`Agency Table Insert Error - pUid:${pUid}`);
                console.log(error);
                return res
                  .status(400)
                  .json({ message: "기관 테이블 삽입 에러" });
              } else {
                console.log(`Agency Row DB INSERT Success! - pUid:${pUid}`);
                return res.status(200).json({ message: "기관 회원가입 성공!" });
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
      const limit = 10; // 한 페이지에 보여줄 리뷰의 수
      const offset = (page - 1) * limit;

      const user_table = KK_User_Table_Info[userClass].table;
      // const user_attribute = KK_User_Table_Info[userClass].attribute;

      // Pagination Last Number Select
      const count_query = `SELECT COUNT(*) FROM ${user_table} ${
        userClass === "agency" ? `WHERE kk_agency_type != 'admin' ` : ""
      }`;

      // const count_data = await fetchUserData(connection_KK, count_query);
      // const lastPageNum = Math.ceil(count_data[0]["COUNT(*)"] / limit);
      // console.log(lastPageNum);

      // SQL 쿼리 준비: 최신순으로 유저 데이터 가져오기 + total_count (Table Row Count 반환) SubQuery 추가
      const select_query = `SELECT *,
         (${count_query}) AS total_count
      FROM ${user_table}
      ${userClass === "agency" ? `WHERE kk_agency_type != 'admin' ` : ""}
      ${name ? `WHERE kk_${userClass}_name LIKE '%${name}%' ` : ""}
      ORDER BY kk_${userClass}_created_at DESC LIMIT ? OFFSET ?`;

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
        const total_count = data.length > 0 ? data[0].total_count : 0;
        const lastPageNum = Math.ceil(total_count / limit);
        // console.log(total_count);
        // 결과 반환
        return res.status(200).json({
          message: "User SignUp Request READ Success! - 200",
          page,
          limit,
          lastPageNum,
          data: data,
        });
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
  // KK 회원가입 Update - 승인,프로필 이미지, 소개말 등 update
  postSignupDataUpdate: async (req, res) => {
    const { SignUpData } = req.body;
    // console.log(SignUpData);

    let parseSignUpData,
      oldPublicId = null;
    try {
      // 입력값 파싱
      if (typeof SignUpData === "string") {
        parseSignUpData = JSON.parse(SignUpData);
      } else parseSignUpData = SignUpData;
      // console.log(parseSignUpData);

      const {
        // 강사 회원가입 데이터
        userIdx, // 회원 idx
        userClass, // teacher || agency
        // pUid, // uid 공통
        // passWord, // pwd 공통
        introduce,
        name, // 이름 공통
        phoneNum, // 전화번호 공통
        location, // 강사 수업 가능 지역

        possDay, // 강사 수업 가능 요일
        possClass, // 강사 가능 수업
        possTimes, // 강사 가능 시간대

        history, // 강사 경력
        education, // 강사 학력
        fileData, // 첨부파일 공통
        approveStatus, // 승인 상태 공통
        // 기관 회원가입 데이터
        address, // 기관 주소
        typeA, // 기관 타입
      } = parseSignUpData;

      // Required Input 없을 경우
      if (!userClass) {
        return res
          .status(400)
          .json({ message: "Non Sign Up Input Value - 400 Bad Request" });
      }

      const user_table = KK_User_Table_Info[userClass].table;
      // const user_attribute = KK_User_Table_Info[userClass].attribute;

      // 강사
      if (userClass === "teacher") {
        // 프로필 이미지가 있는지 조회
        const query = `SELECT kk_teacher_profileImg_path FROM ${user_table} WHERE kk_teacher_idx = ?`;
        const result = await queryAsync(connection_KK, query, [userIdx]);
        const userRow = result?.[0]; // 한 줄만 추출
        const existingUrl = userRow?.kk_teacher_profileImg_path;

        if (existingUrl?.includes("res.cloudinary.com")) {
          oldPublicId = extractPublicId(existingUrl);
        }

        // Public URL을 가져오기 위해 파일 정보를 다시 가져옴
        let uploadImageUrl = "";
        if (fileData)
          uploadImageUrl = await fileCloudinarySave(fileData, oldPublicId);

        const update_query = `UPDATE ${user_table} SET
        kk_teacher_introduction = ?,
        kk_teacher_name = ?,
        kk_teacher_phoneNum = ?,
        ${fileData ? "kk_teacher_profileImg_path = ?," : ""}
        kk_teacher_location = ?,
        ${possDay ? "kk_teacher_dayofweek = ?," : ""}
        kk_teacher_history = ?,
        kk_teacher_education = ?,
        ${possTimes ? "kk_teacher_time = ?," : ""}
        kk_teacher_approve_status = ?
        WHERE kk_teacher_idx = ?`;

        // console.log(update_query);

        const update_value_obj = {
          attr3: introduce, // 강사 소개글 (관리자)
          attr4: name,
          attr5: phoneNum,
          ...(uploadImageUrl && {
            attr6: uploadImageUrl,
          }), // 강사 프로필 사진 (관리자)
          attr7: location,
          ...(possDay && {
            attr8: sortDays(possDay),
          }), // 강사 시간대
          attr9: history,
          attr10: education,
          ...(possTimes && {
            attr11: sortTimes(possTimes),
          }), // 강사 요일
          attr12: approveStatus,
          pKey: userIdx,
        };

        // console.log(update_value_obj);

        connection_KK.query(
          update_query,
          Object.values(update_value_obj),
          (error, rows, fields) => {
            // 강사 정보 수정 실패
            if (error) {
              console.log(`Teacher Table Row Update Fail! - userIdx:${userIdx}
                error: ${error}`);
              return res.status(400).json({ message: error.sqlMessage });
            }
            // 수업 변경일 경우 (기존 수업 삭제 -> 갱신된 수업 삽입)
            else if (possClass) {
              const table = KK_User_Table_Info["teacher_class"].table;
              // const teacher_id = rows.insertId; // 삽입한 강사의 pKey

              // 기존 수업 삭제 (Delete kk_teacher_class)
              const delete_query = `DELETE FROM kk_teacher_class WHERE kk_teacher_idx = ${userIdx};`;
              connection_KK.query(delete_query, null, (err) => {
                // 기존 수업 삭제 실패
                if (error) {
                  console.log(`Teacher_Class Table Row Delete Fail! - userIdx:${userIdx}
                    error: ${error}`);
                  return res.status(400).json({ message: error.sqlMessage });
                } else {
                  // 갱신된 수업 삽입 (Insert kk_teacher_class)
                  const insert_query = `INSERT INTO ${table} (kk_teacher_idx, kk_class_idx) VALUES ${possClass
                    .map((el) => {
                      return `(${userIdx}, ${el})`;
                    })
                    .join(", ")}`;

                  connection_KK.query(insert_query, null, (err) => {
                    // 갱신된 수업 삽입 실패
                    if (error) {
                      console.log(`Teacher_Class Table Row Insert Fail! - userIdx:${userIdx}
                        error: ${error}`);
                      return res
                        .status(400)
                        .json({ message: error.sqlMessage });
                    } else {
                      console.log(
                        `Teacher Row DB UPDATE Success! - userIdx:${userIdx}`
                      );
                      return res.status(200).json({
                        message: "Teacher SignUp Update Success! - 200 OK",
                      });
                    }
                  });
                }
              });
            } else {
              console.log(
                `Teacher Row DB UPDATE Success! - userIdx:${userIdx}`
              );
              return res
                .status(200)
                .json({ message: "Teacher SignUp Update Success! - 200 OK" });
            }
          }
        );
      }
      // 기관
      else {
        // Public URL을 가져오기 위해 파일 정보를 다시 가져옴
        // let uploadFile = "";
        // if (fileData) uploadFile = await fileDriveSave(fileData);

        const update_query = `UPDATE ${user_table} SET
        kk_agency_name = ?,
        kk_agency_address = ?,
        kk_agency_phoneNum = ?,
        kk_agency_type = ?,
        kk_agency_approve_status = ?
        WHERE kk_agency_idx = ?`;
        // console.log(update_query);

        const update_value_obj = {
          attr3: name,
          attr4: address,
          attr5: phoneNum,
          attr6: typeA,
          attr8: approveStatus,
          pKey: userIdx,
        };
        // console.log(update_value_obj);

        connection_KK.query(
          update_query,
          Object.values(update_value_obj),
          (error, rows, fields) => {
            if (error) {
              console.log(`Agency Table Row Update Fail! - userIdx:${userIdx}
                error: ${error}`);
              return res.status(400).json({ message: error.sqlMessage });
            } else {
              console.log(`Agency Row DB Update Success! - userIdx:${userIdx}`);
              return res
                .status(200)
                .json({ message: "Agency Update Success! - 200 OK" });
            }
          }
        );
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error - 500 Bad Gateway" });
    }
  },
  // KK 회원가입 DELETE
  deleteReviewDataDelete: (req, res) => {
    // console.log("KK 회원 DELETE API 호출");
    // console.log(req.query);
    const refreshToken = req.cookies.refreshToken;
    const { userClass, userIdx } = req.query;

    try {
      const decoded = verifyToken("refresh", refreshToken);

      // userIdx가 토큰 idx와 다를 경우 (admin은 프리패스)
      if (decoded.type !== "admin" && Number(userIdx) !== decoded.idx) {
        console.log(
          `회원 고유 번호가 토큰의 회원 번호와 일치하지 않습니다. - pUid:${decoded.id}`
        );
        return res.status(400).json({
          message: "회원 고유 번호가 토큰의 회원 번호와 일치하지 않습니다.",
        });
      }

      const user_table = KK_User_Table_Info[userClass].table;
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

// const signupController_Regercy = {
//   // VR 중복 체크
//   dupleCheckHandler: (req, res) => {
//     const { id, vrNum, type } = req.body;

//     // MySQL DB 연동
//     if (type === "id") {
//       connection.query(
//         `SELECT * FROM teacher WHERE (teacher_uid = '${id}')`,
//         (error, rows, fields) => {
//           if (error) console.log(error);
//           if (rows.length) {
//             res.json({ data: "Fail" });
//           } else res.json({ data: "Success" });
//         }
//       );
//     } else {
//       connection.query(
//         `SELECT * FROM teacher WHERE (vr_number = '${vrNum}')`,
//         (error, rows, fields) => {
//           if (error) console.log(error);
//           if (rows.length) {
//             res.json({ data: "Fail" });
//           } else res.json({ data: "Success" });
//         }
//       );
//     }
//   },
//   // VR 회원가입
//   signupHandler: (req, res) => {
//     const { id, pwd, name, age, email, vrNum } = req.body;
//     // 서버측 2중 보안
//     if (!id || !pwd || !vrNum) res.json({ data: "Fail" });
//     // MySQL DB 연동
//     connection.query(
//       `INSERT INTO teacher VALUES ('${vrNum}', '${id}', '${pwd}')`,
//       (error) => {
//         if (error) {
//           console.log(error);
//           res.json({ data: "Fail" });
//         } else res.json({ data: "Success" });
//       }
//     );
//   },
// };

module.exports = {
  signupController,
};
