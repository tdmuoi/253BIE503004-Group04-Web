const User = require('../models/User');
const Otp = require('../models/Otp');
const bcrypt = require('bcryptjs');

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email.' });
    }

    const user = await User.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng với email này.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

    await Otp.saveOtp(email, otp, expiresAt);

    console.log(`[OTP ForgotPassword] Mã OTP lấy lại mật khẩu cho ${email}: ${otp}`);

    res.json({
      message: 'Mã xác nhận OTP đã được tạo và gửi.',
      otp: otp 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Thiếu email hoặc mã OTP.' });
    }

    const otpDoc = await Otp.findOtp(email, otp);
    if (!otpDoc) {
      return res.status(400).json({ message: 'Mã xác nhận OTP không chính xác hoặc đã hết hạn.' });
    }

    res.json({ message: 'Xác thực OTP thành công. Vui lòng tiến hành đặt lại mật khẩu.' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Thiếu email, mã OTP hoặc mật khẩu mới.' });
    }

    const otpDoc = await Otp.findOtp(email, otp);
    if (!otpDoc) {
      return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
    }

    await Otp.deleteOtp(email);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(email, hashedPassword);

    res.json({ message: 'Đặt lại mật khẩu thành công.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { forgotPassword, verifyOtp, resetPassword };
