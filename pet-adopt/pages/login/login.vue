<template>
  <view class="login-container">
    <view class="login-header">
      <text class="title">🐾 欢迎回来 🐾</text>
    </view>
    
    <view class="login-form">
      <view class="form-item">
        <input 
          type="text" 
          v-model="username" 
          placeholder="请输入用户名"
          class="input"
        />
      </view>
      <view class="form-item">
        <input 
          type="password" 
          v-model="password" 
          placeholder="请输入密码"
          class="input"
        />
      </view>
      <button class="login-btn" @click="handleLogin">登录</button>
      <view class="register-link">
        还没有账号？<text @click="goToRegister">立即注册</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      password: ''
    }
  },
methods: {
    async handleLogin() {
      if (!this.username || !this.password) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        });
        return;
      }
//请求后端服务器
      try {
        console.log('开始登录请求...');
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: 'http://localhost:3000/api/user/login',
            method: 'POST',
            header: { 
              'Content-Type': 'application/json'
            },
            data: {
              username: this.username,
              password: this.password
            },
            success: (res) => {
              console.log('请求成功响应：', res);
              resolve(res);
            },
            fail: (err) => {
              console.error('请求失败：', err);
              reject(err);
            }
          });
        });

        console.log('服务器响应：', res);

        if (res.statusCode === 200) {
          if (res.data.code === 200) {
            uni.showToast({
              title: '登录成功',
              icon: 'success'
            });
            
           uni.setStorageSync('currentUser', res.data.data); 
            
            setTimeout(() => {
              uni.switchTab({
                url: '/pages/my/my'
              });
            }, 1500);
          } else {
            uni.showToast({
              title: res.data.msg || '用户名或密码错误',
              icon: 'none'
            });
          }
        } else {
          uni.showToast({
            title: `服务器错误 (${res.statusCode})`,
            icon: 'none'
          });
        }
      } catch (err) {
        console.error('登录请求异常：', err);
        let errorMsg = '网络错误';
        if (err.errMsg) {
          if (err.errMsg.includes('fail')) {
            errorMsg = '无法连接到服务器，请检查服务器是否启动';
          } else if (err.errMsg.includes('timeout')) {
            errorMsg = '请求超时，请检查网络连接';
          }
        }
        uni.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 3000
        });
      }
    },
    goToRegister() {
      uni.switchTab({
        url: '/pages/register/register'
      });
    }
	
}
}
</script>
<style lang="scss">
.login-container {
  padding: 40rpx;
  min-height: 100vh;
  background: linear-gradient(120deg, #f8c8dc 0%, #e0f7fa 100%);

  .login-header {
    text-align: center;
    margin-top: 100rpx;
    margin-bottom: 60rpx;

    .title {
      font-size: 48rpx;
      color: #5d4037;
      font-weight: bold;
    }
  }

  .login-form {
    .form-item {
      margin-bottom: 30rpx;

      .input {
        width: 100%;
        height: 88rpx;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 44rpx;
        padding: 0 30rpx;
        font-size: 28rpx;
      }
    }

    .login-btn {
      width: 100%;
      height: 88rpx;
      background: #ff4d4f;
      color: #fff;
      border-radius: 44rpx;
      line-height: 88rpx;
      font-size: 32rpx;
      margin-top: 40rpx;
    }

    .register-link {
      text-align: center;
      margin-top: 30rpx;
      font-size: 28rpx;
      color: #666;

      text {
        color: #ff4d4f;
        margin-left: 10rpx;
      }
    }
  }
}
</style>