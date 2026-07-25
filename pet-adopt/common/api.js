// common/api.js
// 后端接口基础地址（替换成你的后端实际地址，本地测试用localhost）
const baseUrl = "http://localhost:3000"; 

/**
 * 封装uni.request请求
 * @param {String} url 接口路径（拼接在baseUrl后）
 * @param {String} method 请求方法 GET/POST/PUT/DELETE
 * @param {Object} data 请求参数
 * @param {Boolean} isToken 是否需要携带token（默认true）
 * @returns {Promise}
 */
const request = (url, method = "GET", data = {}, isToken = true) => {
  return new Promise((resolve, reject) => {
    // 1. 获取本地存储的用户信息（登录态）
    const userInfo = uni.getStorageSync("userInfo") || {};
    const token = userInfo.token || "";
    const userId = userInfo.userId || "";

    // 2. 构造请求头
    const header = {
      "Content-Type": "application/json;charset=UTF-8",
    };
    // 需要token时，添加到请求头
    if (isToken) {
      header["Authorization"] = token ? `Bearer ${token}` : "";
      // 兼容无token场景，手动携带userId（如果后端需要）
      if (userId) {
        data.userId = userId;
      }
    }

    // 3. 发起请求
    uni.request({
      url: baseUrl + url,
      method: method,
      data: data,
      header: header,
      timeout: 10000, // 超时时间10秒
      success: (res) => {
        // 后端统一返回格式：{code:200, msg:"成功", data:{}}
        const { code, msg, data } = res.data;
        if (code === 200) {
          resolve(data); // 成功：返回接口数据
        } else if (code === 401) {
          // 未登录/Token过期：跳转到登录页
          uni.showToast({ title: "请先登录", icon: "none" });
          uni.navigateTo({ url: "/pages/login/login" });
          reject(msg);
        } else {
          // 其他错误：提示错误信息
          uni.showToast({ title: msg || "请求失败", icon: "none" });
          reject(msg);
        }
      },
      fail: (err) => {
        // 网络错误/接口不可达
        uni.showToast({ title: "网络异常，请检查连接", icon: "none" });
        reject(err);
      },
      complete: () => {
        // 可添加加载框关闭逻辑
      },
    });
  });
};

// ====================== 首页相关接口 ======================
/**
 * 获取首页帖子列表
 * @returns {Promise} 帖子列表数据
 */
export const getPostList = () => {
  return request("/post/list", "GET");
};

/**
 * 帖子点赞/取消点赞
 * @param {Number} postId 帖子ID
 * @returns {Promise}
 */
export const likePost = (postId) => {
  return request("/post/like", "POST", { postId });
};

/**
 * 帖子收藏/取消收藏
 * @param {Number} postId 帖子ID
 * @returns {Promise}
 */
export const collectPost = (postId) => {
  return request("/post/collect", "POST", { postId });
};

// ====================== 个人中心相关接口 ======================
/**
 * 获取用户点赞的帖子列表
 * @returns {Promise}
 */
export const getMyLikedPosts = () => {
  return request("/user/liked", "GET");
};

/**
 * 获取用户收藏的帖子列表
 * @returns {Promise}
 */
export const getMyCollectedPosts = () => {
  return request("/user/collections", "GET");
};

/**
 * 获取用户信息
 * @returns {Promise}
 */
export const getUserInfo = () => {
  return request("/user/info", "GET");
};

// ====================== AI小助手相关接口 ======================
/**
 * AI对话（前端直连DeepSeek，或后端转发）
 * @param {String} msg 用户提问内容
 * @returns {Promise} AI回复内容
 */
export const getAiReply = (msg) => {
  // 方案1：前端直连DeepSeek（测试用，替换成你的API Key）
  const deepSeekApiKey = "sk-d13d262c68d645ccb13d4311fe571d03"; // 替换为实际密钥
  return new Promise((resolve, reject) => {
    uni.request({
      url: "https://api.deepseek.com/v1/chat/completions",
      method: "POST",
      header: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${deepSeekApiKey}`,
      },
      data: {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "你是专业的宠物领养AI助手，仅回答宠物领养相关问题，语气友好易懂，无关问题礼貌拒绝。"
          },
          { role: "user", content: msg }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      success: (res) => {
        if (res.data?.choices?.length > 0) {
          resolve(res.data.choices[0].message.content);
        } else {
          reject("AI回复为空");
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });

  // 方案2：调用自己的后端接口（推荐，隐藏API Key）
  // return request("/ai/reply", "POST", { msg });
};

// ====================== 登录相关接口 ======================
/**
 * 用户登录
 * @param {String} username 用户名
 * @param {String} password 密码
 * @returns {Promise} 用户信息（含token、userId）
 */
export const userLogin = (username, password) => {
  return request("/user/login", "POST", { username, password }, false);
};

// 导出所有接口（方便页面引入）
export default {
  getPostList,
  likePost,
  collectPost,
  getMyLikedPosts,
  getMyCollectedPosts,
  getUserInfo,
  getAiReply,
  userLogin,
};