const postsCollection = require('../db').db().collection("posts")
const followsCollection = require('../db').db().collection("follows")
const ObjectId = require('mongodb').ObjectId
const User = require('./User')
const sanitizeHTML = require('sanitize-html')

let Post = function(data, userid, requestedPostId) {
  this.data = data
  this.errors = []
  this.userid = userid
  this.requestedPostId = requestedPostId
}

Post.prototype.cleanUp = function() {
  if (typeof(this.data.title) != "string") {this.data.title = ""}
  if (typeof(this.data.body) != "string") {this.data.body = ""}

  // get rid of any bogus properties
  this.data = {
    title: sanitizeHTML(this.data.title.trim(),{allowedTags:[],allowedAttributes:{}}),
    body: sanitizeHTML(this.data.body.trim(),{allowedTags:[],allowedAttributes:{}}),
    createdDate: new Date(),
    author: new ObjectId(this.userid)
  }
}

Post.prototype.validate = function() {
  if (this.data.title == "") {this.errors.push("You must provide a title.")}
  if (this.data.body == "") {this.errors.push("You must provide post content.")}
}

Post.prototype.create = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      try {
        // save post into database
        const info = await postsCollection.insertOne(this.data)
        // Ensure text index exists after first post is created
        await Post.ensureTextIndex().catch(() => {}) // Don't fail if index creation fails
        resolve(info.insertedId)
      } catch (err) {
        this.errors.push("Please try again later.")
        reject(this.errors)
      }
    } else {
      reject(this.errors)
    }
  })
}

Post.prototype.update = function() {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(this.requestedPostId, this.userid)
      if (post.isVisitorOwner) {
        // actually update the db
        let status = await this.actuallyUpdate()
        resolve(status)
      } else {
        reject()
      }
    } catch {
      reject()
    }
  })
}

Post.prototype.actuallyUpdate = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      await postsCollection.findOneAndUpdate({_id: new ObjectId(this.requestedPostId)}, {$set: {title: this.data.title, body: this.data.body}})
      resolve("success")
    } else {
      resolve("failure")
    }
  })
}

Post.reusablePostQuery = function(uniqueOperations, visitorId) {
  return new Promise(async function(resolve, reject) {
    let aggOperations = uniqueOperations.concat([
      {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
      {$project: {
        _id: 1,
        title: 1,
        body: 1,
        createdDate: 1,
        authorId: "$author",
        author: {$arrayElemAt: ["$authorDocument", 0]}
      }}
    ])

    let posts = await postsCollection.aggregate(aggOperations).toArray()

    // clean up author property in each post object
    posts = posts.map(function(post) {
      // Check if visitorId is valid and not 0 before comparing
      if (visitorId && visitorId !== 0 && visitorId !== '0') {
        try {
          // Convert visitorId to ObjectId if it's a string, or use as-is if already ObjectId
          let visitorObjectId
          if (visitorId instanceof ObjectId) {
            visitorObjectId = visitorId
          } else if (typeof visitorId === 'string' && ObjectId.isValid(visitorId)) {
            visitorObjectId = new ObjectId(visitorId)
          } else {
            post.isVisitorOwner = false
          }
          
          // Compare ObjectIds if we have a valid visitorObjectId
          if (visitorObjectId && post.authorId && post.authorId instanceof ObjectId) {
            post.isVisitorOwner = post.authorId.equals(visitorObjectId)
          } else if (!visitorObjectId) {
            post.isVisitorOwner = false
          }
        } catch (err) {
          post.isVisitorOwner = false
        }
      } else {
        post.isVisitorOwner = false
      }
      post.authorId = undefined

      // Ensure author exists before accessing its properties
      if (post.author && post.author.username) {
        post.author = {
          username: post.author.username,
          avatar: new User(post.author, true).avatar
        }
      } else {
        // If author lookup failed, provide default values
        post.author = {
          username: '[deleted]',
          avatar: 'https://gravatar.com/avatar/?s=128'
        }
      }

      return post
    })

    resolve(posts)
  })
}

Post.findSingleById = function(id, visitorId) {
  return new Promise(async function(resolve, reject) {
    if (typeof(id) != "string" || !ObjectId.isValid(id)) {
      reject()
      return
    }
    
    let posts = await Post.reusablePostQuery([
      {$match: {_id: new ObjectId(id)}}
    ], visitorId)

    if (posts.length) {
      resolve(posts[0])
    } else {
      reject()
    }
  })
}

Post.findByAuthorId = function(authorId) {
  return Post.reusablePostQuery([
    {$match: {author: authorId}},
    {$sort: {createdDate: -1}}
  ])
}
Post.delete = function(postIdToDelete, currentUserId){
  return new Promise (async (resolve,reject) =>{
    try{
      let post =  await Post.findSingleById(postIdToDelete, currentUserId)
      if(post.isVisitorOwner){
        await postsCollection.deleteOne({_id: new ObjectId(postIdToDelete)})
        resolve()
      }else{
        reject()
      }
    }catch{
      reject()
    }
  })
}

// Ensure text index exists for search functionality
Post.ensureTextIndex = async function() {
  try {
    // Try to get indexes - if collection doesn't exist, this will throw an error
    const indexes = await postsCollection.indexes()
    const hasTextIndex = indexes.some(index => index.name === 'title_text_body_text')
    
    if (!hasTextIndex) {
      await postsCollection.createIndex(
        { title: "text", body: "text" },
        { name: 'title_text_body_text' }
      )
    }
  } catch (err) {
    // Collection doesn't exist yet or other error - silently fail
    // Index will be created when collection is created (after first post)
    if (err.message && !err.message.includes('ns does not exist') && !err.message.includes('not a function')) {
      console.warn('Could not ensure text index:', err.message)
    }
  }
}

Post.search = function(searchTerm){
  return new Promise(async (resolve, reject) => {
    if (typeof(searchTerm) != "string") {
      reject()
      return
    }
    
    try {
      // Ensure text index exists before searching
      await Post.ensureTextIndex()
      
      let posts = await Post.reusablePostQuery([
        {$match: {$text:{$search:searchTerm}}},
        {$sort:{score:{$meta:"textScore"}}}
      ])
      resolve(posts)
    } catch (err) {
      // If text search fails, fall back to a simple regex search
      // Text search failed, falling back to regex search
      try {
        const searchRegex = new RegExp(searchTerm, 'i')
        let posts = await Post.reusablePostQuery([
          {$match: {
            $or: [
              {title: searchRegex},
              {body: searchRegex}
            ]
          }},
          {$sort: {createdDate: -1}}
        ])
        resolve(posts)
      } catch (fallbackErr) {
        reject()
      }
    }
  })
}

Post.countPostsByAuthor = function(id) {
  return new Promise(async (resolve, reject) => {
    let postCount = await postsCollection.countDocuments({author: id})
    resolve(postCount)
  })
}

Post.getFeed = async function(id){
  //create an array of the user id's that the current user follows
  let followedUsers = await followsCollection.find({authorId: new ObjectId(id)}).toArray()
  followedUsers = followedUsers.map(function (followDoc){
    return followDoc.followedId
  })


  // look for posts where the athor is in the array of the above users
  return Post.reusablePostQuery([
    {$match: {author: {$in: followedUsers}}},
    {$sort : {createdDate: -1}}
  ])

}


module.exports = Post 
