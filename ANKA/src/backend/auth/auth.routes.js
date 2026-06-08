import express from "express";
import { authenticateUser } from "./auth.middleware.js";
const router = express.Router();

router.post("/login", authenticateUser, async (req, res) => {
    const { username, password } = req.credentials;

    

});

router.post("/register", authenticateUser, async (req, res) => {
    const { username, password } = req.credentials;

});

router.get("/me", authenticateUser, async (req, res) => {
    const { username, password } = req.credentials;

});

export default router;