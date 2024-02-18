import express from "express";
import cors from "cors";
import router from "./src/routes/route.js";
import { fileURLToPath } from "url";
import path from "path";

const app = express()
const dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(cors())
app.use("/api", router)

app.get("/", (req, res) => {
    res.sendFile(path.join(dirname, "index.html"));
})

app.listen(3000, async () => {
    console.log("server running...")
})


