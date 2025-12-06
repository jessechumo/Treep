const dotenv = require('dotenv')
dotenv.config()
const { MongoClient } = require("mongodb");

async function startServer() {
  try {
    if (!process.env.CONNECTIONSTRING) {
      console.error('ERROR: CONNECTIONSTRING is not set in .env file')
      process.exit(1)
    }
    
    const client = await MongoClient.connect(process.env.CONNECTIONSTRING, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
    })
    
    // Test the connection
    await client.db().admin().ping()
    console.log('Connected to MongoDB')
    
    // Export the client for use in other modules
    module.exports = client
    
    // Initialize database indexes
    try {
      const Post = require('./models/Post')
      await Post.ensureTextIndex()
    } catch (err) {
      // Silently fail - index will be created when needed
    }
    
    // Start the Express app
    const app = require('./app')
    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message)
    if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
      console.error('Network error: Could not reach MongoDB server. Check your internet connection and MongoDB Atlas IP whitelist.')
    } else if (err.message.includes('authentication')) {
      console.error('Authentication error: Check your username and password in the connection string.')
    } else if (err.message.includes('timeout')) {
      console.error('Connection timeout: MongoDB server did not respond in time.')
    }
    console.error('Please check your CONNECTIONSTRING in the .env file')
    process.exit(1)
  }
}

startServer()
