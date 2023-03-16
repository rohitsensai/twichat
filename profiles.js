const mongoose=require('mongoose');

const profileschema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    email:{
        content:String
    },
    friends:[{
       id:String,
    }],
    chats:[{
        id:String,
        chats:[{
            sender:String,
            msg:String,
        },{_id:false}],
    },{_id:false}],
    img:{
        isavail:Boolean,
        src:{type:String,default:"images.jpg"},
    }
})
const Profile=mongoose.model('Profile',profileschema);

module.exports=Profile;