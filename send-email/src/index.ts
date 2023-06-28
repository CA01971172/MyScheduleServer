// firebaseモジュールのインポート
import admin from "firebase-admin";

// firebaseの初期化
// 1. サービスアカウント鍵を生成しserviceAccountKey.jsonでリネームしてfirebaseフォルダ直下に配置
const serviceAccount = require("./firebase/serviceAccountKey.json");

// firebaseの情報が入ったjsonファイルを取得する
const firebaseUrl = require("./firebase/firebaseUrl.json");
const databaseURL: string = firebaseUrl.firebaseUrl;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // 2. Realtime DatabaseのページでdatabaseURLを確認して反映
  databaseURL: databaseURL
});

const db = admin.database();
const emailRef = db.ref("emails");
const userRef = db.ref("users");

/* 課題管理機能のデータモデル */
export type Task = {
  title: string;
  description: string;
  deadline: number; // 締め切り日時
};

export interface Tasks{
  [id: string]: Task;
}

// emails下のデータを読み取る
async function getEmail(): Promise<any> {
    let result: any = {};
    try {
      const snapshot = await emailRef.once('value');
      const data = snapshot.val();
      // データの処理
      result = data;
    } catch (error) {
      // エラーハンドリング
      console.error(error);
    }
    return result;
}

// アラートメールの送信をオンにしているユーザーを取得する
async function getNeedAlertUser(): Promise<string[]>{
  const defaultValue: boolean = false;
  let result: string[] = [];
  // メールアドレスが登録されているユーザーのみを切り出す
  const emailData: any = await getEmail();
  try{
    for(const uid in emailData){
      const valueRef = userRef.child(uid).child("task").child("taskSettings").child("enabledAlert");
      const snapshot = await valueRef.once('value');
      let responseData: boolean|null = snapshot.val();
      let enabledAlert: boolean = defaultValue;
      if(responseData !== null){
        enabledAlert = responseData;
      }
      // アラートメールの送信をオンにしているユーザーを切り出す
      if(enabledAlert){
        result.push(uid);
      }
    }
  }catch(e){
    console.error(e);
  }finally{
    return result;
  }
}

// 課題の通知が必要なデータのtitleを切り出す
async function getNeedAlertTask(uid: string): Promise<string[]>{
  const result: string[] = new Array;
  const nowDate: Date = new Date();
  // 何日前に通知するか取得する
  const daysBeforeDeadline: number = await getDaysBeforeDeadline(uid);
  const taskData: Tasks = await getTaskData(uid);
  for(const taskId in taskData){
    const deadline: number = taskData[taskId].deadline; // 課題の締め切り
    const deadlineDate: Date = new Date(deadline); // 課題の締め切りの日付
    const nowDay: number = nowDate.getDate(); // 今日の日付
    // 「n日前に通知する」で設定した、今日からn日前の日付を取得する
    const beforeDate: Date = new Date(nowDate.getTime());
    const beforeDay: number = nowDay + daysBeforeDeadline; // 「n日前に通知する」で設定した、今日からn日前の日付
    beforeDate.setDate(beforeDay);
    // 課題の締め切りの日付が、今日からn日前と一致するかどうか判定する
    const compareBool: boolean = compareDate(deadlineDate, beforeDate);
    if(compareBool){
      const title: string = taskData[taskId].title;
      result.push(title);
    }
  }
  return result;
}

// 何日前に課題のアラートメールを送信するかを取得する
async function getDaysBeforeDeadline(uid: string): Promise<number>{
  const defaultValue: number = 3;
  let result: number = defaultValue;
  const valueRef = userRef.child(uid).child("task").child("taskSettings").child("daysBeforeDeadline");
  const snapshot = await valueRef.once('value');
  const responseData: number|null = snapshot.val();
  if(responseData !== null){
    result = responseData;
  }
  return result;
}

// 課題のデータを取得する
async function getTaskData(uid: string): Promise<Tasks>{
  let result: Tasks = {};
  const tasksRef = userRef.child(uid).child("task").child("tasks");
  const snapshot = await tasksRef.once('value');
  const responseData: Tasks|null = snapshot.val();
  if(responseData !== null){
    result = responseData;
  }
  return result;
}

// Dateの日付のみを比較する
function compareDate(dateA: Date, dateB: Date): boolean{
  let result: boolean = false;
  const yearA: number = dateA.getFullYear();
  const monthA: number = dateA.getMonth();
  const dayA: number = dateA.getDate();
  const yearB: number = dateB.getFullYear();
  const monthB: number = dateB.getMonth();
  const dayB: number = dateB.getDate();
  if((yearA === yearB) && (monthA === monthB) && (dayA === dayB)){
    result = true;
  }
  return result;
}

// ユーザーに課題のアラートメールを送信する関数
function sendEmail(email: string, taskTitles: string[]){
  console.log(email, taskTitles)
}

// アラートメールを受け取る設定にしているユーザーの、アラートメールが必要な課題に対して、アラートメールを送信する
async function main(): Promise<void>{
  const emailData: any = await getEmail();
  const uidArray: string[] = await getNeedAlertUser();
  for(const uid of uidArray){
    const taskTitles: string[] = await getNeedAlertTask(uid);
    const email: string = emailData[uid];
    await sendEmail(email, taskTitles)
  }
}

main();