const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const register = async (req, res) => {
  try {
    const { phone, password, otpCode, username, name, email, address } = req.body;

    if (phone && otpCode) {
      const otpDoc = await Otp.findOtp(phone, otpCode);
      if (!otpDoc) {
        return res.status(400).json({ message: 'Mã xác nhận OTP không đúng hoặc đã hết hạn.' });
      }
      await Otp.deleteOtp(phone);

      const existingUser = await User.collection().findOne({ phone });
      if (existingUser) {
        return res.status(400).json({ message: 'Số điện thoại này đã được đăng ký tài khoản.' });
      }

      const generatedUsername = `User_${phone.substring(phone.length - 4)}`;
      const generatedEmail = `${phone}@lightbooks.vn`;
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.createUser({
        username: generatedUsername,
        name: generatedUsername,
        email: generatedEmail,
        password: hashedPassword,
        phone: phone,
        address: '',
        role: 'customer'
      });

      const token = jwt.sign(
        { userId: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { password: _, ...userWithoutPassword } = newUser;
      return res.status(201).json({ message: 'User registered successfully', token, user: userWithoutPassword });
    }

    if (!username || !name || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, name, email and password' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.createUser({
      username,
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      address: address || '',
      role: 'customer'
    });

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: 'User registered successfully', user: userWithoutPassword });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { password } = req.body;
    const identifier = req.body.identifier || req.body.email;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide identifier and password' });
    }

    const user = await User.collection().findOne({
      $or: [
        { username: identifier },
        { email: identifier },
        { phone: identifier }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await User.recordLogin(user._id);

    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: 'Login successful', token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const socialLogin = async (req, res) => {
  try {
    const { provider, email, name, avatar, providerId } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Thiếu thông tin Email từ tài khoản liên kết.' });
    }

    const currentProvider = provider || 'google';
    const currentProviderId = providerId || 'mock_' + currentProvider + '_' + Math.floor(100000 + Math.random() * 900000);

    let user = await User.findUserByEmail(email);

    if (!user) {
      user = await User.createUser({
        username: email.split('@')[0],
        name: name || email.split('@')[0],
        email,
        password: '',
        provider: currentProvider,
        providerId: currentProviderId,
        avatar: avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + encodeURIComponent(email),
        role: 'customer'
      });
    } else if (user.provider === 'local' || !user.provider) {
      await User.updateUserById(user._id, {
        provider: currentProvider,
        providerId: currentProviderId,
        password: '' 
      });
      user = await User.findUserById(user._id);
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await User.recordLogin(user._id);

    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: 'Social login successful', token, user: userWithoutPassword });
  } catch (error) {
    console.error('Social login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, email, phone, address, dob, gender } = req.body;

    let avatarPath;
    if (req.file) {
      avatarPath = req.file.path; 
    } else if (req.body.avatar !== undefined) {
      avatarPath = req.body.avatar;
    }

    if (email) {
      const existingUser = await User.findUserByEmail(email);
      if (existingUser && !existingUser._id.equals(userId)) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (dob !== undefined) updateData.dob = dob;
    if (gender !== undefined) updateData.gender = gender;
    if (avatarPath !== undefined) updateData.avatar = avatarPath;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Không có thông tin nào được cập nhật' });
    }

    const updated = await User.updateUserById(userId, updateData);

    if (!updated) {
      return res.status(400).json({ message: 'Cập nhật thất bại' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('userUpdated', { userId: userId, action: 'profileUpdate' });
    }

    const user = await User.findUserById(userId);
    const { password, ...userWithoutPassword } = user;

    res.json({ message: 'Cập nhật thành công', user: userWithoutPassword });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const updateUsername = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: 'Username không được để trống' });
    }

    const existingUser = await User.findUserByUsername(username);
    if (existingUser && !existingUser._id.equals(userId)) {
      return res.status(400).json({ message: 'Username đã được sử dụng' });
    }

    const updated = await User.updateUserById(userId, { username });
    if (!updated) {
      return res.status(400).json({ message: 'Cập nhật thất bại' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('userUpdated', { userId: userId, action: 'usernameUpdate' });
    }

    const user = await User.findUserById(userId);
    const { password, ...userWithoutPassword } = user;

    res.json({ message: 'Cập nhật username thành công', user: userWithoutPassword });
  } catch (error) {
    console.error('Update username error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới' });
    }

    const user = await User.findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mật khẩu cũ không đúng' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updated = await User.updateUserById(userId, { password: hashedPassword });
    if (!updated) {
      return res.status(400).json({ message: 'Đổi mật khẩu thất bại' });
    }

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    const user = await User.findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, email: user.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await User.recordLogin(user._id);

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: 'Admin login successful',
      token,
      user: { ...userWithoutPassword, role: 'admin' }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { register, login, socialLogin, adminLogin, updateProfile, updateUsername, changePassword };
