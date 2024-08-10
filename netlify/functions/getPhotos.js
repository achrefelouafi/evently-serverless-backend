const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const mongoUser = process.env.mongoUser;
const mongoPwd = process.env.mongoPwd;
const uri = `mongodb+srv://${mongoUser}:${mongoPwd}@evently.2iyw5.mongodb.net/?retryWrites=true&w=majority&appName=Evently`;

let cachedDb = null; // Cached database connection

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb; // Return the cached connection if already connected
  }

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  const db = client.db('Evently'); // Replace with your database name
  cachedDb = db; // Cache the database connection
  console.log('Connected to MongoDB');

  return db;
}

async function handleGetExhibitions(db) {
  const exhibitions = await db.collection('exhibitions').find({}).toArray();
  return {
    statusCode: 200,
    body: JSON.stringify(exhibitions), // Return the actual exhibitions data
  };
}

async function handlePostLogin(db, body) {
  const { clientCode } = JSON.parse(body); // Parse the JSON body

  if (!clientCode) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'clientCode is required' }),
    };
  }

  try {
    const clientData = await db.collection('users').findOne({ clientCode });

    if (!clientData) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid code' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        result: 'Logged in', 
        clientName: clientData.clientName, 
        hasReserved: clientData.hasReserved 
      }),
    };
  } catch (err) {
    console.error('Error during login:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error during login' }),
    };
  }
}

async function handleGetExhibitions(db) {
  const exhibitions = await db.collection('exhibitions').find({}).toArray();
  return {
    statusCode: 200,
    body: JSON.stringify(exhibitions), // Return the actual exhibitions data
  };
}

exports.handler = async (event) => {
  try {
    const db = await connectToDatabase();

    // Handle GET requests
    if (event.httpMethod === 'GET') {
      if (event.path.endsWith('/exhibitions')) {
        // GET /login
        return await handleGetExhibitions(db);
      } 
    }

    // Handle other request methods (like POST)
    if (event.httpMethod === 'POST' && event.path.endsWith('/login')) {
      return await handlePostLogin(db, event.body);
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not Found' }),
    };

  } catch (error) {
    console.error('Error handling request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred' }),
    };
  }
};
