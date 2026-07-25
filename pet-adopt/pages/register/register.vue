<template>
  <view class="register-container">
    <view class="register-header">
      <text class="title">🐾 加入我们 🐾</text>
    </view>
    
    <view class="register-form">
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
      <view class="form-item">
        <input 
          type="password" 
          v-model="confirmPassword" 
          placeholder="请确认密码"
          class="input"
        />
      </view>
      <view class="form-item">
        <input 
          type="number" 
          v-model="phone" 
          placeholder="请输入手机号"
          class="input"
          @blur="checkPhoneLength"
        />
      </view>
      <button class="register-btn" @click="handleRegister">注册</button>
      <view class="login-link">
        已有账号？<text @click="goToLogin">立即登录</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      password: '',
      confirmPassword: '',
      phone: ''
    }
  },
methods: {
    // 检查手机号长度
    checkPhoneLength() {
      const phoneStr = this.phone.toString().trim();
      if (phoneStr && phoneStr.length !== 11) {
        this.phone = '';
        uni.showToast({ 
          title: '手机号必须为11位数字', 
          icon: 'none',
          duration: 2000
        });
      }
    },
    async handleRegister() {
      // 再次验证手机号长度
      if (this.phone.toString().length !== 11) {
        this.phone = '';
        uni.showToast({ title: '手机号必须为11位数字', icon: 'none' });
        return;
      }
      
      // 表单验证
      if (!this.username || !this.password || !this.confirmPassword || !this.phone) {
        uni.showToast({ title: '请填写完整信息', icon: 'none' });
        return;
      }
      
      if (this.password !== this.confirmPassword) {
        uni.showToast({ title: '两次密码不一致', icon: 'none' });
        return;
      }
    
      try {
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: 'http://localhost:3000/api/user/register',
            method: 'POST',
            header: { 'Content-Type': 'application/json' },
            data: {
              username: this.username,
              password: this.password,
              phone: this.phone
            },
            success: resolve,
            fail: reject
          });
        });
    
        if (res.statusCode === 200) {
          if (res.data.code === 200) {
            // 显示成功提示
            uni.showToast({ 
              title: '注册成功', 
              icon: 'success',
              duration: 1500
            });
            
            // 延迟跳转，让用户看到成功提示
            setTimeout(() => {
              // 使用 switchTab 跳转到 tabBar 页面
              uni.switchTab({ 
                url: '/pages/login/login',
                success: () => {
                  console.log('跳转成功');
                },
                fail: (err) => {
                  console.error('跳转失败：', err);
                  uni.showToast({ 
                    title: '跳转失败，请手动前往登录页', 
                    icon: 'none' 
                  });
                }
              });
            }, 1500);
          } else {
            uni.showToast({ title: res.data.msg, icon: 'none' });
          }
        } else {
          uni.showToast({ title: '后端返回异常', icon: 'none' });
        }
      } catch (err) {
        console.error('请求失败详情：', err);
        uni.showToast({ title: '连接本地后端失败', icon: 'none' });
      }
    }
}
}
</script>


<style scoped>
/* 可爱风格样式 */
.register-container {
  padding: 40rpx;
  background: linear-gradient(135deg, #ffeef8 0%, #ffe0f0 100%);
  min-height: 100vh;
}

.register-header .title {
  font-size: 42rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 60rpx;
  color: #ff6b9d;
  text-shadow: 2px 2px 4px rgba(255, 107, 157, 0.2);
  position: relative;
}

.register-header .title::after {
  content: "✨";
  position: absolute;
  right: -40rpx;
  animation: sparkle 2s infinite;
}

@keyframes sparkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.form-item {
  margin-bottom: 40rpx;
  position: relative;
}

.form-item::before {
  content: "🌸";
  position: absolute;
  left: -30rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24rpx;
}

.input {
  border: 2rpx solid #ffb3d9;
  padding: 25rpx 30rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  font-size: 28rpx;
}

.input:focus {
  border-color: #ff6b9d;
  box-shadow: 0 0 15rpx rgba(255, 107, 157, 0.2);
  transform: translateY(-2rpx);
}

.register-btn {
  background: linear-gradient(135deg, #ff6b9d 0%, #ff9eb5 100%);
  color: white;
  border-radius: 25rpx;
  padding: 25rpx;
  margin-top: 40rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 15rpx rgba(255, 107, 157, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.register-btn::before {
  content: "💕";
  position: absolute;
  left: 30rpx;
  top: 50%;
  transform: translateY(-50%);
}

.register-btn:active {
  transform: scale(0.98);
  box-shadow: 0 5rpx 10rpx rgba(255, 107, 157, 0.3);
}

.login-link {
  text-align: center;
  margin-top: 40rpx;
  font-size: 28rpx;
}

.login-link text {
  color: #ff6b9d;
  font-weight: bold;
  position: relative;
  padding: 0 10rpx;
}

.login-link text::before,
.login-link text::after {
  content: "♡";
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: #ffb3d9;
}

.login-link text::before {
  left: -20rpx;
}

.login-link text::after {
  right: -20rpx;
}

/* 添加输入框图标动画 */
.form-item:hover::before {
  animation: bounce 0.5s ease;
}

@keyframes bounce {
  0%, 100% { transform: translateY(-50%) scale(1); }
  50% { transform: translateY(-50%) scale(1.2); }
}
</style>