const express = require('express');
const cors = require('cors');
const app = express();
const sendgrid = require('@sendgrid/mail');
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https');

// CORSミドルウェアの追加
app.use(cors());
app.use(bodyParser.json());

// APIキーの設定
sendgrid.setApiKey('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');

// メールを送信するエンドポイントの設定
app.post('/send-email', async (req, res) => {
    console.log(req.body)
    const { to, subject, text } = req.body;
    const msg = {
    to: to,
    from: {
        name: 'MySchedule',
        email: 'CA01971172@st.kawahara.ac.jp'
    },
    subject: subject,
    text: text
    };
    try {
        await sendgrid.send(msg);
        res.status(200).send('Email sent successfully');
    } catch (error) {
    console.error(error);
    res.status(500).send('Error sending email');
    }
});

// HTTPSの設定
const privateKey = fs.readFileSync('/etc/letsencrypt/live/x-omasa.top/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/x-omasa.top/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/x-omasa.top/chain.pem', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

const httpsServer = https.createServer(credentials, app);

// サーバーの起動
httpsServer.listen(443, () => {
    console.log('Server listening on port 443');
});