import { Request, Response, CookieOptions } from "express";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

const generateAccessAndRefreshTokens = async (
  userId: Types.ObjectId
): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    if (error instanceof ApiError) throw error;

    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (
      [name, email, password].some(
        (field) => !field || String(field).trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required");
    }

    if (String(password).length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters");
    }

    const existingUser = await User.findOne({
      email: String(email).toLowerCase(),
    });

    if (existingUser) {
      throw new ApiError(409, "User with this email already exists");
    }

    const user = await User.create({ name, email, password });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshTokens(user._id as Types.ObjectId);

    return res
      .status(201)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(201, createdUser, "User registered successfully")
      );
  } catch (error) {
    console.log("register error:", error);

    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (
      [email, password].some(
        (field) => !field || String(field).trim() === ""
      )
    ) {
      throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({
      email: String(email).toLowerCase(),
    }).select("+password");

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordCorrect = await user.matchPassword(String(password));

    if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid email or password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id as Types.ObjectId
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(200, loggedInUser, "User logged in successfully")
      );
  } catch (error) {
    console.log("login error:", error);

    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
    });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    let decodedToken: { _id: string };

    try {
      decodedToken = jwt.verify(
        String(incomingRefreshToken),
        process.env.REFRESH_TOKEN_SECRET as string
      ) as { _id: string };
    } catch {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await User.findById(decodedToken._id).select(
      "+refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or reused");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id as Types.ObjectId
    );

    const refreshedUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(200, refreshedUser, "Access token refreshed successfully")
      );
  } catch (error) {
    console.log("refresh token error:", error);

    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
    });
  }
};
