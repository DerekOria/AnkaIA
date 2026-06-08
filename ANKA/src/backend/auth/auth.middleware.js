import express from 'express';

async function authenticateUser(username, password) {

    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: "Username and password are required"
        });
    }

    req.credentials = { username, password };
    next();
}
