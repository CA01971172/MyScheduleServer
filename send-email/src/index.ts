// firebaseモジュールのインポート
import admin from "firebase-admin";

/* firebaseを使用可能にする */
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


/* sendgridを使用可能にする */
// sendgridモジュールのインポート
import sendgrid from "@sendgrid/mail";

// sendgridの情報が入ったjsonファイルを取得する
const sendgridData = require("./sendgrid/apiKey.json");
const sendgridApiKey: string = sendgridData.apiKey;
const sendgridAdminEmail: string = sendgridData.emailFrom;

// APIキーの設定
sendgrid.setApiKey(sendgridApiKey);



/* 課題管理機能のデータモデル */
export type Task = {
  title: string;
  description: string;
  deadline: number; // 締め切り日時
};

export interface Tasks{
  [id: string]: Task;
}



/* 必要な課題にアラートメールを送信する */
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
async function sendEmail(email: string, taskTitles: string[], daysBeforeDeadline: number){
  console.log(email, taskTitles)
  const subject: string = "課題提出期限が近づいています！ MyScheduleからのお知らせ";
  let text: string = writeMailText(taskTitles, daysBeforeDeadline);
  const msg = {
  to: email,
  from: {
      name: "MySchedule",
      email: sendgridAdminEmail
  },
  subject: subject,
  text: text
  };
  try {
    await sendgrid.send(msg);
  } catch (error) {
    console.error(error);
  }
}

const appLink: string = "https://ca01971172.github.io/MySchedule/dist/";
// メールの本文を作成する
function writeMailText(taskTitles: string[], daysBeforeDeadline: number): string{
  let result: string = "";
  result = `
尊敬するユーザー様、

お世話になっております、MySchedule開発チームです。

ご利用中のMyScheduleにて、提出期限が迫っている課題が存在することをお知らせいたします。
${daysBeforeDeadline}日後が提出期限です。
大切な課題の提出を忘れずに行ってください。

以下に、提出期限が近づいている課題の詳細情報をご案内いたします:

【課題名】:
${joinTaskTitles(taskTitles)}

詳細情報にアクセスするには、MyScheduleへのリンクをクリックしてください:
${appLink}

課題提出期限は、重要な成績評価に影響する場合がございますので、早急に対応を行いましょう。
必要な措置を講じることで、成功への一歩を踏み出すことができます。

もし何かご質問やお困りの点がございましたら、お気軽にご連絡ください。
MyScheduleのサポートチームが全力でサポートさせていただきます。
連絡先はこちら:
${sendgridAdminEmail}

今後も、より便利で効率的な学習管理をサポートできるよう、引き続き努力してまいります。
MyScheduleをご愛用いただき、誠にありがとうございます。

よろしくお願いいたします。

敬具、

MySchedule開発チーム
`;
  return result;
}

function joinTaskTitles(taskTitles: string[]): string {
  let output: string = "";

  for (let i = 0; i < taskTitles.length; i++) {
    const trimmedString = taskTitles[i].trim(); // 空白を取り除く

    if (trimmedString === "") {
      output += "無名の課題";
    } else {
      output += taskTitles[i];
    }

    if (i !== taskTitles.length - 1) {
      output += "\n"; // 最後の要素以外は改行を追加
    }
  }
  return output;
}


// アラートメールを受け取る設定にしているユーザーの、アラートメールが必要な課題に対して、アラートメールを送信する
async function main(): Promise<void>{
  try{
    const emailData: any = await getEmail();
    const uidArray: string[] = await getNeedAlertUser();
    for(const uid of uidArray){
      const taskTitles: string[] = await getNeedAlertTask(uid);
      const email: string = emailData[uid];
      const daysBeforeDeadline: number = await getDaysBeforeDeadline(uid);
      if(taskTitles.length > 0){
        await sendEmail(email, taskTitles, daysBeforeDeadline);
      }
    }
  }catch(e){
    console.error(e);
  }
}



// node-cronモジュールのインポート
import cron  from 'node-cron';

// main()関数の自動実行を行う
console.log("running container", "\n", new Date());
console.log(`${new Date().getFullYear()}/${new Date().getMonth()+1}/${new Date().getDate()} ${new Date().getHours()}:${new Date().getMinutes()}`);
cron.schedule("0 0 12 * * *", () => {
  // 毎日12時に実行
  console.log("running today's task.", "\n", new Date());
  main();
});