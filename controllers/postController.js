import express from "express";
import mongoose from "mongoose";
import Article from "../models/postModel.js";
import { User } from "../models/userModel.js";

const GetAllArticles = async (req, res) => {
  try {
    const articles = await Article.find({ isDeleted: false }).populate('author', 'username');
    if (articles.length === 0) return res.status(200).json({ msg: "Articles is Empty" });

    return res.status(200).json({ articles });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

const GetIdArticle = async (req, res) => {
  try {
    const articleId = req.body.articleId;
    if (!articleId) return res.status(400).json({ msg: "Article ID is Empty" });
    
    const article = await Article.findOne({ _id: articleId, isDeleted: false }).populate('author', 'username');
    if (!article) return res.status(400).json({ msg: "Article Not Found" });
  
    return res.status(200).json(article);
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

const UploadArticle = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const authorId = req.user.id;
    if (!title || !content) return res.status(400).json({ msg: "All Data is Required" });
    if (!authorId) return res.status(400).json({ msg: "Author ID Not Found" });

    console.log(authorId);
    let tagsArr = [];
    if (tags.length !== 0) {
      tagsArr = tags.trim().split(',').map(tag => tag.trim());
    }

    const newPost = await Article.create({ 
      author: authorId,
      title: title,
      body: content,
      tags: tagsArr
    });
    if (!newPost) return res.status(400).json({ msg: "Something Went Error" });

    return res.status(200).json({ newPost });

  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

const GetUserArticle = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ msg: "User ID is Empty" });

    const userArticle = await Article.find({ author: userId, isDeleted: false }).populate('author', 'username');
    return res.status(200).json(userArticle);

  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

const SearchArticle = async (req, res) => {
  try {
    let input = req.body.input;
    const searchBy = req.body.searchBy;
    if (!input) return res.status(400).json({ msg: "Input is Empty" });

    input = String(input);
    const normalizedInput = input.replace(/\s+/g, "").toLowerCase();

    let result;
    if (searchBy === 'title') {
      result = await Article.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "authorData"
          },
        },
        { $unwind: "$authorData" },
        {
          $addFields: {
            normalizedTitle: {
              $toLower: {
                $replaceAll: {
                  input: "$title",
                  find: " ",
                  replacement: ""
                }
              }
            }
          }
        },
        {
          $match: {
            normalizedTitle: {
              $regex: normalizedInput,
              $options: "i"
            }
          }
        } 
      ]); 
    } 

    else if (searchBy === 'author') {
      result = await Article.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "authorData"
          },
        },
        { $unwind: "$authorData" },
        {  
          $addFields: {
            normalizedAuthor: {
              $toLower: {
                $replaceAll: {
                  input: "$authorData.username",
                  find: " ",
                  replacement: ""
                }
              }
            }
          }
        },
        {
          $match: {
            normalizedAuthor: {
              $regex: normalizedInput,
              $options: "i"
            }
          }
        } 
      ]);
    }

    else if (searchBy === 'tag') {
      result = await Article.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "authorData"
          },
        },
        { $unwind: "$authorData" },
        {
          $addFields: {
            normalizedTag: {
              $map: {
                input: "$tags",
                as: "tag",
                in: {
                  $toLower: {
                    $replaceAll: {
                      input: "$$tag",
                      find: " ",
                      replacement: ""
                    }
                  }
                }
              }
            }
          }
        },
        {
          $match: {
            normalizedTag: { $in: [normalizedInput] }
          }
        } 
      ]);
    }
    
    return res.status(200).json(result);  

  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

const SearchUser = async (req, res) => {
  try {
    let input = req.body.input;
    const searchBy = req.body.searchBy;
    if (!input) return res.status(400).json({ msg: "Input is Empty" });

    input = String(input);

    let normalizedInput;
    normalizedInput = input.replace(/\s+/g, "").toLowerCase();
  
    let result;
    if (searchBy === "username") {
      result = await User.aggregate([
        {
          $addFields: {
            normalizedUsername: {
              $toLower: {
                $replaceAll: {
                  input: "$username",
                  find: " ",
                  replacement: "" 
                }
              }
            }
          }
        },
        {
          $match: {
            normalizedUsername: {
              $regex: normalizedInput,
              $options: "i"
            }
          }
        }
      ])
    }
    else if (searchBy === "email") {
      result = await User.aggregate([
        {
          $addFields: {
            normalizedEmail: {
              $toLower: {
                $replaceAll: {
                  input: "$email",
                  find: " ",
                  replacement: "" 
                }
              }
            }
          }
        },
        {
          $match: {
            normalizedEmail: {
              $regex: normalizedInput,
              $options: "i"
            }
          }
        }
      ])
    }

    else if (searchBy === "phonenumber") {
      result = await User.aggregate([
        {
          $addFields: {
            normalizedPhonenumber: {   
              $replaceAll: {
                input: { $toString: "$phonenumber" },
                find: " ",
                replacement: "" 
              }
            }
          }
        },
        {
          $match: {
            normalizedPhonenumber: {
              $regex: normalizedInput,
              $options: "i"
            }
          }
        }
      ])
    } 

    return res.status(200).json(result);
  
    } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

const FollowTarget = async (req, res) => {
  try {
    const { userId, targetId } =  req.body;
    if (!userId) return res.status(400).json({ msg: "User ID not Provided" });
    if (!targetId) return res.status(400).json({ msg: "Target ID not Provided" });

    if (userId === targetId) return res.status(400).json({ msg: "User ID and Target ID is Same" });

    const user = await User.findById(userId);
    const target = await User.findById(targetId);
    if (!user) return res.status(400).json({ msg: "User Not Found" });
    if (!target) return res.status(400).json({ msg: "Target Not Found" });

    if (target.followers.includes(userId)) {
      return res.status(400).json({ msg: "You Have Followed This Account" });
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { followings: targetId },
      $inc: { followingsCount: 1}
    })

    await User.findByIdAndUpdate(targetId, {
      $addToSet: { followers: userId },
      $inc: { followersCount: 1}
    })

    return res.status(200).json({ msg: "Followed" });

  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

const UnfollowTarget = async (req, res) => {
  try {
    const { userId, targetId } =  req.body;
    if (!userId) return res.status(400).json({ msg: "User ID not Provided" });
    if (!targetId) return res.status(400).json({ msg: "Target ID not Provided" });

    if (userId === targetId) return res.status(400).json({ msg: "User ID and Target ID is Same" });

    const user = await User.findById(userId);
    const target = await User.findById(targetId);
    if (!user) return res.status(400).json({ msg: "User Not Found" });
    if (!target) return res.status(400).json({ msg: "Target Not Found" });

    if (!target.followers.includes(userId)) {
      return res.status(400).json({ msg: "You Have Followed This Account" });
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { followings: targetId },
      $inc: { followingsCount: 1}
    })

    await User.findByIdAndUpdate(targetId, {
      $addToSet: { followers: userId },
      $inc: { followersCount: 1}
    })

    return res.status(200).json({ msg: "Followed" });

  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

const LikeDislikeArticle = async (req, res) => {
  try {
    const targetArticleId = req.body.targetArticleId;
    const userId = req.body.userId;
    const mode = req.body.mode;
    let article;

    const articleFind = await Article.findById(targetArticleId);
    if (!articleFind) return res.status(404).json({msg: "Article not Found"});

    if (mode === "like") {
      if (articleFind.like.includes(userId)) {
        article = await Article.findByIdAndUpdate(targetArticleId, 
        {
          $inc: { likeCount: -1 },
          $pull: { like: userId }
        },
        { new: true }
      );
      }
      else {
        article = await Article.findByIdAndUpdate(targetArticleId, 
          {
            $inc: { likeCount: 1 },
            $addToSet: { like: userId }
          },
          { new: true }
        );
      }
    }

    else if (mode === "dislike") {
      if (articleFind.dislike.includes(userId)) {
          article = await Article.findByIdAndUpdate(targetArticleId, 
          {
            $inc: { dislikeCount: -1 },
            $pull: { dislike: userId }
          },
          { new: true }
        );
      }

      else {
        article = await Article.findByIdAndUpdate(targetArticleId, 
          {
            $inc: { dislikeCount: 1 },
            $addToSet: { dislike: userId }
          },
          { new: true }
        );
      }
    }

    if (!article) return res.status(404).json({msg: "Article Update Failed"});

    res.status(200).json(article);

  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}
 
const DeleteArticle = async (req, res) => {
  try {
    const id = req.body.id;
    if (!id) return res.status(400).json({ msg: "ID not Provided" });

    const article = await Article.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    )
    if (!article) return res.status(400).json({ msg: "Article Not Found" });

    return res.status(200).json({ msg: "Deleted" });

  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

export {
  GetAllArticles, UploadArticle, GetIdArticle, GetUserArticle, SearchArticle, SearchUser, FollowTarget, UnfollowTarget, LikeDislikeArticle, DeleteArticle
}