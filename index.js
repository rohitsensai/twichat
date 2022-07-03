const express=require('express');
const app=express();
const session=require('express-session')
const fetch=require('node-fetch')
const path=require('path')
const bcrypt=require('bcryptjs');
const mongoose=require('mongoose');
const methodoverride=require('method-override');
const multer=require('multer');
const flash=require('connect-flash');


var Twit=require('twit');


const consumer_key='iCAbgcUEzonxVYa7XkkghepKF';
const consumer_secret='ZgGeV6GGPfSC0SWj3fMc8Ym3IJAdJXXimtepG2GFI9zeLi2knI';
const access_token_key='737638593565450240-RC5mWAONZdrood4W568N24opvnOtyli';
const access_token_secret='NhYHnlRZhM8WXQkfZrPn57MH47HhBfTCVToXQRszmAhSl';


var T=new Twit({
    consumer_key:consumer_key,
    consumer_secret:consumer_secret,
    access_token:access_token_key,
    access_token_secret:access_token_secret
})
var tweets;

const gettweets=(nametweet)=>{

 return new Promise((resolve,reject)=>{

T.get('search/tweets',{q:nametweet ,count:1000, lang:'en',result_type:'recent',tweet_mode:'extended',exclude_replies:true,exclude:'retweets'},function(err,data,response){
 if(err){
    reject(err);
 }
    resolve(data.statuses)
})
})
}





mongoose.connect('mongodb://localhost:27017/quizapp');
app.set('view engine','ejs');
app.use(flash());
app.use(express.urlencoded({extended:true}));
app.use(express.static(__dirname+'/public'));
app.use(methodoverride('_method'));
app.use(session({
    secret:'notagoodsecret',
    resave:false,
    saveUninitialized:false
}))

//api key iCAbgcUEzonxVYa7XkkghepKF
//api secret key ZgGeV6GGPfSC0SWj3fMc8Ym3IJAdJXXimtepG2GFI9zeLi2knI
//token key 737638593565450240-RC5mWAONZdrood4W568N24opvnOtyli
//token secret NhYHnlRZhM8WXQkfZrPn57MH47HhBfTCVToXQRszmAhSl
//bearer token AAAAAAAAAAAAAAAAAAAAALdieQEAAAAA88dYK5FD2fNxvX0aQh%2BgRDpcnS8%3DfAI9ag7dqqSMzxQto0iqP622IwTVodZXpQpRko1kqmlSCA2jit


const Storage=multer.diskStorage({
    destination:"./public/uploads",
    filename:(req,file,cb)=>{
        console.log(Date.now()+path.extname(file.originalname))
        cb(null,Date.now() +path.extname(file.originalname));
    }
})

const upload=multer({
    storage:Storage
})

const Profile=require('./models/profiles');



app.get('/login',(req,res)=>{
    res.render('login',{message:""});
})
app.get('/logout/:id',async(req,res)=>{
    req.session.destroy();
    res.redirect('/login')
})
app.get('/home/:id',async(req,res)=>{
    if(req.session.userid){
        
        var {id}=req.params;
        console.log(id)
        var user;
        const users=await Profile.find({})
        for(let u of users){
            if(u.id==id) {
                user=u;
            }
        }
        var nametweet="india";
        tweets=await gettweets(nametweet);
        res.render('home',{id,user,tweets});
    }
    else res.redirect('login')
})
app.post('/home',async(req,res)=>{
    const {username,password}=req.body;
    var found=await Profile.find({});
    var ok=0;
    var user;
    for(let f of found){
        if(f.username==username && await bcrypt.compare(password,f.password)){
            ok=1;
            found=f;
        }
        }

    if(ok===0){
         res.render('login',{message:"Invalid username/password"})
    }
    else {
        user=found;
        const id=found.id;
        req.session.userid=id;
        var nametweet="india";
        tweets=await gettweets(nametweet);
        res.render('home',{id,user,tweets});
        }
})

app.get('/signup',(req,res)=>{
    res.render('signup.ejs',{message:""});
})

app.post('/signup',async (req,res)=>{
    const {username,password,email,epass}= req.body;
    const users=await Profile.find({});
    var usernames=[];
    for(let u of users){
        usernames.push(u.username)
    }
    if(password!=epass){
         res.render('signup',{message:"Password doesn't match"});
    }
    else if(password==""){
        res.render('signup',{message:"Password can't be empty"})
    }
    else if(usernames.includes(username.toString())){
        res.render('signup',{message:"Username already exits"});
    }
    else{
    const salt=await bcrypt.genSalt(10);
    const hashedpass=await bcrypt.hash(password,salt);
    await Profile.insertMany({username:username,password:hashedpass,email:email});
    var user=await Profile.find({username:username,password:hashedpass});
    const id=user[0].id
    req.session.userid=id;
    user=user[0];
    var nametweet="india";
    tweets=await gettweets(nametweet);
    res.render('home',{id,user,tweets});
    }
})

app.post('/newtweets/:id',async(req,res)=>{
    var {s}=req.body;
    const {id}=req.params;
    const user=await Profile.findOne({id:id})
    nametweet=s;
    tweets=await gettweets(nametweet);
    res.render('home',{user,id,tweets})
})

app.get('/addfriend/:id',async(req,res)=>{
    if(req.session.userid){
    const {id}=req.params
    const users=await Profile.find({});
    const user=await Profile.findById(id);
    const fary=user.friends;
    const friends=[];
    for(let f of fary ) {
        friends.push(f.id);
    }
    res.render('userlist',{id,users,friends,user});
}
else res.render('login',{message:""})
})

app.post('/:id/add/:toad',async(req,res)=>{
    if(req.session.userid){
    const {id,toad}=req.params;
    await Profile.findByIdAndUpdate(id,{$push:{friends:{id:toad}}});
    const users=await Profile.find({});
    const user=await Profile.findById(id);
    const fary=user.friends;
    const friends=[];
    for(let f of fary ) {
        friends.push(f.id);
    }
    res.render('userlist',{id,users,friends,user});

   }
   else res.redirect('login')
})

app.delete('/:id/remove/:todel',async(req,res)=>{
    if(req.session.userid){
    const {id,todel}=req.params;
    await Profile.findByIdAndUpdate(id,{$pull:{friends:{id:todel}}});
    const users=await Profile.find({});
    const user=await Profile.findById(id);
    const fary=user.friends;
    const friends=[];
    for(let f of fary ) {
        friends.push(f.id);
    }
    res.render('userlist',{id,users,friends,user});
    }
    else res.redirect('login')})

app.get('/msg/:id',async(req,res)=>{
    if(req.session.userid){
    const {id}=req.params;
    const user=await Profile.findById(id);
    const users=await Profile.find({});
    const chats=user.chats;
    var chatsid=[];
    for(let c of chats){
        chatsid.push(c.id);
    }
    res.render('allchats',{id,users,chatsid,chats,user})
    }
    else res.redirect('login')
})

app.get('/chats/:id/:fid',async(req,res)=>{
    if(req.session.userid){
    const {id,fid}=req.params;
    const user=await Profile.findById(id);
    const farry=user.chats;
    var chatary=[];
    for(let friend of farry) {
        if(friend.id==fid) chatary=friend.chats;
    }
    res.render('chats',{chatary,id,fid,user});
}
else res.redirect('login')
})

app.patch('/:id/send/:fid',async(req,res)=>{
    if(req.session.userid){
    const {id,fid}=req.params;
    const {msg}=req.body;
    var user=await Profile.findById(id);
    var chatary=user.chats;
    var changed=false;
    for(let i=0; i<chatary.length; i++){
        if(chatary[i].id==fid) {
            changed=true;
            chatary[i].chats.push({sender:"own",msg:msg});
            await Profile.findByIdAndUpdate(id,{$set:{chats:chatary}});
            chatary=chatary[i].chats;
        }
    }
    if(changed==false) {
        chatary.push({id:fid,chats:[{sender:"own",msg:msg}]});
        await Profile.findByIdAndUpdate(id,{$set:{chats:chatary}});
        chatary=[{sender:"own",msg:msg}];
    } 
    
    
    var user=await Profile.findById(fid);
    var chatar=user.chats;
    var changed=false;
    for(let i=0; i<chatar.length; i++){
        if(chatar[i].id==id) {
            changed=true;
            chatar[i].chats.push({sender:"other",msg:msg});
            await Profile.findByIdAndUpdate(fid,{$set:{chats:chatar}});
        }
    }
    if(changed==false) {
        chatar.push({id:id,chats:[{sender:"other",msg:msg}]});
        await Profile.findByIdAndUpdate(fid,{$set:{chats:chatar}});
    }

    res.render('chats',{chatary,id,fid,user})
}
else res.redirect('login')
})

app.post('/setdp/:id',upload.single('img'),async(req,res)=>{
    if(req.session.userid){
    const {id}=req.params;
    const newimg={isavail:true,src:req.file.filename};
    await Profile.findByIdAndUpdate(id,{$set:{img:newimg}});
    const user=await Profile.findById(id)
    var nametweet="india";
    tweets=await gettweets(nametweet);
    res.render('home',{user,id,tweets})
    }
    else res.redirect('/login');
})

app.get('/viewdp/:img/:id',async(req,res)=>{
    if(req.session.userid){
    const {img,id}=req.params;
    const user=await Profile.findOne({id:id});
    res.render('viewdp',{img,user,id});
    }
    else res.redirect('/login')
})

app.listen(3000,()=>{
    console.log("listening on port 3000");
})