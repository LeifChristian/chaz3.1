# AI-Talkbot with realtime data capabilities

****************** 

server-llama.js provides llama3 and mixtral apis using groq cloud.
*** it would be awesome to be able to select models from the front end.

best i can think of would be three different calls, so the front end hits a different route.

AMAZING *** first and second completions can be DIFFERENT MODELS. Holy shit thats cool.

server.js = original chatGPT completions model, which still wins so far.

Simply string apis together, line up your prompts and magic! A little friend, with amnesia.
Built using gpt-3.5-turbo-0613.

# Features: 

    Realtime data and news via Bing search summary and function call completions 
        --(this works most of the time, if it doesn't ask again and say "news search", or "live search")
    Conversational context for follow up questions
    Local storage of conversations, pick up where you left off
    Export conversations to a text file


# ENV
need a .env file in the root of the project, and the same .env file in the server subfolder.

myAPIKey=API_KEY_HERE
theCode=CODE_TO_SECURE_ROUTES_FRONTEND_TO_BACKEND
REACT_APP_API_KEY=CODE_TO_SECURE_ROUTES_FRONTEND_TO_BACKEND
searchAPIKey=SEARCH_API_KEY_HERE

# TO RUN

recommend using pnpm to install both react app and server backend
run pnpm dev.

 make sure your attached apis and api keys are set up and working. Shit is about to get real. 


 <--- BEGIN BOILERPLATE rEaCt README

# Getting Started with Create React App

hint: openai

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
