// utils/request.js
const baseURL = 'http://192.168.238.62:5000'

const request = (options) => {
  return new Promise((resolve, reject) => {
    // 添加 token
    const token = uni.getStorageSync('token')
    if (token) {
      options.header = {
        ...options.header,
        'Authorization': `Bearer ${token}`
      }
    }

    // 设置默认 header
    options.header = {
      'Content-Type': 'application/json',
      ...options.header
    }

    // 发起请求
    uni.request({
      url: baseURL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: options.header,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          uni.navigateTo({
            url: '/pages/login/login'
          })
          reject(new Error('未登录'))
        } else if (res.statusCode === 403) {
          uni.showToast({
            title: '无权限访问',
            icon: 'none'
          })
          reject(new Error('无权限'))
        } else {
          uni.showToast({
            title: res.data.message || '请求失败',
            icon: 'none'
          })
          reject(new Error(res.data.message || '请求失败'))
        }
      },
      fail: (err) => {
        uni.showToast({
          title: '网络连接失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

// 封装 GET 请求
export const get = (url, data, options = {}) => {
  return request({
    url,
    method: 'GET',
    data,
    ...options
  })
}

// 封装 POST 请求
export const post = (url, data, options = {}) => {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  })
}

// 封装 PUT 请求
export const put = (url, data, options = {}) => {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  })
}

// 封装 DELETE 请求
export const del = (url, data, options = {}) => {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options
  })
}

export default {
  get,
  post,
  put,
  del
}