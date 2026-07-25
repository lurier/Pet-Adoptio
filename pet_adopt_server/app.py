import pymysql
import bcrypt
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import uuid  # 生成唯一图片名

# 初始化Flask
app = Flask(__name__)
CORS(app, resources=r'/*')

# ========== 数据库连接配置 ==========
DB_CONFIG = {
    'host': 'localhost',  # 本地数据库（部署后改服务器IP）
    'user': 'root',       # 数据库用户名
    'password': '123456',  # 替换成你的MySQL密码
    'db': 'pet_community',
    'charset': 'utf8mb4',
    'port':3306
}

# 连接数据库函数
def get_db_connection():
    conn = pymysql.connect(**DB_CONFIG)
    conn.autocommit(True)  # 自动提交事务
    return conn

# ========== 图片上传配置 ==========
UPLOAD_FOLDER = 'static/post_images'  # 本地存储图片的文件夹
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# 允许的图片格式
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# 检查图片格式
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ========== 核心接口 ==========
# 1. 发帖接口（含图片上传）
@app.route('/api/post/add', methods=['POST'])
def add_post():
    try:
        # 1. 获取表单数据（文字+用户ID）
        user_id = request.form.get('user_id')
        content = request.form.get('content', '')
        if not user_id:
            return jsonify({'code': 400, 'msg': '用户ID不能为空'})
        
        # 2. 处理图片上传
        image_urls = []
        if 'images' in request.files:
            files = request.files.getlist('images')  # 支持多图上传
            for file in files:
                if file and allowed_file(file.filename):
                    # 生成唯一文件名（避免重复）
                    filename = f"{uuid.uuid4()}.{file.filename.rsplit('.', 1)[1].lower()}"
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(file_path)
                    # 拼接图片访问URL（前端可直接访问）
                    image_url = f"http://192.168.238.62:5000/static/post_images/{filename}"
                    image_urls.append(image_url)
        
        # 3. 插入帖子数据到数据库
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = """
            INSERT INTO post (user_id, content, image_urls) 
            VALUES (%s, %s, %s)
        """
        # 多图URL用逗号分隔存储
        cursor.execute(sql, (user_id, content, ','.join(image_urls)))
        conn.close()
        
        return jsonify({'code': 200, 'msg': '发帖成功', 'data': {'image_urls': image_urls}})
    except Exception as e:
        return jsonify({'code': 500, 'msg': f'发帖失败：{str(e)}'})

# 2. 获取首页帖子列表（小红书式动态流）
@app.route('/api/post/list', methods=['GET'])
def get_post_list():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)  # 返回字典格式
        # 按时间倒序查询（最新帖子在前）
        sql = """
            SELECT p.*, u.username, u.avatar 
            FROM post p 
            LEFT JOIN user u ON p.user_id = u.id 
            ORDER BY p.create_time DESC
        """
        cursor.execute(sql)
        posts = cursor.fetchall()
        conn.close()
        
        # 处理图片URL（转成数组）
        for post in posts:
            if post['image_urls']:
                post['image_urls'] = post['image_urls'].split(',')
            else:
                post['image_urls'] = []
        
        return jsonify({'code': 200, 'msg': '获取成功', 'data': posts})
    except Exception as e:
        return jsonify({'code': 500, 'msg': f'获取失败：{str(e)}'})

# 3. 点赞/取消点赞接口
@app.route('/api/post/like', methods=['POST'])
def like_post():
    try:
        user_id = request.json.get('user_id')
        post_id = request.json.get('post_id')
        if not user_id or not post_id:
            return jsonify({'code': 400, 'msg': '参数不能为空'})
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 检查是否已点赞
        cursor.execute("SELECT id FROM post_like WHERE user_id=%s AND post_id=%s", (user_id, post_id))
        like_record = cursor.fetchone()
        
        if like_record:
            # 已点赞：取消点赞（删除记录+点赞数-1）
            cursor.execute("DELETE FROM post_like WHERE user_id=%s AND post_id=%s", (user_id, post_id))
            cursor.execute("UPDATE post SET like_count=like_count-1 WHERE id=%s", (post_id,))
            msg = '取消点赞成功'
        else:
            # 未点赞：点赞（添加记录+点赞数+1）
            cursor.execute("INSERT INTO post_like (user_id, post_id) VALUES (%s, %s)", (user_id, post_id))
            cursor.execute("UPDATE post SET like_count=like_count+1 WHERE id=%s", (post_id,))
            msg = '点赞成功'
        
        conn.close()
        return jsonify({'code': 200, 'msg': msg})
    except Exception as e:
        return jsonify({'code': 500, 'msg': f'操作失败：{str(e)}'})

# 4. 获取帖子详情（含评论）
@app.route('/api/post/detail/<int:post_id>', methods=['GET'])
def get_post_detail(post_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        # 1. 获取帖子基本信息
        cursor.execute("""
            SELECT p.*, u.username, u.avatar 
            FROM post p 
            LEFT JOIN user u ON p.user_id = u.id 
            WHERE p.id=%s
        """, (post_id,))
        post = cursor.fetchone()
        if not post:
            return jsonify({'code': 404, 'msg': '帖子不存在'})
        
        # 处理图片URL
        post['image_urls'] = post['image_urls'].split(',') if post['image_urls'] else []
        
        # 2. 获取评论列表
        cursor.execute("""
            SELECT c.*, u.username, u.avatar 
            FROM comment c 
            LEFT JOIN user u ON c.user_id = u.id 
            WHERE c.post_id=%s 
            ORDER BY c.create_time DESC
        """, (post_id,))
        comments = cursor.fetchall()
        
        conn.close()
        
        return jsonify({
            'code': 200, 
            'msg': '获取成功', 
            'data': {'post': post, 'comments': comments}
        })
    except Exception as e:
        return jsonify({'code': 500, 'msg': f'获取失败：{str(e)}'})

# 5. 发布评论
@app.route('/api/comment/add', methods=['POST'])
def add_comment():
    try:
        post_id = request.json.get('post_id')
        user_id = request.json.get('user_id')
        content = request.json.get('content')
        if not post_id or not user_id or not content:
            return jsonify({'code': 400, 'msg': '参数不能为空'})
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 插入评论
        cursor.execute("""
            INSERT INTO comment (post_id, user_id, content) 
            VALUES (%s, %s, %s)
        """, (post_id, user_id, content))
        
        # 更新帖子评论数
        cursor.execute("UPDATE post SET comment_count=comment_count+1 WHERE id=%s", (post_id,))
        
        conn.close()
        return jsonify({'code': 200, 'msg': '评论成功'})
    except Exception as e:
        return jsonify({'code': 500, 'msg': f'评论失败：{str(e)}'})

# 启动服务器
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)