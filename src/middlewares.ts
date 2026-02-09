import { NextFunction, Request, Response } from "express";
import { ErrorResponse } from "@/types/LocalTypes";
import CustomError from "./classes/CustomError";
import fetchData from "./utils/fetchData";

const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new CustomError(`🔍 - Not Found - ${req.originalUrl}`, 404);
  next(error);
};

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response<ErrorResponse>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  // console.log(err);
  const statusCode = err.status && err.status >= 400 ? err.status : 500;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
  });
};

const audioTranscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if audio file exists in req.files
    const files = (
      req as Request & { files: { [fieldname: string]: Express.Multer.File[] } }
    ).files;
    const audioFiles = files?.audio;

    if (!audioFiles || audioFiles.length === 0) {
      return next();
    }

    const audioFile = audioFiles[0];

    if (!process.env.OPENAI_PROXY_URL) {
      throw new CustomError("OpenAI proxy URL not configured", 500);
    }

    // Create FormData for OpenAI Whisper API
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([new Uint8Array(audioFile.buffer)]),
      audioFile.originalname
    );
    formData.append("model", "whisper-1");

    // Call OpenAI Whisper API using fetchData
    const transcriptionResponse = await fetchData<{
      text: string;
    }>(`${process.env.OPENAI_PROXY_URL}/v1/audio/transcriptions`, {
      method: "POST",
      body: formData,
    });

    // Add transcribed text to req.body.prompt
    const existingPrompt = req.body.prompt || "";
    req.body.prompt = existingPrompt
      ? `${existingPrompt}\n\n[Audio transcription: ${transcriptionResponse.text}]`
      : transcriptionResponse.text;

    next();
  } catch (error) {
    console.error("Audio transcription error:", error);
    next(new CustomError("Failed to transcribe audio", 500));
  }
};

export { notFound, errorHandler, audioTranscription };
