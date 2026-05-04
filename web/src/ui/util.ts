export const Validator = {
  validateUsername(username: string) {
    if (!username) return '用户名不能为空';
    if (username.length < 2) return '用户名至少 2 个字符';
    if (username.length > 16) return '用户名最多 16 个字符';
    return true;
  },
  validatePassword(password: string) {
    if (!password) return '密码不能为空';
    if (password.length < 8) return '密码至少 8 个字符';
    if (password.length > 100) return '密码最多 100 个字符';
    return true;
  },
  validateEmail(email: string) {
    if (!email) return '邮箱不能为空';
    const emailRegex =
      /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    if (!emailRegex.test(email)) return '请输入有效的邮箱地址';
    return true;
  },
  validateOtpVerify(otp: string) {
    if (!otp) return '邮箱验证码不能为空';
    if (!/^\d{6}$/.test(otp)) return '邮箱验证码必须是 6 位数字';
    return true;
  },
  validateOtpResetPassword(otp: string) {
    if (!otp) return '邮箱验证码不能为空';
    if (otp.length !== 26) return '邮箱验证码必须是 26 位字符';
    return true;
  },
};

export function onLoginSuccess() {
  if (window.parent === window) {
    // 本地开发跳转到主前端 dev server，生产环境跳转到 n.novelia.cc
    const target = import.meta.env.DEV ? 'http://localhost:5173' : 'https://n.novelia.cc';
    window.location.href = target;
  } else {
    // 如果是在 iframe 中打开的，发送消息给父窗口
    window.parent.postMessage({ type: 'login_success' }, '*');
  }
}
