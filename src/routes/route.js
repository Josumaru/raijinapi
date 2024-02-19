import { Router } from "express";

import { getAnime, getDetail, getStream, getMirror } from "../controllers/anime.js";

const router = Router();
router.get("/anime/:status/:page", getAnime);
router.get("/detail/:endpoint", getDetail);
router.get("/stream/:endpoint", getStream);
router.get("/mirror/:endpoint", getMirror);
router.get("*",(req, res, next) => res.status(404).json({status: 404, message: "404"}))


export default router;