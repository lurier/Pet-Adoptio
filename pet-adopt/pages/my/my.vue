<template>
  <view class="my-container">
    <view class="my-header">
      
    </view>
    
    <!-- 用户信息区域 -->
    <view class="user-info">
      <view class="avatar">
        <!-- 占位头像 -->
        <image src="/static/avatar.png" mode="widthFix"></image>
      </view>
      <view class="user-detail">
        <!-- 渲染数据库中的username -->
        <text class="username">{{ userInfo.username || '未登录' }}</text>
		
        <!-- 渲染数据库中的phone -->
        <text class="phone">{{ userInfo.phone ? '已绑定手机号' : '未绑定手机号' }}</text>
      </view>
      <button class="edit-btn" @click="editInfo">编辑</button>
    </view>

    <!-- 功能列表 -->
    <view class="func-list">
      <view class="func-item" @click="toCollect">
        <text>我的收藏</text>
        <text>></text>
      </view>
      <view class="func-item" @click="toAdopt">
        <text>我的领养申请</text>
        <text>></text>
      </view>
      <view class="func-item" @click="toComment">
        <text>我的评论</text>
        <text>></text>
      </view>
      <view class="func-item" @click="toHelp">
        <text>帮助中心</text>
        <text>></text>
      </view>
      <view class="func-item" @click="toAbout">
        <text>关于我们</text>
        <text>></text>
      </view>
    </view>

    <button class="logout-btn" @click="logout">退出登录</button>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userInfo: {} // 存储从数据库获取的用户信息
    };
  },
  onShow() {
    // 每次进入“我的”页面都重新获取用户信息（确保状态最新）
    this.getUserInfo();
  },
  methods: {
   async getUserInfo() {
     const currentUser = uni.getStorageSync('currentUser');
     if (!currentUser || !currentUser.id) {
       this.userInfo = {};
       return;
     }
   
     try {
       const res = await new Promise((resolve, reject) => {
         uni.request({
           url: 'http://localhost:3000/api/user/info',
           method: 'GET',
           data: { userId: currentUser.id },
           success: resolve,
           fail: reject
         });
       });
   
       if (res.statusCode === 200) {
         if (res.data.code === 200) {
           // 新增：打印后端返回的用户信息，看是否有username
           console.log('后端返回的用户信息：', res.data.data); 
           this.userInfo = res.data.data;
         } else {
           uni.showToast({ title: res.data.msg, icon: 'none' });
         }
       } else {
         uni.showToast({ title: `服务器错误(${res.statusCode})`, icon: 'none' });
       }
     } catch (err) {
       console.error('获取用户信息失败：', err);
       uni.showToast({ title: '获取用户信息失败', icon: 'none' });
     }
   },
    logout() {
      // 退出登录：清空本地缓存 + 跳转到登录页
      uni.removeStorageSync('currentUser');
      this.userInfo = {};
      uni.navigateTo({ url: '/pages/login/login' });
    },
    // 其他功能跳转方法（示例）
    toCollect() { /* 跳转到我的收藏 */ },
    toAdopt() { /* 跳转到我的领养申请 */ },
    toComment() { /* 跳转到我的评论 */ },
    toHelp() { /* 跳转到帮助中心 */ },
    toAbout() { /* 跳转到关于我们 */ },
    editInfo() { /* 跳转到编辑资料 */ }
  }
};
</script>

<style scoped>
/* 你的原有样式 */
</style>
<style lang="scss">
/* 沿用可爱风格变量 */
$cute-pink: #f8c8dc;
$cute-yellow: #fffacd;
$cute-blue: #e0f7fa;
$cute-text: #5d4037;
$cute-light: #fff;
$cute-border: #f0e6e6;
/* 我的页面整体容器 */
.my-container {
  padding: 20rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.my-header {
  text-align: center;
  font-size: 36rpx;
  font-weight: bold;
  margin: 30rpx 0;
  color: #333;
}

/* 用户信息区域 - 确保父容器不隐藏 */
.user-info {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #fff;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  /* 防止父容器被意外隐藏 */
  opacity: 1 !important;
  visibility: visible !important;
}

/* 头像容器 - 避免遮挡昵称 */
.avatar {
  width: 120rpx;
  height: 120rpx;
  margin-right: 20rpx;
  flex-shrink: 0; /* 防止头像压缩昵称区域 */
}

.avatar image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

/* 用户详情区域 - 确保能换行显示 */
.user-detail {
  flex: 1; /* 占满剩余空间 */
  display: flex;
  flex-direction: column;
  gap: 10rpx; /* 昵称和手机号之间的间距 */
}

/* 用户名 - 强制可见样式 */
.username {
  font-size: 32rpx !important; /* 加大字体，覆盖所有默认样式 */
  color: #333 !important;      /* 深灰色，避免和背景融合 */
  font-weight: 600;            /* 加粗，更醒目 */
  line-height: 1.5;            /* 行高，防止文字被截断 */
  display: block !important;   /* 块级元素，确保单独一行 */
  /* 临时加背景色，确认位置（测试完可删除） */
  background: #e8f4f8 !important;
  padding: 5rpx 10rpx !important;
}

/* 手机号提示文字 */
.phone {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}

/* 编辑按钮 - 避免遮挡 */
.edit-btn {
  padding: 10rpx 20rpx;
  font-size: 24rpx;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 6rpx;
  margin-left: 10rpx;
  flex-shrink: 0;
}

/* 功能列表 */
.func-list {
  background: #fff;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
}

.func-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1px solid #eee;
  font-size: 28rpx;
  color: #333;
}

.func-item:last-child {
  border-bottom: none;
}

/* 退出登录按钮 */
.logout-btn {
  width: 100%;
  padding: 20rpx;
  background: #ff3b30;
  color: #fff;
  border: none;
  border-radius: 8rpx;
  font-size: 28rpx;
}
</style>