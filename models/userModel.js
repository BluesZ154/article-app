import mongoose from "mongoose";
import bcrypt from "bcrypt";
import slugify from "slugify";
import { type } from "os";

const UserSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true, 
      unique: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    refreshToken: {
      type: String,
      default: null
    },

    followersCount: {
      type: Number,
      default: 0
    },

    followingsCount: { 
      type: Number,
      default: 0
    },

    followers: [
      { type: mongoose.Schema.Types.ObjectId, ref:'user' }
    ],

    followings: [
      { type: mongoose.Schema.Types.ObjectId, ref:'user' }
    ],

    bio: {
      type: String,
      default: "-"
    },

    phonenumber: {
      type: Number,
      default: 0
    },

    location: {
      type: String,
      default: "-"
    },

    age: {
      type: Number,
      default: 0
    },

    job: {
      type: String,
      default: "-"
    },

    skill: {
      type: String,
      default: "-"
    },

    OTPCode: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
  }
)

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = 13;
  this.password = await bcrypt.hash(this.password, salt);
  return next();
})

const User = mongoose.model('User', UserSchema);

export {
  User
}