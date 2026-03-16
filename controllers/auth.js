import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { User } from "../models/userModel.js";
import { access, read } from "fs";
import path from "path";
import { validationResult } from "express-validator";
import { Resend } from "resend";
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateRandomNumber() {
  const min = 10000; // Angka 5 digit terkecil
  const max = 99999; // Angka 5 digit terbesar
  // Math.random() menghasilkan angka antara 0 (inklusif) dan 1 (eksklusif)
  // Math.floor() membulatkan ke bawah ke bilangan bulat terdekat
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const SendEmail = async (to, subject, html) => {
  try {
    const data = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html
    });
    console.log("[EMAIL SENT]", data); // <-- tambah ini
    return data
  } catch (error) {
    console.error("[EMAIL ERROR]", error);
    throw new Error("Failed to send email");
  }
}

const SendingEmail = async (email) => {
  if (!email) throw new Error("Email is required");

  const otp = generateRandomNumber();

  const updatedUser = await User.findOneAndUpdate(
    { email },
    { 
      OTPCode: otp,
    },
    { new: true }
  );

  if (!updatedUser) throw new Error("User not found for OTP");

  const html = `
    <h1>Account Verification</h1>

    <p>Hello,</p>

    <p>Thank you for creating an account. Please use the OTP code below to verify your email:</p>

    <h2>${otp}</h2>

    <p>If you did not request this verification, you can safely ignore this email.</p>

    <p>Best regards,<br>Article App Team</p>
  `;

  await SendEmail(email, "Account Verification", html);

  return otp;
};

const resendOtpHandler = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });

    await SendingEmail(email);

    res.json({ msg: "OTP resent" });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};

const UserRegister = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().forEach(err => {
      console.log(`[VALIDATION ERROR] Field: ${err.path} → ${err.msg}`);
    });

    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }

  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ msg: "All Data is Required" });

    const existingEmail = await User.findOne({ email });
    const existingUsername = await User.findOne({ username });
    if (existingEmail) return res.status(400).json({ msg: "Email Used" });
    if (existingUsername) return res.status(400).json({ msg: "Username Used" });

    const newUser = await User.create({ username, email, password });
    if (!newUser) return res.status(400).json({ msg: "Failed to Register" });

    await SendingEmail(email);

    return res.status(200).json({ msg: "Registered"});
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

const OTPverification = async (req, res) => {
  try {
    const { otpEmail, OTPCode } = req.body;
    if (!OTPCode) return res.status(400).json({ msg: "Please Enter the OTP Code" });
    if (!otpEmail) return res.status(400).json({ msg: "Email Not Provided" });

    const user = await User.findOne({ email: otpEmail, OTPCode });
    if (!user) return res.status(400).json({ msg: "Wrong OTP Code" });

    const accessToken = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "14d" }
    );
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 14 * 24 * 60 * 60 * 1000
    })

    return res.status(200).json({ msg: "Login Success" });

  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

const UserLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: "All Data is Required" });

    const target = await User.findOne({ email });
    if (!target) return res.status(400).json({ msg: "Email Do Not Existed" });

    const isMatch = await bcrypt.compare(password, target.password);
    if (!isMatch) return res.status(400).json({ msg: "Wrong Password" });

    const accessToken = jwt.sign(
      {
        id: target._id,
        username: target.username,
        email: target.email
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      {
        id: target._id,
        username: target.username,
        email: target.email
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "14d" }
    );
    target.refreshToken = refreshToken;
    await target.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 14 * 24 * 60 * 60 * 1000
    })

    return res.status(200).json({ msg: "Login Success" });

  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

const VerifyToken = async (req, res,) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) return res.status(400).json({ msg: "Token Not Provided" });

    const decode = await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    if (!decode) return res.status(400).json({ msg: "Access Token Invalid" });

    res.status(200).json({ decode });

  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

const AuthMiddleware = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) return res.status(400).json({ msg: "Token Not Provided" });

    const decode = await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    if (!decode) return res.status(400).json({ msg: "Access Token Invalid" });

    req.user = decode;
    next();

  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

const RefreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(400).json({ msg: "Refresh Token Not Provided" });

    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(400).json({ msg: "Refresh Token Invalid" });

    const decode = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    if (!decode) return res.status(400).json({ msg: "Refresh Token Ignored" });

    const newToken = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", newToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      path: '/'
    })
    return res.status(200).json({ msg: "New Token Generated" });

  } catch (error) {
    return res.status(400).json({ msg: "Something Went Wrong" });
  }
}

const UserLogout = async (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: false,
    sameSite: "Strict"
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
    sameSite: "Strict"
  });

  return res.status(200).json({ msg: "Logout Successful" });
}

const GetUserData = async (req, res) => {
  try {
    const id = req.body.id;
    if (!id) return res.status(400).json({ msg: "ID Not Provided" });

    const user = await User.findById(id);
    if (!user) return res.status(400).json({ msg: "User Not Found" });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

const UpdateUserData = async (req, res) => {
  try {
    const newData = req.body;
    const id = req.body.id;
    if (!id) return res.status(400).json({ msg: "ID Not Provided" });
    if (!newData) return res.status(400).json({ msg: "New Data Is Empty" });

    const UpdatedUser = await User.findByIdAndUpdate(
      id, { $set: newData }, { new: true }
    );
    if (!UpdatedUser) return res.status(400).json({ msg: "User Not Found, Update Failed" });

    return res.status(200).json(UpdatedUser);
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

export {
  UserRegister, 
  UserLogin, 
  VerifyToken, 
  AuthMiddleware, 
  RefreshAccessToken, 
  UserLogout, 
  GetUserData, 
  UpdateUserData, 
  OTPverification,
  SendingEmail,
  resendOtpHandler,
  SendEmail
}