import { Request, Response } from "express";
import { ContactService } from "./contact.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response.helper";

const service = new ContactService();

export const identify = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await service.identify(req.body);
    res.status(200).json(successResponse(result));
  }
);