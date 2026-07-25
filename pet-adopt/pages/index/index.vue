<!-- pages/index/index.vue -->
<template>
  <view class="post-list">
    <view class="post-card" v-for="post in postList" :key="post.id" @click="goDetail(post)">
      <!-- 用户信息 -->
      <view class="user-info">
        <image :src="getImageUrl(post.avatar)" class="avatar"></image>
        <text class="username">{{post.username}}</text>
      </view>
      
      <!-- 帖子图片（多图横向滚动） -->
      <view class="post-images" v-if="hasImages(post)">
        <scroll-view scroll-x="true" class="image-scroll">
          <image 
            :src="getImageUrl(url)" 
            class="post-img" 
            v-for="(url, idx) in getImageUrls(post.image_urls)" 
            :key="idx"
            mode="aspectFill"
            @error="handleImageError"
            @load="handleImageLoad"
          ></image>
        </scroll-view>
      </view>
      
      <!-- 帖子文字 -->
      <view class="post-content" v-if="post.content">{{post.content}}</view>
      
      <!-- 互动数据 -->
      <view class="post-stats">
        <view class="stat-item" @click.stop="likePost(post.id)">
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
  </view>
</template>

<script>
export default {
  data() {
    return {
      postList: [],
      isLoading: false,
      loadingImages: [],
      // 服务器地址
      serverUrl: 'http://localhost:3000'
    }
  },
  
  onLoad() {
    this.getPostList();
  },
  
  methods: {
    // 检查帖子是否有图片
    hasImages(post) {
      if (!post || !post.image_urls) return false;
      
      const urls = this.getImageUrls(post.image_urls);
      return urls && urls.length > 0;
    },
    
    // 获取有效的图片URL数组
    getImageUrls(imageUrls) {
      if (!imageUrls) return [];
      
      // 如果是字符串，尝试转换为数组
      let urls = imageUrls;
      if (typeof imageUrls === 'string') {
        // 尝试解析JSON
        if (imageUrls.startsWith('[') || imageUrls.startsWith('{')) {
          try {
            urls = JSON.parse(imageUrls);
            // 如果是对象，提取URL
            if (urls && typeof urls === 'object' && !Array.isArray(urls)) {
              urls = Object.values(urls);
            }
          } catch (e) {
            console.log('解析JSON失败，尝试其他格式');
          }
        }
        
        // 如果是逗号分隔的字符串
        if (typeof urls === 'string' && urls.includes(',')) {
          urls = urls.split(',').map(item => item.trim());
        } else if (typeof urls === 'string' && urls.trim() !== '') {
          // 单个URL
          urls = [urls.trim()];
        }
      }
      
      // 确保是数组
      if (!Array.isArray(urls)) {
        return [];
      }
      
      // 过滤空值
      return urls.filter(url => {
        if (!url || typeof url !== 'string') return false;
        
        const trimmed = url.trim();
        // 允许所有有效的图片格式
        return trimmed !== '' && 
               trimmed !== 'null' && 
               trimmed !== 'undefined' && 
               !trimmed.startsWith('undefined');
      });
    },
    
    // 获取完整的图片URL
    getImageUrl(url) {
      if (!url || typeof url !== 'string') {
        return ''; // 返回空字符串让uniapp不显示图片
      }
      
      const trimmedUrl = url.trim();
      
      // 1. 已经是完整URL
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        return trimmedUrl;
      }
      
      // 2. Base64图片
      if (trimmedUrl.startsWith('data:image')) {
        return trimmedUrl;
      }
      
      // 3. 相对路径
      if (trimmedUrl.startsWith('/')) {
        return `${this.serverUrl}${trimmedUrl}`;
      }
      
      // 4. 可能是文件名，拼接到服务器路径
      // 这里假设图片存放在服务器的uploads目录
      return `${this.serverUrl}/uploads/${trimmedUrl}`;
    },
    
    handleImageError(e) {
      console.log('图片加载失败:', e);
    },
    
    handleImageLoad() {
      console.log('图片加载成功');
    },
    
    async getPostList() { 
      if (this.isLoading) return;
      this.isLoading = true;
      
      try {
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: 'http://localhost:3000/api/post/list',
            method: 'GET',
            success: resolve,
            fail: reject
          });
        });

        if (res.statusCode === 200) {
          if (res.data.code === 200) {
            this.postList = res.data.data || [];
          } else {
            this.postList = res.data || [];
          }
          
          // 调试：打印图片信息
          console.log('处理后的帖子数据:');
          this.postList.forEach((post, index) => {
            console.log(`帖子 ${index + 1}:`, {
              id: post.id,
              username: post.username,
              image_urls_raw: post.image_urls,
              image_urls_processed: this.getImageUrls(post.image_urls),
              hasImages: this.hasImages(post)
            });
          });
          
        } else {
          console.error('获取帖子列表失败:', res.data);
          uni.showToast({ title: res.data?.msg || '加载失败', icon: 'none' });
        }
      } catch (err) {
        console.error('连接后端失败:', err);
        uni.showToast({ title: '网络错误', icon: 'none' });
      } finally {
        this.isLoading = false;
      }
    },
    
    goDetail(item) {
      if (!item || item.id === undefined || item.id === null || item.id === '') {
        uni.showToast({ title: '帖子ID异常，无法查看详情', icon: 'none' });
        return;
      }
      
      const postId = String(item.id);
      uni.navigateTo({
        url: `/pages/detail/detail?post_id=${postId}`
      });
    },
    
    likePost(postId) {
      if (!postId) return;
      uni.request({
        url: 'http://localhost:3000/api/post/like',
        method: 'POST',
        data: {
          user_id: 1,
          post_id: postId
        },
        success: (res) => {
          uni.showToast({ title: res.data.msg || '点赞成功', icon: 'none' });
          this.getPostList();
        },
        fail: (err) => {
          console.error('点赞失败:', err);
          uni.showToast({ title: '点赞失败', icon: 'none' });
        }
      });
    }
  }
}
</script>

<style scoped>
.post-list {
  padding: 10px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.post-card {
  margin-bottom: 15px;
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #f0f0f0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.username {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.post-images {
  margin-bottom: 12px;
}

.image-scroll {
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  padding: 5px 0;
}

.image-scroll::-webkit-scrollbar {
  display: none;
}

.post-img {
  width: 200rpx;
  height: 200rpx;
  min-width: 200rpx;
  min-height: 200rpx;
  margin-right: 10px;
  border-radius: 8px;
  background-color: #f8f8f8;
  display: inline-block;
  object-fit: cover;
}

.post-img:last-child {
  margin-right: 0;
}

.post-content {
  font-size: 15px;
  line-height: 1.6;
  margin: 12px 0;
  color: #333;
  word-break: break-word;
}

.post-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.stat-item:active {
  background-color: #f0f0f0;
}
</style>