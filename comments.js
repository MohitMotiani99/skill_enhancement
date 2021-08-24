var MongoClient=require('mongodb').MongoClient
var url="mongodb+srv://pradyumnakedilaya:secret123%23@cluster0.vlavb.mongodb.net/test"
var mydb="skillenhancement"
var commentCollection="comments"
var postsCollection = "questionAnswer"
var collection = "globals"


var express=require('express')
var app = express()
var bodyparser = require("body-parser")
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.set("view engine","jade")

var commentId

app.listen(8075,function(){
    console.log("Server started")
})

MongoClient.connect(url,function(err,db){
    if(err) throw err
    dbo=db.db(mydb)
    dbo.collection(collection).find({}).toArray(function(err,result){
        commentId = result[0]["c_num"]
        console.log(commentId)
    })

    //Get comments on the posts (question or answer) identified by a set of ids
    app.get(["/questions/:ids/comments","/answers/:ids/comments"],(req,res)=>{
        var ids = req.params["ids"]
        console.log(ids)
        var comment = []
        ids.forEach(id => {
            dbo.collection(commentCollection).find({PostId:id}).toArray(function(err,result){
                comment.push(result)
                console.log(result)
            })
        })
        res.send(comment)
    })

    //Create a new comment on the post identified by id
    app.post(["/questions/:id/comments/add","/answers/:id/comments/add"],(req,res)=>{
        //auth required
        var id = req.params["id"]
        var commentObj={
            "Id": commentId+1,
            "PostId": Number(id),
            "Score":0,
            "Text":req.body.body,
            "CreationDate": Date.now(),
            "Score":0,
            "UserDisplayName": req.headers.username,
            "UserId":Number(req.headers.userid)
        }
        dbo.collection(commentCollection).insertOne(commentObj,function(err,result){
            if (err) throw err
            else console.log(result)
        })
        res.end()
    })

    //Edit a comment identified by its id
    app.patch("/comments/:id/edit",(req,res)=>{
        //auth required
        //Only owner
        var id = req.params["id"]
        dbo.collection(commentCollection).updateOne({"Id":Number(id)},{$set:{"Text":req.body.body,"CreationDate":Date.now()}})
        res.end()
    })

    //Delete comment identified by its id
    app.delete("/comments/:id/delete",(req,res)=>{
        //auth required
        //Only Owner
        dbo.collection(commentCollection).deleteOne({"Id":Number(req.params["id"])})
        console.log("Comment Deleted")
        res.end()
    })

    //Casts an upvote on the given comment.
    app.patch("comments/:id/upvote",(req,res)=>{
        //auth required
        var id = req.params["id"]
        dbo.collection(commentCollection).find({Id:id}).toArray(function(arr,result){
            var score = result[0]["Score"]
            dbo.collection(commentCollection).updateOne({"Id":Number(id)},{$set:{"Score":score+1}})
        })
        res.end()
    })

    //Downvote a given comment && Undo an upcomment
    app.patch(["comments/:id/downvote", "comments/:id/upvote/undo"],(req,res)=>{
        //auth required
        var id = req.params["id"]
        dbo.collection(commentCollection).find({Id:id}).toArray(function(arr,result){
            var score = result[0]["Score"]
            dbo.collection(commentCollection).updateOne({"Id":Number(id)},{$set:{"Score":score-1}})
        })
        res.end()
    })

    //Get the comments posted by the users identified by a set of ids
    app.get(["users/:ids/comments"],(req,res)=>{
        var ids = req.params["ids"]
        console.log(ids)
        var comment =[]
        ids.forEach(id => {
            dbo.collection(commentCollection).find({UserId:id}).toArray(function(err,result){
                if (err) throw err
                else{
                    comment.push(result)
                    console.log(result)
                }
            })
        })
        res.send(comment)
    })

    //Get the comments posted by a set of users in reply to another user.
    app.get("users/:ids/comments/:toid",(req,res)=>{
        
    })
})