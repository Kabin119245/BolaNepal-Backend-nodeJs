import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { generateVerificationCode } from "../utils/generateCode.js";
import { sendEmail } from "../utils/sendEmail.js";

const generateAccessAndReferenceToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error while generating access and refresh token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //create user object -create entry in db
  //remove password and refresh token field from response
  //check for user ceration
  //return response

  //get user details from frontend
  const { email, username, password } = req.body;
  console.log("email:", email);
  //validation - not empty
  if ([email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // check if user already exists : email
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    //exist and is verified
    if (existedUser.isVerified) {
      throw new ApiError(
        400,
        "User already exists and is verified. Please log in."
      );
    }

    //exist but not verified
    if (!existedUser.isVerified) {
      if (Date.now() < existedUser.validate) {
        const message = `Your previous verification code is ${existedUser.verificationCode}. It will expire in 10 minutes.`;
        await sendEmail(email, "Resend Verification Code", message);
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              null,
              "Verification code resent. Please check your email."
            )
          );
      } else {
        //code is expired
        const newVerificationCode = generateVerificationCode();
        existedUser.verificationCode = newVerificationCode;
        existedUser.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // New expiration 10 minutes
        await existedUser.save({ validateBeforeSave: false });

        const message = `Your new verification code is ${newVerificationCode}. It will expire in 10 minutes.`;
        await sendEmail(email, "New Verification Code", message);

        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              null,
              "New verification code sent. Please check your email."
            )
          );
      }
    }
  }

  const verificationCode = generateVerificationCode();
  const verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  const user = await User.create({
    email,
    username: username.toLowerCase(),
    password,
    verificationCode,
    verificationCodeExpires,
  });

  const message = `Your verification code is ${verificationCode}. It will expire in 10 minutes.`;
  await sendEmail(email, "Verify your email", message);

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        null,
        "Verification code sent to your email. Please verify to complete registration."
      )
    );

  // const createdUser = await User.findById(user._id).select(
  //   "-password -refreshToken"
  // );

  // if (!createdUser) {
  //   throw new ApiError(500, "Something went wrong while registering user");
  // }

  // return res
  //   .status(201)
  //   .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isVerified) {
    throw new ApiError(400, "User is already verified");
  }

  if (user.verificationCode !== code) {
    throw new ApiError(400, "Invalid verification code");
  }

  if (Date.now() > user.verificationCodeExpires) {
    throw new ApiError(400, "Verification code expired");
  }

  // Mark user as verified
  user.isVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, null, "User verified successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  // Admin bypass logic
  if (email === "admin" && password === "admin") {
    const adminUser = {
      _id: "adminId", // Dummy ID or set a real admin user ID if available
      username: "admin",
      email: "admin@example.com",
    };

    const accessToken = jwt.sign(
      {
        _id: adminUser._id,
        email: adminUser.email,
        username: adminUser.username,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
    );

    const refreshToken = jwt.sign(
      {
        _id: adminUser._id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { user: adminUser, accessToken, refreshToken },
          "Admin logged in successfully"
        )
      );
  }

  if (!username && !email) {
    throw new ApiError(400, "Email or username is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User doesn't exist");
  }

  if (!user.isVerified) {
    throw new ApiError(400, "User email is not verified");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndReferenceToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or use");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndReferenceToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, newRefreshToken },
          "Access Token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Check if the user exists
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "No user found with this email");
  }

  const verificationCode = generateVerificationCode();
  const verificationCodeExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes

  // Update the user with the new verification code and expiration
  user.verificationCode = verificationCode;
  user.verificationCodeExpires = verificationCodeExpires;
  await user.save({ validateBeforeSave: false });

  // Send the email with the verification code
  const message = `Your password reset code is ${verificationCode}. It will expire in 10 minutes.`;
  await sendEmail(email, "Password Reset Code", message);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset code sent to your email"));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  // Find the user by email
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Update the password and clear the verification fields
  user.password = newPassword;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;

  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset successfully"));
});

const verifyResetCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  // Find the user by email
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if the code is valid
  if (user.verificationCode !== code) {
    throw new ApiError(400, "Invalid or expired code");
  }

  // Check if the code has expired
  if (Date.now() > user.verificationCodeExpires) {
    throw new ApiError(400, "Verification code expired");
  }

  // If everything is valid, send a success response
  res
    .status(200)
    .json(new ApiResponse(200, null, "Verification code is valid"));
});

export {
  registerUser,
  verifyEmail,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  verifyResetCode,
};
