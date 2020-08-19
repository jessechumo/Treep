const Post = require('../models/Post')

exports.viewCreateScreen = function(req, res) {
  res.render('create-post')
}

exports.create = function(req, res) {
  let post = new Post(req.body, req.session.user._id)
  post.create().then(function(newId) {
    req.flash("success","Your new post was successfully created")
    req.session.save(()=>res.redirect(`/post/${newId}`))
  }).catch(function(errors) {
    errors.forEach(error => req.flash("errors",error))
    req.session.save(()=>res.redirect("/create-post"))
  })
}

exports.viewSingle = async function(req, res) {
  try {
    let post = await Post.findSingleById(req.params.id,req.visitorId)
    res.render('single-post-screen', {post: post})
  } catch {
    res.render('404')
  }
}
exports.viewEditScreen = async function(req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    if (post.isVisitorOwner) {
      res.render("edit-post", {post: post})
    } else {
      req.flash("errors", "You do not have permission to perform that action.")
      req.session.save(() => res.redirect("/"))
    }
  } catch {
    res.render("404")
  }
}
exports.edit = function(req,res){
  let post = new Post(req.body, req.visitorId,req.params.id)
  post.update().then((status)=>{
    //post was succesfully updated inthe database
    //user does indeed have permission but there were validation errors
    if(status=="success"){
 //post was updated in db
    req.flash("success","Post succesfully updated. ")
    req.session.save(function(){
      res.redirect(`/post/${req.params.id}/edit`)
    })
    }else{
     post.errors.forEach(function(error){
       req.flash("errors",error)
     })
     req.session.save(function(){
       res.redirect(`/post/${req.params.id}/edit`)
     })
    }

  }).catch(()=>{
    // if post with requested id  doesnt exist
    //or if current user is not owner of the requested  post
    req.flash("errors","you do not have permission to perform that action")
    req.session.save(function(){
      res.redirect("/")
    })
  })
}
exports.delete = function(req,res){
 Post.delete(req.params.id,req.visitorId).then(()=>{
   req.flash("success","post successfully deleted.")
   req.session.save(()=>res.redirect(`/profile/${req.session.user.username}`))
 }).catch(()=>{
   req.flash("errors","You do not have permission to perform this action")
   req.session.save(()=>res.redirect("/"))
 })
}

exports.search = function(req, res){
  Post.search(req.body.searchTerm).then(posts=>{
    res.json(posts)
  }).catch(()=>{
    res.json([])
  })
}