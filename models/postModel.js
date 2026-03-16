import mongoose from "mongoose";
import slugify from "slugify";

const ArticleSchema = mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },

    title: {
      type: String,
      required: true
    },

    slug: {
      type: String,
      required: true,
      unique: true
    },

    body: {
      type: String,
      required: true
    },

    tags: [String],

    isDeleted: {
      type: Boolean,
      default: false
    },

    likeCount: {
      type: Number,
      default: 0
    },

    dislikeCount: {
      type: Number,
      default: 0
    },

    like: [
      { type: mongoose.Schema.Types.ObjectId, ref:'user' }
    ],

    dislike: [
      { type: mongoose.Schema.Types.ObjectId, ref:'user' }
    ]

  },
  {
    timestamps: true,
  }
);

ArticleSchema.pre('validate', async function (next) {
  if (!this.slug && this.title) {
    const main = slugify(this.title, { lower: true, strict: true }).slice(0, 200);
    this.slug = main + '-' + Math.random().toString(36).slice(2, 8); 
  }
  next();
})

const Article = mongoose.model('Article', ArticleSchema);

export default Article;