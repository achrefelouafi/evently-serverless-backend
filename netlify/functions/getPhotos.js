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

function getCorsHeaders(origin) {
  const allowedOrigins = [
    'http://localhost:5173',
    'https://mohamed-achref-elouafi-evently-showcase.netlify.app'
  ];

  if (allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }

  return {
    'Access-Control-Allow-Origin': 'null', // Disallow other origins
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

async function handleGetExhibitions(db, origin) {
  const exhibitions = await db.collection('exhibitions').find({}).toArray();
  return {
    statusCode: 200,
    headers: getCorsHeaders(origin),
    body: JSON.stringify(exhibitions), // Return the actual exhibitions data
  };
}

async function handlePostLogin(db, body, origin) {
  const { clientCode } = JSON.parse(body); // Parse the JSON body

  if (!clientCode) {
    return {
      statusCode: 400,
      headers: getCorsHeaders(origin),
      body: JSON.stringify({ error: 'clientCode is required' }),
    };
  }

  try {
    const clientData = await db.collection('users').findOne({ clientCode });

    if (!clientData) {
      return {
        statusCode: 401,
        headers: getCorsHeaders(origin),
        body: JSON.stringify({ error: 'Invalid code' }),
      };
    }

    return {
      statusCode: 200,
      headers: getCorsHeaders(origin),
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
      headers: getCorsHeaders(origin),
      body: JSON.stringify({ error: 'Error during login' }),
    };
  }
}

exports.handler = async (event) => {
  try {
    const db = await connectToDatabase();
    const origin = event.headers.origin || event.headers.Origin;

    // Handle GET requests
    if (event.httpMethod === 'GET') {
      if (event.path.endsWith('/exhibitions')) {
        return await handleGetExhibitions(db, origin);
      }
    }

    // Handle POST requests
    if (event.httpMethod === 'POST' && event.path.endsWith('/login')) {
      return await handlePostLogin(db, event.body, origin);
    }

    // Handle OPTIONS requests for CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: getCorsHeaders(origin),
        body: JSON.stringify({}),
      };
    }

    return {
      statusCode: 404,
      headers: getCorsHeaders(origin),
      body: JSON.stringify({ error: 'Not Found' }),
    };

  } catch (error) {
    console.error('Error handling request:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(null),
      body: JSON.stringify({ error: 'An error occurred' }),
    };
  }
};
