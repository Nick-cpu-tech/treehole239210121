const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs'); // 用于检查文件
const app = express();
const port = 3000;

// 1. 强制指定public路径（绝对路径，避免任何歧义）
const publicDir = path.resolve(__dirname, 'public');
console.log('=== 关键路径 ===');
console.log('项目根目录：', __dirname);
console.log('public文件夹绝对路径：', publicDir);
console.log('public是否存在：', fs.existsSync(publicDir));
console.log('index.html是否存在：', fs.existsSync(path.join(publicDir, 'index.html')));

// 2. 基础配置
app.use(express.json());
// 静态资源托管：强制绑定/239210121前缀到public文件夹
app.use('/239210121', express.static(publicDir));

// 3. 数据库初始化（保留核心）
const db = new sqlite3.Database('treehole.db', (err) => {
  if (err) console.error('数据库错误：', err);
  else console.log('数据库连接成功');
});
db.run(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT DEFAULT '匿名用户',
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  time TEXT NOT NULL
)`);

// 4. API接口（保留核心，路径前缀不变）
app.get('/239210121/api/messages', (req, res) => {
  db.all("SELECT * FROM messages", (err, rows) => res.json(rows || []));
});
app.post('/239210121/api/messages', (req, res) => {
  const { nickname, content } = req.body;
  const time = new Date().toLocaleString();
  db.run(`INSERT INTO messages (nickname, content, time) VALUES (?, ?, ?)`, 
  [nickname || '匿名用户', content, time], 
  function(err) {
    if (err) res.status(500).send('发送失败');
    else res.json({ id: this.lastID });
  });
});

// 5. 首页路由：强制返回index.html
app.get('/239210121', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html不存在！请检查public文件夹');
  }
});

// 6. 启动服务
app.listen(port, () => {
  console.log(`✅ 服务启动成功：http://localhost:${port}/239210121`);
});