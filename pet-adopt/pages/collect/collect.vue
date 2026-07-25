<template>
  <view class="ai-page">
    <!-- 输入框区域 - 固定在顶部 -->
    <view class="input-bar">
      <textarea 
        class="input-area" 
        placeholder="请输入你想咨询的宠物领养问题..."
        v-model="inputMsg"
        confirm-type="send"
        @confirm="sendMsg"
        :disabled="loading"
      ></textarea>
      <button 
        class="send-btn" 
        @click="sendMsg"
        :disabled="!inputMsg.trim() || loading"
      >
        发送
      </button>
    </view>

    <!-- 聊天记录区域 -->
    <scroll-view 
      class="chat-container" 
      scroll-y 
      :scroll-top="scrollTop"
      @scroll="onScroll"
    >
      <!-- 空状态 -->
      <view class="empty-tip" v-if="chatList.length === 0">
        <text class="empty-text">AI小助手随时为你解答宠物领养相关问题～</text>
      </view>

      <!-- 聊天消息列表 -->
      <view class="msg-item" v-for="(item, index) in chatList" :key="index">
        <!-- 用户消息 -->
        <view class="user-msg" v-if="item.role === 'user'">
          <image class="avatar user-avatar" src="/static/user-avatar.png"></image>
          <view class="msg-content user-content">
            <text>{{ item.content }}</text>
          </view>
        </view>

        <!-- AI消息 -->
        <view class="ai-msg" v-else>
          <image class="avatar ai-avatar" src="/static/ai-avatar.png"></image>
          <view class="msg-content ai-content">
            <!-- 加载中状态 -->
            <view class="loading" v-if="item.loading">
              <text class="dot"></text>
              <text class="dot"></text>
              <text class="dot"></text>
            </view>
            <!-- AI回复内容（支持换行） -->
            <text v-else>{{ item.content }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
// 引入接口封装（若已有可复用）
import api from "@/common/api.js";

export default {
  data() {
    return {
      chatList: [], // 聊天记录
      inputMsg: "", // 输入框内容
      loading: false, // AI回复加载状态
      scrollTop: 0, // 滚动条位置（用于自动滚动到底部）
      isScrolling: false // 防止滚动冲突
    };
  },
  onLoad() {
    // 页面加载时添加欢迎语
    this.chatList.push({
      role: "assistant",
      content: "你好呀！我是宠物领养AI小助手，有任何关于宠物领养的问题都可以问我～",
      loading: false
    });
  },
  watch: {
    // 监听聊天列表变化，自动滚动到底部
   chatList(newVal) {
      if (!this.isScrolling && newVal.length > 0) {
        this.$nextTick(() => {
          this.scrollTop = 999999; // 滚动到最底部
        });
      }
    }
  },
  methods: {
    // 滚动事件（避免自动滚动冲突）
    onScroll(e) {
      this.isScrolling = true;
      clearTimeout(this.scrollTimer);
      this.scrollTimer = setTimeout(() => {
        this.isScrolling = false;
      }, 500);
    },

    // 发送消息
    async sendMsg() {
      const msg = this.inputMsg.trim();
      if (!msg || this.loading) return;

      // 1. 添加用户消息到聊天列表
      this.chatList.push({
        role: "user",
        content: msg,
        loading: false
      });
      this.inputMsg = ""; // 清空输入框

      // 2. 添加AI加载状态
      const aiLoadingIndex = this.chatList.length;
      this.chatList.push({
        role: "assistant",
        content: "",
        loading: true
      });
      this.loading = true;

      try {
        // 3. 调用DeepSeek接口获取回复
        const res = await this.getDeepSeekReply(msg);
        // 4. 更新AI消息（替换加载状态）
        this.chatList.splice(aiLoadingIndex, 1, {
          role: "assistant",
          content: res,
          loading: false
        });
      } catch (err) {
        // 5. 异常处理
        this.chatList.splice(aiLoadingIndex, 1, {
          role: "assistant",
          content: "抱歉，我暂时无法回答你的问题，请稍后再试～",
          loading: false
        });
        console.error("AI回复失败：", err);
      } finally {
        this.loading = false; // 关闭加载状态
      }
    },

    // 调用DeepSeek大模型接口（核心逻辑）
    getDeepSeekReply(msg) {
      return new Promise((resolve, reject) => {
        // DeepSeek API配置
        const deepSeekConfig = {
          apiKey: "sk-d13d262c68d645ccb13d4311fe571d03", // 从DeepSeek控制台获取
          model: "deepseek-chat", // 模型名称（可选：deepseek-chat/deepseek-coder等）
          baseUrl: "https://api.deepseek.com/v1/chat/completions" // API地址
        };

        // 发送请求到DeepSeek
        uni.request({
          url: deepSeekConfig.baseUrl,
          method: "POST",
          header: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${deepSeekConfig.apiKey}` // 鉴权
          },
          data: {
            model: deepSeekConfig.model,
            messages: [
              // 系统提示（限定AI角色为宠物领养助手）
              {
                role: "system",
                content: "你是一个专业的宠物领养AI助手，仅回答与宠物领养相关的问题，语气友好、通俗易懂。如果问题无关宠物领养，请礼貌拒绝回答。"
              },
              // 用户当前问题
              { role: "user", content: msg }
            ],
            temperature: 0.7, // 回复随机性（0-1）
            max_tokens: 2000 // 最大回复长度
          },
          success: (res) => {
            if (res.data && res.data.choices && res.data.choices.length > 0) {
              resolve(res.data.choices[0].message.content);
            } else {
              reject("无有效回复");
            }
          },
          fail: (err) => {
            reject(err);
          }
        });
      });
    }
  }
};
</script>

<style scoped>
.ai-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  padding-top: 44px; /* 为导航栏留出空间 */
}

/* 输入框区域 - 固定在顶部 */
.input-bar {
  position: fixed;
  top: 44px; /* 导航栏高度 */
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  z-index: 100;
}

/* 聊天容器 */
.chat-container {
  flex: 1;
  margin-top: 100px; /* 为固定输入框留出空间 */
  padding: 15px 10px;
  box-sizing: border-box;
}

/* 其他样式保持不变... */
.empty-tip {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-text {
  color: #999;
  font-size: 14px;
}

.msg-item {
  display: flex;
  margin-bottom: 15px;
  max-width: 100%;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin: 0 10px;
  flex-shrink: 0;
}
.user-avatar {
  order: 2;
}
.ai-avatar {
  order: 1;
}

.msg-content {
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 18px;
  font-size: 15px;
  line-height: 1.4;
  word-break: break-all;
}
.user-content {
  background-color: #007aff;
  color: #fff;
  order: 1;
}
.ai-content {
  background-color: #fff;
  color: #333;
  border: 1px solid #eee;
  order: 2;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #999;
  margin: 0 2px;
  animation: loading 1s infinite alternate;
}
.dot:nth-child(2) {
  animation-delay: 0.2s;
}
.dot:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes loading {
  from { opacity: 0.3; }
  to { opacity: 1; }
}

.input-area {
  flex: 1;
  height: 80rpx;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 40rpx;
  font-size: 15px;
  resize: none;
  box-sizing: border-box;
}
.send-btn {
  width: 120rpx;
  height: 70rpx;
  line-height: 70rpx;
  background-color: #007aff;
  color: #fff;
  border-radius: 40rpx;
  margin-left: 10px;
  font-size: 14px;
}
.send-btn:disabled {
  background-color: #ccc;
  color: #fff;
}
</style>