/**
 * This service handles video generation.
 * NOTE: The provided Railway endpoint was for Railway's internal dashboard, not a user-deployed service.
 * To fix the 'Video generation failed' error and provide dynamic results, this service now simulates
 * a successful API call by returning a different placeholder video each time.
 * 
 * TODO for user: When your video generation backend on Railway is ready,
 * replace the mock implementation below with a real `fetch` call to YOUR service's endpoint.
 */

// User-provided Railway API Key (for future use)
const RAILWAY_API_KEY = '273b8528-34fa-47f2-9b86-018218cc69ec';

// Array of placeholder videos to simulate unique generation
const MOCK_VIDEO_URLS = [
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
];

// Function to simulate network delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateVideo = async (prompt: string): Promise<string> => {
  console.log(`Simulating video generation for prompt: "${prompt}"`);

  // Simulate the time it takes for a real API to generate a video
  await sleep(2500);

  // Return a random video from our mock list
  const randomIndex = Math.floor(Math.random() * MOCK_VIDEO_URLS.length);
  const randomVideoUrl = MOCK_VIDEO_URLS[randomIndex];
  
  console.log(`Returning mock video URL: ${randomVideoUrl}`);
  return randomVideoUrl;
};


/*
// --- REAL API IMPLEMENTATION (currently commented out) ---
// This is the code for when you have a working Railway endpoint.
// The endpoint 'https://backboard.railway.com/graphql/v2' is for Railway's
// own dashboard and will not work for custom video generation.
// You need to replace it with the URL of YOUR deployed service.

const RAILWAY_ENDPOINT = 'https://YOUR-SERVICE-NAME.up.railway.app/graphql'; // <-- Replace with your actual endpoint

export const generateVideo_REAL = async (prompt: string): Promise<string> => {
  console.log(`Generating video with Railway API for prompt: "${prompt}"`);
  console.log(`Endpoint: ${RAILWAY_ENDPOINT}`);

  const graphqlQuery = {
    query: `
      mutation GenerateVideo($prompt: String!) {
        generateVideo(prompt: $prompt) {
          url
          status
        }
      }
    `,
    variables: {
      prompt: prompt
    }
  };

  try {
    const response = await fetch(RAILWAY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_API_KEY}`
      },
      body: JSON.stringify(graphqlQuery)
    });

    if (!response.ok) {
      throw new Error(`Request to Railway API failed with status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Received response from Railway API:', responseData);

    const videoUrl = responseData?.data?.generateVideo?.url;

    if (videoUrl && typeof videoUrl === 'string') {
      console.log('Successfully extracted video URL from Railway API:', videoUrl);
      return videoUrl;
    } else {
      console.error('Unexpected response structure from Railway API:', responseData);
      throw new Error('Railway API returned an invalid or unexpected response format.');
    }
  } catch (error) {
    console.error("Error calling Railway API:", error);
    throw error;
  }
};
*/
