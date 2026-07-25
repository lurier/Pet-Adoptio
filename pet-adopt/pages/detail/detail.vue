<!-- pages/detail/detail.vue -->
<template>
  <view class="detail-page">
    <!-- 帖子详情 -->
    <view class="post-detail" v-if="post">
      <!-- 用户信息 -->
      <view class="user-info">
        <image :src="post.avatar" class="avatar"></image>
        <text class="username">{{post.username}}</text>
      </view>
      
      <!-- 帖子图片 -->
      <view class="post-images" v-if="post.image_urls && post.image_urls.length > 0">
        <image :src="url" class="post-img" v-for="(url, idx) in post.image_urls" :key="idx"></image>
      </view>
      
      <!-- 帖子文字 -->
      <view class="post-content">{{post.content}}</view>
      
      <!-- 互动数据 -->
      <view class="post-stats">
        <view class="stat-item" @click="likePost(post.id)">
          <text>❤️ {{post.like_count || 0}}</text>
        </view>
        <view class="stat-item">
          <text>⭐ {{post.collect_count || 0}}</text>
        </view>
        <view class="stat-item">
          <text>💬 {{post.comment_count || 0}}</text>
        </view>
      </view>
    </view>

    <!-- 空状态提示 -->
    <view class="empty-tip" v-else>
      <text>暂无帖子数据，请返回列表页重新选择</text>
    </view>
    
    <!-- 评论区 -->
    <view class="comment-section">
      <text class="comment-title">评论区</text>
      
      <!-- 发布评论 -->
      <view class="comment-input">
        <input v-model="commentContent" placeholder="输入评论..." class="input" :disabled="!post_id" />
        <button @click="addComment" :disabled="!post_id || !commentContent">发布</button>
      </view>
      
      <!-- 评论列表 -->
      <view class="comment-list" v-if="comments.length > 0">
        <view class="comment-item" v-for="comment in comments" :key="comment.id">
          <image :src="comment.avatar" class="comment-avatar"></image>
          <view class="comment-content">
            <text class="comment-username">{{comment.username}}</text>
            <text class="comment-text">{{comment.content}}</text>
            <text class="comment-time">{{comment.create_time}}</text>
          </view>
        </view>
      </view>
      <!-- 评论空状态 -->
      <view class="empty-comment" v-else>
        <text>暂无评论，快来抢沙发~</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      post_id: '',
      post: null,
      comments: [],
      commentContent: '',
      user_id: 1  // 登录后获取真实用户ID
    }
  },
  onLoad(options) {
    // 1. 打印完整的options参数，定位列表页传参问题（核心调试）
    console.log('详情页接收的所有参数：', options);
    // 2. 兼容不同参数名（post_id / id / postId），避免传参名写错
    this.post_id = options.post_id || options.id || options.postId || '';
    console.log('最终使用的post_id：', this.post_id);

    // 3. 参数校验：无有效post_id时提示并返回列表页
    if (!this.post_id) {
      uni.showToast({ 
        title: '未获取到帖子ID，请返回列表页重新选择', 
        icon: 'none',
        duration: 2000
      });
      // 2秒后自动返回上一页
      setTimeout(() => {
        uni.navigateBack({ delta: 1 });
      }, 2000);
      return;
    }

    // 4. 有有效ID时才请求数据
    this.getPostDetail();
  },
  methods: {
    // 获取帖子详情+评论（增强容错）
    getPostDetail() {
      // 显示加载中提示
      uni.showLoading({ title: '加载中...' });
      
      uni.request({
        url: `http://localhost:3000/api/post/detail/${this.post_id}`,
        method: 'GET',
        success: (res) => {
          console.log('帖子详情接口返回：', res.data); // 打印接口返回数据
          if (res.data.code === 200) {
            this.post = res.data.data.post;
            this.comments = res.data.data.comments || [];
            // 容错：确保image_urls是数组（避免数据库格式错误）
            if (this.post && !Array.isArray(this.post.image_urls)) {
              this.post.image_urls = [];
            }
          } else {
            uni.showToast({ title: res.data.msg || '获取帖子失败', icon: 'none' });
          }
        },
        fail: (err) => {
          console.error('请求帖子详情失败：', err);
          uni.showToast({ title: '网络错误，请重试', icon: 'none' });
        },
        complete: () => {
          uni.hideLoading(); // 无论成功失败，都隐藏加载中
        }
      })
    },
    // 点赞（增强容错）
    likePost(post_id) {
      if (!post_id) {
        uni.showToast({ title: '帖子ID异常，无法点赞', icon: 'none' });
        return;
      }
      
      uni.request({
        url: 'http://localhost:3000/api/post/like',
        method: 'POST',
        data: {
          user_id: this.user_id,
          post_id: post_id
        },
        success: (res) => {
          uni.showToast({ title: res.data.msg, icon: 'none' });
          if (res.data.code === 200) {
            this.getPostDetail(); // 仅点赞成功时刷新数据
          }
        },
        fail: (err) => {
          console.error('点赞请求失败：', err);
          uni.showToast({ title: '点赞失败，请重试', icon: 'none' });
        }
      })
    },
    // 发布评论（增强容错）
    addComment() {
      // 双重校验：避免空评论/无帖子ID
      if (!this.commentContent.trim()) {
        uni.showToast({ title: '评论不能为空', icon: 'none' });
        return;
      }
      if (!this.post_id) {
        uni.showToast({ title: '帖子ID异常，无法发布评论', icon: 'none' });
        return;
      }
      
      uni.request({
        url: 'http://localhost:3000/api/comment/add',
        method: 'POST',
        data: {
          post_id: this.post_id,
          user_id: this.user_id,
          content: this.commentContent.trim() // 去除首尾空格
        },
        success: (res) => {
          uni.showToast({ title: res.data.msg, icon: 'none' });
          if (res.data.code === 200) {
            this.commentContent = '';  // 仅发布成功时清空输入框
            this.getPostDetail();  // 刷新评论
          }
        },
        fail: (err) => {
          console.error('发布评论失败：', err);
          uni.showToast({ title: '发布失败，请重试', icon: 'none' });
        }
      })
    }
  }
}
</script>

<style scoped>
/* 基础样式补充（可选，提升体验） */
.detail-page {
  padding: 10px;
  background-color: #f5f5f5;
  min-height: 100vh;
}
.post-detail {
  background: #fff;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
}
.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
}
.username {
  font-weight: bold;
  font-size: 16px;
}
.post-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 10px 0;
}
.post-img {
  width: 100px;
  height: 100px;
  border-radius: 4px;
}
.post-content {
  font-size: 15px;
  line-height: 1.6;
  margin: 10px 0;
}
.post-stats {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}
.stat-item {
  font-size: 14px;
  color: #666;
}
.comment-section {
  background: #fff;
  padding: 15px;
  border-radius: 8px;
}
.comment-title {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 10px;
  display: block;
}
.comment-input {
  display: flex;
  gap: 10px;
  margin: 10px 0;
}
.input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #eee;
  border-radius: 4px;
}
.comment-list {
  margin-top: 15px;
}
.comment-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}
.comment-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
}
.comment-username {
  font-weight: bold;
  font-size: 14px;
  display: block;
  margin-bottom: 4px;
}
.comment-text {
  font-size: 14px;
  line-height: 1.5;
  display: block;
  margin-bottom: 4px;
}
.comment-time {
  font-size: 12px;
  color: #999;
}
/* 空状态样式 */
.empty-tip, .empty-comment {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}
</style>