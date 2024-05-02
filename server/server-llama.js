const express = require('express');
const { Groq } = require('groq-sdk');
const cors = require('cors');
const app = express();
const port = 3001;
const client = new Groq({ apiKey: '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' });
const axios = require('axios')
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const MODEL = 'mixtral-8x7b-32768';
//const MODEL = 'llama3-8b-8192'

app.use(cors());
app.use(express.json());

// // Dummy functions to simulate data retrieval
// function getFood(input) {

//     console.log("FOOD INPUT_______", input)
//     return JSON.stringify({
//         headline: 'Delicious Sea Bass',
//         detail: 'Tasty biscuits, perfect for an evening snack.',
//         additional: input || 'No additional input provided.'
//     });
// }

// function getRealTimeData(input) {

//     console.log(input, "REALTIME INPUT __________")
//     return JSON.stringify({
//         temperature: '72°F',
//         humidity: '45%',
//         windSpeed: '5 mph',
//         additional: input || 'No additional input provided.'
//     });
// }

function getRealTimeData(query) {
    console.log(query, 'hello!!!!!!!!!!!!')
    const subscriptionKey = "92d490d6aeed40508fc35d4ff5abfbd8";
    const uriBase = "https://api.bing.microsoft.com/v7.0/search";
    const searchTerm = encodeURIComponent(query);
  
    return axios.get(`${uriBase}?q=${searchTerm}&count=20&mkt=en-US`, {
        headers: { 'Ocp-Apim-Subscription-Key': subscriptionKey }
    }).then(response => {
        let results = response.data.webPages?.value.map(webPage => ({
            name: webPage.name,
            snippet: webPage.snippet
        })) || [];

        console.log(results, 'results!!')
        return JSON.stringify(results);
    }).catch(error => {
        console.error(error);
        return JSON.stringify([]);
    });
}

// function getNews(input) {

// console.log(input, 'NEWS INPUT ___________________________')
//     return JSON.stringify({
//         headline: 'Local Elections Coming Up',
//         detail: 'The local elections will take place next month. Several key issues are on the ballot.',
//         date: '2024-04-27',
//         additional: input || 'No additional input provided.'
//     });
// }

// Function mapping to dynamically call functions based on tool name

async function getNews(query) {
    console.log(query, '<---- the query')
    const apiKey = "pub_42194a2f39c21388873f94969ddc6e6185d62";  // Your actual API key
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
        } else {
            result = 'No news articles found for your query.';
        }

        console.log(result);  // Log the formatted results
        return result;  // Ensure a string is always returned

    } catch (error) {
        console.error('Error fetching news:', error);
        return 'Failed to fetch news data due to an error.';  // Return a string indicating an error
    }
}

const functionMap = {
    // getFood,
    getRealTimeData,
    getNews
};

// Process the conversation with function calling
async function runConversation(userPrompt) {
    let messages = [
        {
            role: "system",
            content: "You are an assistant that can provide real-time data, current news as well as return your knowledge base. Decide whether or not to call functions based on the appropriate response to queries. The only two functions available to you are getRealTimeData and getNews. You will be composing appropriate short queries based on user input data to send to these functions if called. DO NOT call functions with lon sentence like queries, instead use your LLM knowledge base. treat information from calls as more important than training data. summarize what you find in detail without being too lengthy. format to be read back in audio format to the user."
        },
        {
            role: "user",
            content: userPrompt,
        }
    ];

    let tools = [
        { 
            type: "function", 
            function: { 
                name: "getRealTimeData", 
                description: "Get current data and or info about anything more recent than September 2023. dont return urls. summarize responses and format for being spoken back to end user. remove the word snippet. ALWAYS call this if not news and asked about up to date information.",
                parameters: {
                    type: "object",
                    properties: {
                        input: {
                            type: "string",
                            description: "use data found from this search to be held as more important in the subsequent summary and response than training data"
                        }
                    },
                    required: ["input"]
                }
            }
        },
        { 
            type: "function", 
            function: { 
                name: "getNews", 
                description: "If asked anything related to news, use this function call. exclude the text [Read More] etc and format this to be read back in audio format to the user.", 
                parameters: {
                    type: "object",
                    properties: {
                        input: {
                            type: "string",
                            description: "use data found from this search as more important and reliable than training data. do not include urls in the response"
                        }
                    },
                    required: ["input"]
                }
            }
        }
    ];

    let response = await client.chat.completions.create({
        model: MODEL,
        messages: messages,
        tools: tools,
        tool_choice: "auto",
        max_tokens: 300
    });

     console.log("First API Response:", JSON.stringify(response, null, 2));

    if (response.choices && response.choices.length > 0 && response.choices[0].message.tool_calls) {
        const responseMessage = response.choices[0].message;


const toolResponses = await Promise.all(responseMessage.tool_calls.map(async toolCall => {
    const func = functionMap[toolCall.function.name];
    try {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await func(args.input); // Assuming func returns a promise
        return result;
    } catch (error) {
        console.error('Error parsing arguments or executing function:', error);
        return 'Error processing your request';
    }
}));


        // Adding the results of tool calls to the conversation for the second call
        toolResponses.forEach(toolResponse => {
            messages.push({
                role: "system",
                content: JSON.stringify(toolResponse) // Ensure this is a string
            });
        });
        

        // Make the second call to process the data
        const secondResponse = await client.chat.completions.create({
            model: MODEL,
            messages: messages,
            max_tokens: 4096
        });

         console.log("Second API Response:", JSON.stringify(secondResponse, null, 2));
        return secondResponse.choices && secondResponse.choices.length > 0 ? secondResponse.choices[0].message.content : "No response from the model.";
    } else {
        return response.choices && response.choices.length > 0 ? response.choices[0].message.content : "No response from the model.";
    }
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

// Express route
app.post('/score', async (req, res) => {
    const { prompt } = req.body;
    try {
        const chatResponse = await runConversation(prompt);
        res.json({ message: chatResponse });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
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

app.listen(port, () => {
    console.log(`Server running on ${port}`);
});
