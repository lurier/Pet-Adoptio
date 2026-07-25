// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
const port = 3000;
// 配置跨域+解析JSON
app.use(cors());
app.use(express.json());

// 连接你的本地MySQL数据库
const db = mysql.createPool({
  host: 'localhost', // 本地MySQL地址
  user: 'root',      // MySQL账号
  password: '123456',
  database: 'pet_community' // 你的数据库名
});



// 注册接口（和前端参数匹配）
app.get('/api/post/list', async (req, res) => {
  try {
    
    const [rows] = await db.query('SELECT * FROM post'); 
    res.json({
      code: 200,
      msg: '获取宠物列表成功',
      data: rows // 把查询结果返回给前端
    });
  } catch (err) {
    console.error('查询宠物列表失败：', err);
    res.json({ code: 500, msg: '服务器错误', data: [] });
  }
});
app.post('/api/user/register', async (req, res) => {
  try {
    const { username, password, phone } = req.body;
    // 查重
    const [check] = await db.query('SELECT * FROM user WHERE username=? OR phone=?', [username, phone]);
    if (check.length > 0) {
      return res.json({ code: 409, msg: '用户名/手机号已存在' });
    }
    // 插入数据（用你本地的表结构）
    const [insert] = await db.query(
      'INSERT INTO user (username, password, phone, avatar, create_time) VALUES (?, ?, ?, ?, NOW())',
      [username, password, phone, '/static/avatar/default.png']
    );
    res.json({ code: 200, msg: '注册成功', id: insert.insertId });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// 定义 POST /api/user/login 登录接口（结合数据库）
app.post('/api/user/login', async (req, res) => {
  try {
    // 1. 获取前端传的参数
    const { username, password } = req.body;
    
    // 2. 参数校验
    if (!username || !password) {
      return res.json({
        code: 400,
        msg: '用户名和密码不能为空'
      });
    }

    // 3. 连接数据库，查询用户
    // 注意：用?占位符防止SQL注入
    const [rows] = await db.execute(
      'SELECT * FROM `user` WHERE username = ?',
      [username] // 替换占位符的参数
    );

    // 4. 判断用户是否存在
    if (rows.length === 0) {
      return res.json({
        code: 400,
        msg: '用户名不存在'
      });
    }

    // 5. 获取用户信息，验证密码（注意：这里是明文验证，生产环境要加密！）
    const user = rows[0];
    if (user.password !== password) {
      return res.json({
        code: 400,
        msg: '密码错误'
      });
    }

    // 6. 登录成功，返回用户信息（敏感信息如密码不要返回）
    res.json({
      code: 200,
      msg: '登录成功',
      data: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        token: `pet_token_${user.id}_${Date.now()}` // 模拟生成token
      }
    });

  } catch (err) {
    // 捕获数据库错误等异常
    console.error('登录接口异常：', err);
    res.json({
      code: 500,
      msg: '服务器内部错误'
    });
  }
});

// server.js 中新增接口（放在登录接口后面）
app.get('/api/user/info', async (req, res) => {
  try {
    // 从请求中获取用户id（这里简化为直接从query参数传，生产环境用token解析）
    const { userId } = req.query;
    if (!userId) {
      return res.json({ code: 400, msg: '用户ID不能为空' });
    }

    // 查询user表中对应的用户信息
    const [rows] = await db.execute(
      'SELECT id, username, phone FROM `user` WHERE id = ?', // 只返回非敏感信息
      [userId]
    );

    if (rows.length === 0) {
      return res.json({ code: 404, msg: '用户不存在' });
    }

    res.json({
      code: 200,
      msg: '获取用户信息成功',
      data: rows[0] // 返回当前用户的信息
    });
  } catch (err) {
    console.error('获取用户信息异常：', err);
    res.json({ code: 500, msg: '服务器内部错误' });
  }
});

// 1. 新增：获取帖子详情+关联评论（GET /api/post/detail/:post_id）
app.get('/api/post/detail/:post_id', async (req, res) => {
  console.log('===== 开始处理帖子详情请求 =====');
  console.log('请求的post_id：', req.params.post_id); // 打印传入的ID
  try {
    const postId = req.params.post_id;

    // 1. 先验证数据库连接是否可用（临时测试）
    const [testConn] = await db.execute('SELECT 1');
    console.log('数据库连接正常：', testConn);

    // 2. 原查询逻辑
    const [postRows] = await db.execute(
      `SELECT p.*, u.avatar, u.username 
       FROM post p 
       LEFT JOIN user u ON p.user_id = u.id 
       WHERE p.id = ?`,
      [postId]
    );
    console.log('帖子查询结果：', postRows); // 打印查询到的帖子数据

    if (postRows.length === 0) {
      return res.json({ code: 404, msg: '帖子不存在', data: {} });
    }
    const post = postRows[0];
    
    // 容错处理JSON解析
    try {
      post.image_urls = post.image_urls ? JSON.parse(post.image_urls) : [];
    } catch (e) {
      console.warn('image_urls解析失败：', post.image_urls, '错误：', e);
      post.image_urls = [];
    }

    const [commentRows] = await db.execute(
      `SELECT c.*, u.avatar, u.username 
       FROM comment c 
       LEFT JOIN user u ON c.user_id = u.id 
       WHERE c.post_id = ? 
       ORDER BY c.create_time DESC`,
      [postId]
    );
    console.log('评论查询结果：', commentRows); // 打印查询到的评论数据

    res.json({
      code: 200,
      msg: '获取详情成功',
      data: { post, comments: commentRows }
    });
  } catch (err) {
    // 打印完整错误信息（重点！）
    console.error('===== 接口执行失败 =====');
    console.error('错误名称：', err.name);
    console.error('错误信息：', err.message);
    console.error('错误堆栈：', err.stack); // 完整报错轨迹
    res.json({ code: 500, msg: '服务器错误', data: {} });
  }
});
// 2. 新增：帖子点赞（POST /api/post/like）
app.post('/api/post/like', async (req, res) => {
  try {
    const { user_id, post_id } = req.body;
    if (!user_id || !post_id) {
      return res.json({ code: 400, msg: '用户ID和帖子ID不能为空' });
    }

    // 步骤1：判断是否已点赞（防止重复点赞）
    const [likeRows] = await db.execute(
      'SELECT * FROM post_like WHERE user_id = ? AND post_id = ?',
      [user_id, post_id]
    );
    if (likeRows.length > 0) {
      return res.json({ code: 409, msg: '已点赞，无需重复操作' });
    }

    // 步骤2：插入点赞记录到post_like表
    await db.execute(
      'INSERT INTO post_like (user_id, post_id, create_time) VALUES (?, ?, NOW())',
      [user_id, post_id]
    );

    // 步骤3：更新post表的点赞数（+1）
    await db.execute(
      'UPDATE post SET like_count = like_count + 1 WHERE id = ?',
      [post_id]
    );

    res.json({ code: 200, msg: '点赞成功' });
  } catch (err) {
    console.error('点赞失败：', err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// 3. 新增：发布评论（POST /api/comment/add）
app.post('/api/comment/add', async (req, res) => {
  try {
    const { post_id, user_id, content } = req.body;
    if (!post_id || !user_id || !content) {
      return res.json({ code: 400, msg: '帖子ID、用户ID、评论内容不能为空' });
    }

    // 步骤1：插入评论到comment表
    const [insertRes] = await db.execute(
      'INSERT INTO comment (post_id, user_id, content, create_time) VALUES (?, ?, ?, NOW())',
      [post_id, user_id, content]
    );

    // 步骤2：更新post表的评论数（+1）
    await db.execute(
      'UPDATE post SET comment_count = comment_count + 1 WHERE id = ?',
      [post_id]
    );

    res.json({ code: 200, msg: '评论发布成功', data: { commentId: insertRes.insertId } });
  } catch (err) {
    console.error('发布评论失败：', err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// 启动后端服务
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`); // 启动成功的提示
});