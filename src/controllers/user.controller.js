import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../model/user.model.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import { Resend } from 'resend';

import {uploadToCloudinary} from '../utils/cloudinary.js'
import nodemailer from "nodemailer";

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // console.log("accesstoken : ",accessToken );

        user.refreshToken = refreshToken;
        await user.save({
            validateBeforeSave:false
        });

        return {accessToken , refreshToken};

    } catch (error) {
        throw new ApiError(500 , "Someting went wrong while generating access and refresh tokens");
    }
}


const registerUser = asyncHandler(async(req,res)=>{
    
    const resend = new Resend("re_PxmdUBqk_Ks8Dji4tViV2vHvYJmKTbp9v");

    const {name , username , email , password} = req.body;
    if(!(name && username && email && password)){
        throw new ApiError(400 , "All fields are required");
    }


    const registeredUser = await User.findOne({
        $or: [
            { username: username },
            { email: email }
        ]
    });

    if(registeredUser){
        throw new ApiError(400 , "User with username/email already exist");
    }

    const user = await User.create(
        {
            name , 
            username,
            email,
            password
        }
    );
    await user.save();

    if(!user){
        throw new ApiError(500 , "Error while signing up the user");
    }
    
    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id);
    const response = await User.findById(user._id).select(" -password -refreshToken");
    if(!response){
        throw new ApiError(500 , "Error while fetching the user");
    }


    // resend.contacts.create({
    //     email: response.email,
    //     firstName: response.name,
    //     lastName: response.name,
    //     unsubscribed: false,
    //     audienceId: "1d573c48-9b02-4fa9-902d-f5576f7c7a76",
    //   });

    

    return res.status(200)
    .cookie("accessToken",accessToken )
    .cookie("refreshToken" , refreshToken )
    .json(
        new ApiResponse(
            200,
            {...response , accessToken:accessToken , refreshToken:refreshToken},
            "User registered successfully"
        )
    )
})


const setAvatar = asyncHandler(async(req,res)=>{
    const userId = req.user?._id;
    const avatarLocalPath = req.file?.path;
    console.log(1)

    if( !avatarLocalPath){
        throw new ApiError(400 , "All fields are required");
    }

    const user = await User.findById(userId);
    if(!user){
        throw new ApiError(400 , "User dont exist");
    }

    console.log(2)

    

    const avatar = await uploadToCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(
            400 , "Error while uploading avatar"
        )
    }

    console.log(3)

    const updatedUser = await User.findByIdAndUpdate(user._id,
        {
            
            avatar:avatar?.url
        },{
            new :true
        }
    );

    if(!updatedUser){
        throw new ApiError(500 , "Error while setting up avatar of  the user");
    }


    return res.status(200).json(
        new ApiResponse(
            200,
            updatedUser,
            "Avatar setup successfully"
        )
    );
    
})


const setLocation = asyncHandler(async(req,res)=>{
    const userId = req.user?._id;
    const {location} = req.body;
    console.log(req.body)
    console.log(userId)
    

    if(!location){
        throw new ApiError(400 , "All fields are required");
    }

    const user = await User.findById(userId);
    if(!user){
        throw new ApiError(400 , "User dont exist");
    }


    const updatedUser = await User.findByIdAndUpdate(user._id,
        {
            location,
        },{
            new :true
        }
    );

    if(!updatedUser){
        throw new ApiError(500 , "Error while setting up  location of  the user");
    }


    return res.status(200).json(
        new ApiResponse(
            200,
            updatedUser,
            "Location setup successfully"
        )
    );

    
})


const setPurpose = asyncHandler(async(req,res)=>{
    const {purpose}  = req.body;
    if(!purpose){
        throw new ApiError(400 , "All fields are required");
    }
    const userId = req.user?._id;
    if(!userId){
        throw new ApiError(400 , "User id not found");
    }


    const user = await User.findById(userId);
    if(!user){
        throw new ApiError(400 , "user not found");
    }


    const response = await User.findByIdAndUpdate(user._id , 
    {
        purpose
    },{
        new:true
    }).select("-password");

    if(!response){
        throw new ApiError(500 , "Error while setting up the purpose");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            response,
            "Purpose set up successfully"
        )
    )
})


const checkUsername = asyncHandler(async(req,res)=>{
    console.log(req.body)
    const {username} = req.body;
    if(!username){
        throw new ApiError(400 , "Username is required");
    }

    const user = await User.findOne(
        {
            username
        }
    );

    if(user){
        return res.status(200).json(
            new ApiResponse(
                200,
                {message : "Username already taken" , alreadyExist:true},
                "User already exist"  
            )
        )
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {message:"Username available" , alreadyExist : false},
            "User dont exist"
        )
    )
})



const checkEmail = asyncHandler(async(req,res)=>{
    const {email} = req.body;
    if(!email){
        throw new ApiError(400 , "Username is required");
    }

    const user = await User.findOne(
        {
            email
        }
    );

    if(user){
        return res.status(200).json(
            new ApiResponse(
                200,
                {message : "Email has already been used " , alreadyExist:true},
                "User already exist"
            )
        )
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {message:"Email allowed" , alreadyExist : false},
            "User dont exist"
        )
    )
})


// const sendEmail = asyncHandler(async(req,res)=>{
//     const recieverEmail = req.body.email || req.user?.email;
//     if(!recieverEmail){
//         throw new ApiError(400 , "Reciever id is required");
//     }
//     const key = String(process.env.EMAIL_API_KEY);
//     const resend = new Resend("re_PxmdUBqk_Ks8Dji4tViV2vHvYJmKTbp9v");

    
//     const emailData = {
//         from: 'Acme <onboarding@resend.dev>',
//         to: [recieverEmail],
//         subject: 'Signup Congratulation',
//         html: '<strong>Congratulations! You have successfully registered in the Dribble </strong>',
//       };
  
//       // Send email using the `resend` object
//       const { data, error } = await resend.emails.send(emailData);
  
//       if (error) {
//         // Handle error
//         return res.status(500).json(
//             new ApiResponse(
//                 200,
//                 { sent: false, message: 'Failed to send email', error },
//                 "Some error happend while sending"
//             )
//         );
//       }

//       return res.status(200).json(
//         new ApiResponse(
//             200,
//             {message : "Email sent successfully" , sent:true},
//             "Mail sent successfully"
//         )
//       )
// })



const sendEmail = async(req,res) => {
    console.log(req.user.email)
    const options = {
        from :"surajgsn107@gmail.com",
        to:req.user?.email,
        subject:"Congrats message for successfull signup",
        message:"Congratulation for successfully getting registered at Dribble."
    }

    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.office365.com",
            port: 587,
            secure: false, 
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_EMAIL_PASSWORD || "Aaniket1234@"
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            ...options
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(info.response)
        return res.status(200).json(
            {message:"mail sent succcessfully"}
        )
    } catch (error) {
        console.error(error);
    }
};


export {
    registerUser,
    setAvatar,
    setLocation,
    setPurpose,
    checkUsername,
    checkEmail,
    sendEmail
}