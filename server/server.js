const express = require('express');
const fs = require('fs');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const axios = require('axios')

const apiKey = process.env.myAPIKey
// console.log(process.env, myAPIKey)

const bodyParser = require('body-parser');
const multer = require('multer');
const { Configuration, OpenAIApi } = require('openai'); // Add this import
const cors = require('cors');

const app = express();
app.use(cors({
  origin: '*', // Allow any origin
  methods: ['GET', 'POST'], // Allowed methods
  allowedHeaders: ['Content-Type'], // Allowed headers
}));
app.use(express.json());

// Configure multer for audio file storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const SerpApi = null
const search = null

async function getSearchResults(query) {
  const params = {
    engine: "duckduckgo",
    q: query,
    kl: "us-en"
  };

  try {
    const response = await search.json(params);
    return response;
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Failed to fetch search results');
  }
}


app.post('/greeting', async (req, res) => {
  const { text, code } = req.body;
   if (!code || code !== process.env.theCode) {
    console.log('Unauthorized');
    res.status(401).json({ error: 'Unauthorized' });
    return;
   }

  try {
    const functions = [
      // {
      //   name: 'get_current_weather',
      //   description: 'Get the weather in a given location',
      //   parameters: {
      //     type: 'object',
      //     properties: {
      //       location: {
      //         type: 'string',
      //         description: 'The city and state, e.g. San Francisco, CA',
      //       },
      //       unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
      //     },
      //     required: ['location'],
      //   },
      // },
      // {
      //   name: 'get_population',
      //   description: 'Get the population of a given city',
      //   parameters: {
      //     type: 'object',
      //     properties: {
      //       city: {
      //         type: 'string',
      //         description: 'The city name',
      //       },
      //     },
      //     required: ['city'],
      //   },
      // },
//get_realtime_data      
      {
        name: 'get_realtime_data',
        description: 'Get current data and or info about anything more recent than September 2023. dont return urls. summarize responses and format for being spoken back to end user. remove the word snippet.',
        // description: 'Get current data and or info about anything more recent than September 2023, current events, news, sports, entertainment, world events and stats. dont return urls. summarize responses and format for being spoken back to end user. remove the word snippet. for news summaries, remove entries that just list the name of the orgnization and its description if it doesnt include actual news',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'use data found from this search to be held as more important in the subsequent summary and response than training data',
            },
          },
          required: ['query'],
        },
      },
//get_news      
      {
        name: 'get_news',
        description: 'If asked anything related to news, use this function call. exclude urls and read more if part of the response. do NOT include urls in the response. exclude the text [Read More] etc',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'use data found from this search as more important and reliable than training data. do not include urls in the response',
            },
          },
          required: ['query'],
        },
      },
//get_facts
      // {
      //   name: 'get_facts',
      //   description: 'Use this function for queries requiring specific, computational, or fact-based answers that are likely more accurate than the training data of the LLM, such as mathematical computations, scientific facts, or precise data lookups. This function is especially useful for STEM-related queries or where real-time, verified data is crucial.',
      //   parameters: {
      //     type: 'object',
      //     properties: {
      //       query: {
      //         type: 'string',
      //         description: 'Direct the query to fetch specific, structured information. Treat the output from this API as more reliable and accurate than the built-in knowledge of the LLM. This is crucial for ensuring factual accuracy in domains like mathematics, physics, chemistry, and real-time statistics.'
      //       },
      //     },
      //     required: ['query'],
      //   },
      // }
      
    ];

    const axiosConfig = {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    };

    const messages = [
      { role: 'user', content: text },
    ];

    // res.json({ reply });  // can probably use this to make this a callable function from elsewhere?? crazy.


  // this is how you make it lie
    async function get_population(city) {
      // Dummy implementation

      const minPopulation = 1;
      const maxPopulation = 17;
    
      // Generate a random population between minPopulation and maxPopulation
      const randomPopulation = Math.floor(Math.random() * (maxPopulation - minPopulation + 1)) + minPopulation;
      const populationData = {
          city: city,
          population: randomPopulation.toString(),
      };
      return JSON.stringify(populationData);
  }
  
  async function get_current_weather(location, unit = 'imperial') {
      const apiKey = "6038d89746c381638a6b474804009cf0";
    
      try {
        const response = await axios.get(`http://api.weatherstack.com/current`, {
          params: {
            access_key: apiKey,
            query: location,
            units: unit === 'imperial' ? 'f' : 'm',
          },
        });
        const weatherData = response.data;
        const temperature = weatherData.current.temperature;
        const locationName = weatherData.location.name;
        console.log(response.data.current)
    
        // return `Current temperature in ${locationName} is ${temperature} ${unit === 'imperial' ? 'F' : 'C'}`;
        return response.data.current
      } catch (error) {
        console.error('Error getting weather:', error);
        throw new Error('Failed to get the current weather');
      }
    }

  async function get_news(query) {

      // console.log('here!!!!!!!')

      console.log(query, '<---- the query')
      const apiKey = "pub_42194a2f39c21388873f94969ddc6e6185d62"; // Replace this with your actual API key
      const apiBase = "https://newsdata.io/api/1/news";
      const searchTerm = encodeURIComponent(query);
    
      const url = `${apiBase}?apikey=${apiKey}&q=${searchTerm}`;
    
      try {
        const response = await axios.get(url);
    
        let result = '';
    
        if (response.data.status === "success" && response.data.results) {
          response.data.results.forEach(article => {
            result += `Title: ${article.title}\n`;
            result += `Link: ${article.link}\n`;
            result += `Description: ${article.description}\n`;
            result += `Published Date: ${article.pubDate}\n\n`;
          });
        }
    
        console.log(result);
        return result;
    
      } catch (error) {
        console.log(error, 'this one???????');
        return null;
      }
    }
//below realtime new

  async function get_realtime_data(query) {
  const subscriptionKey = "92d490d6aeed40508fc35d4ff5abfbd8"; // Replace this with your Bing API Key
  const uriBase = "https://api.bing.microsoft.com/v7.0/search";
  const searchTerm = encodeURIComponent(query);

  const url = `${uriBase}?q=${searchTerm}&count=20&mkt=en-US`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey
      }
    });

    let result = '';

    if (response.data.webPages && response.data.webPages.value) {
      response.data.webPages.value.forEach(webPage => {
        result += `Name: ${webPage.name}\n`;
        result += `Snippet: ${webPage.snippet}\n\n`;
      });
    }

     console.log(result, "result!!!")   

    return result;

  } catch (error) {
    console.log(error);
    return null;
  }
}

  async function get_answers(query) {
  // URL encode the input query
  const encodedQuery = encodeURIComponent(query);

  // Construct the request URL with your actual AppID
  const url = `http://api.wolframalpha.com/v2/query?appid=YOUR_APPID&input=${encodedQuery}`;

  try {
      // Send the HTTP request
      const response = await axios.get(url);

      // Parse the XML response
      const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
      const result = await parser.parseStringPromise(response.data);

      // Simplify the structure of the response
      if (result.queryresult.$.success === 'true') {
          const output = {
              query: query,
              success: result.queryresult.$.success,
              error: result.queryresult.$.error,
              results: []
          };

          const pods = result.queryresult.pod;
          if (Array.isArray(pods)) {
              pods.forEach(pod => {
                  const podData = {
                      title: pod.$.title,
                      scanner: pod.$.scanner,
                      subpods: []
                  };
                  if (Array.isArray(pod.subpod)) {
                      pod.subpod.forEach(subpod => {
                          podData.subpods.push({
                              title: subpod.title,
                              plaintext: subpod.plaintext
                          });
                      });
                  } else { // Handle case where there is only one subpod
                      podData.subpods.push({
                          title: pod.subpod.title,
                          plaintext: pod.subpod.plaintext
                      });
                  }
                  output.results.push(podData);
              });
          }
          return output;
      } else {
          return { error: "Query was not successful" };
      }
  } catch (error) {
      console.error('Error fetching data from Wolfram Alpha:', error);
      return { error: "Failed to fetch data from Wolfram Alpha" };
  }
}
      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-3.5-turbo-0125',
          // model: 'gpt-4-0613',
          messages: messages,
          functions: functions,
          function_call: 'auto',
            // max_tokens: 80, // Specify the desired length in tokens
          
        }, axiosConfig);
      
        if (response?.data?.choices[0]?.message?.function_call) {
          const function_name = response.data.choices[0].message.function_call.name;
          const function_args = JSON.parse(response.data.choices[0].message.function_call.arguments);
      
          let function_response;
          // if (function_name === 'get_current_weather') {
          //   function_response = await get_current_weather(
          //     function_args.location,
          //     function_args.unit
          //   );}
            if (function_name === 'get_news') {
              function_response = await get_news(
                function_args.query
              );
          } 
          // else if (function_name === 'get_population') {
          //   function_response = await get_population(function_args.city);
          // } 
          else if (function_name === 'get_realtime_data') {
            function_response = await get_realtime_data(function_args.query);
          } else {
             function_response = `Unsupported function: ${function_name}`;
            // function_response = await get_realtime_data(function_args.data);
          }
      
          messages.push(response.data.choices[0].message);
          messages.push({
            role: 'function',
            name: function_name,
            content: function_response,
          });
      
          const second_response = await axios.post('https://api.openai.com/v1/chat/completions', {
              model: 'gpt-3.5-turbo-0613', // best model so far for completions.
            // model: 'gpt-4-turbo-preview',
             // model: 'davinci-002', // does not work with completions
            messages: messages,
          }, axiosConfig);
      
          console.log(second_response.data.choices[0].message.content);
          let reply = second_response.data.choices[0].message.content;
          res.json({ reply });
        } else {
          let reply = response.data.choices[0].message.content;
          res.json({ reply });
          console.log(response.data.choices[0].message.content);
        }}
  
  catch (error) {
      console.error('Error:', error.message);
  }
  } catch (error) {
    console.log('Error processing text:', error);
    res.status(500).json({ error: 'Error processing text' });
  }
});


app.post('/saveFile', async (req, res) => {
  const { text, content, code } = req.body;
  console.log(text, content, code)

  if(!code.length || code !==process.env.theCode){res.send('unauthorized'); return}

  let fileName;
  const cwd = process.cwd(); // get current working directory

  if (text.length) {
    fileName = path.join(cwd, `/savedConvos/${text}.txt`);
  } else {
    fileName = path.join(cwd, `/savedConvos/${uuidv4()}.txt`);
  }

  if (fileName.length && content.length) {

 if (fs.existsSync(fileName)){
  fileName = path.join(cwd, `/savedConvos/${uuidv4()}.txt`);
 }

    fs.writeFile(fileName, content, (err) => {
      if (err) throw err;
      console.log('File saved!');
      res.sendStatus(200);
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
