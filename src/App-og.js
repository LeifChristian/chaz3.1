import React, { useState, useEffect, useRef } from "react";
import "./App.css";
const theCode = 8675309;
const PWD = 8675309;
const recognition = new (window.SpeechRecognition ||
  window.webkitSpeechRecognition)();

function App() {
  const inputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [enteredText, setEnteredText] = useState("");
  const [theResponse, setResponse] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [conversationHistory, setConversationHistory] = useState("");
  // const [showConversations, setShowConversations] = useState(true);
  // const [isPasswordPromptVisible, setPasswordPromptVisible] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [rez, setRez] = useState("");
  const [isPasswordValidated, setPasswordValidated] = useState(false);
  const [toggle, setToggle] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPlayPause, setShowPlayPause] = useState(false)

useEffect(() => {
  const inputElement = inputRef.current;

  // Reset height first to ensure it can shrink if necessary.
  inputElement.style.height = 'auto';

  if (inputElement.scrollHeight > inputElement.clientHeight) {
    inputElement.style.height = `${inputElement.scrollHeight}px`;
  }
}, [enteredText]);


  useEffect(() => {
    const handleWindowResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  useEffect(() => {
    const existingHistory = localStorage.getItem("conversationHistory");

    if (existingHistory) {
      const historyArray = existingHistory.split("|");
      console.log(historyArray);
      // ... Your code to handle existingHistory ...
    } 
  }, []);


  useEffect(() => {
    // Show password prompt only if password is not validated
    if (!isPasswordValidated) {
      const savedPassword = localStorage.getItem("appPassword");

      if (savedPassword && parseInt(savedPassword) === parseInt(PWD)) {
        // Password is correct, continue with the app init
        setPasswordValidated(true); 
      } else {
        // Incorrect password or no password found in localStorage, prompt for password
        const pwdPrompt = () => {
          var password = prompt("Enter the password");

          if (password === null) {
            // The user clicked "Cancel" in the prompt
            pwdPrompt(); // Show the password prompt again
          } else if (parseInt(password) === parseInt(PWD)) {
            // Password is correct, continue with the app initialization
            localStorage.setItem("appPassword", password); // Save the password in localStorage
            setPasswordValidated(true); 
          } else {
            // Incorrect password, prompt again
            alert("Incorrect password. Try again.");
            pwdPrompt();
          }
        };

        pwdPrompt();
      }
    }
  }, [isPasswordValidated]); 
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        setFinalTranscript(result[0].transcript);
        setEnteredText(result[0].transcript);
        console.log(result[0].transcript);
        stopRecording();
        handleGreeting(result[0].transcript);
      } else {
        interimTranscript += result[0].transcript;
        setInterimTranscript(interimTranscript);
      }
    }
  };

  recognition.onerror = (event) => {
    console.error("Error with the speech recognition API:", event.error);
  };

  const startRecording = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    if (isRecording) {
      stopSpeakText()
      return;
    }
  
    setIsRecording(true);
    recognition.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    recognition.stop();
    // console.log(transcript);
  };

  const downloadConvo = () => {
    const existingHistory = localStorage.getItem("conversationHistory");
  
    if (!existingHistory) {
      console.log("Nothing to export.");
      return;
    }
  
    // Create a Blob that contains the conversation history
    const conversationBlob = new Blob([existingHistory], { type: "text/plain;charset=utf-8" });

  
    // Create a URL that points to the Blob
    const blobUrl = URL.createObjectURL(conversationBlob);
  
    // Create a link that points to the URL and represents a download link
    const tempLink = document.createElement("a");
    tempLink.href = blobUrl;
    let bob = prompt('Enter filename')

bob!= null ? tempLink.download = `${bob}.txt` : tempLink.download ="conversation-history.txt"
    tempLink.style.display = "none";

    if(bob==null){return}
  
    // Add the link to the document so it can be clicked
    document.body.appendChild(tempLink);
  
    // Simulate a click on the link to start the download
    tempLink.click();
  
    // Clean up by removing the link and revoking the Blob URL
    document.body.removeChild(tempLink);
    URL.revokeObjectURL(blobUrl);
  };

  const convertToTimezoneOffset = (isoDateString) => {
    // Create a new Date object from the ISO date string
    const date = new Date(isoDateString);
  
    // Get the current timezone offset in minutes
    const timezoneOffset = date.getTimezoneOffset() * -1;
  
    // Add the timezone offset to the date object (in milliseconds)
    const localDate = new Date(date.getTime() + timezoneOffset * 60000);
  
    // Return the local date as a string
    return localDate.toISOString();
  }

  const handleGreeting = async (userInput) => {
    const date = new Date();
    const isoDateString = date.toISOString();
    const localISOString = convertToTimezoneOffset(isoDateString);
  
    const existingHistory = localStorage.getItem("conversationHistory");
    const newMessage = !existingHistory ? `Question: ${userInput}` : `Response: ${theResponse} ${localISOString}  Question: ${userInput}`;
    let updatedHistory = existingHistory ? `${existingHistory} ${newMessage}` : `${newMessage}`;
  
    if (existingHistory && existingHistory.includes(newMessage)) {
      console.log("Message already exists in history");
      return;
    }
  
    updateConversationHistory(updatedHistory);
  
    const payload = updatedHistory.replaceAll(
      '<-- use text before this sentence as a conversation between you and me. If asked your thoughts, respond with an insightful and balanced portrayal of the topic. The idea here is that im giving you a history of our conversation for context and follow up questions. Im also providing API calls you can use to respond to queries. Using all this information, and only including date time if asked, answer the following question -->',
      ''
    ).replaceAll('Response: "Response:', 'Response:')
      ? `${updatedHistory} <-- use text before this sentence as a conversation between you and me. If asked your thoughts, respond with an insightful and balanced portrayal of the topic. The idea here is that im giving you a history of our conversation for context and follow up questions. Im also providing API calls you can use to respond to queries. Using all this information, and only including date time if asked, answer the following question --> "${userInput}"`
      : userInput;
  
    try {
      const response = await fetch('http://localhost:3001/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: payload })
      });
  
      if (response.ok) {
        // const responseData = await response.json();
        // setResponse(responseData.message);  // Assuming `setResponse` updates the UI with the new message
        // console.log('Response:', responseData.message);

        const responseData = await response.json();
        const reply = responseData.message; // Modify this line to extract the relevant response from the responseData object received from your backend
        setResponse(reply);
        console.log('response --->', reply);
        speakText(reply);
        pause()
        setRez(reply);
       let newUpdatedHistory = reply ? `${updatedHistory} Response: ${reply}` : `${updatedHistory}`;
  
       console.log(newUpdatedHistory, '<--- updated hist??')
       updateConversationHistory(newUpdatedHistory)
        
      } else {
        const errorMessage = await response.text();
        console.error("Error:", errorMessage);
        setResponse('Failed to fetch data.');
      }
    } catch (error) {
      console.error("Network error:", error);
      setResponse('Network error occurred.');
    }
  };

  const speakText = (text) => {  // using array of avaliable voices, currently set to british female
                               // it is of note that the default voice handles punctuation better.
                               // below we are filtering  |

                               function removeUrls(text) {
                                const urlPattern = /https?:\/\/[^\s]+/g;
                                return text.replace(urlPattern, '');
                            }
                            
                            // Example usage
                       
                            text = removeUrls(text);
                          console.log(text, 'clean text')
                            
                               
setShowPlayPause(true);
  if ("speechSynthesis" in window) {
    if (toggle) {
      setShowPlayPause(true);
      return;
    }

    // Function to split text into segments of around 35 words each or at sentence boundaries (including commas)
// Function to split text into segments of around maxWordsPerSegment words each or at sentence boundaries (including commas and periods)


const splitTextIntoSegments = (text) => {
  const maxWordsPerSegment = 32; // Default chunk size
  const sentences = text.split(/([.!?:])/); // Split by . ? ! : -

  
  const segments = [];
  let currentSegment = "";

  sentences.forEach((sentence) => {
    if (sentence.match(/[.!?:]/)) {
      // Sentence-ending punctuation found, reset the current segment and add the sentence to segments
      if (currentSegment) {
        segments.push(currentSegment);
        currentSegment = "";
      }
      segments.push(sentence.trim());
    } else {
      // No sentence-ending punctuation, add words to the current segment
      const words = sentence.split(/\s+/);

      words.forEach((word) => {
        if (currentSegment.split(/\s+/).length < maxWordsPerSegment) {
          // Check for exceptions like ".com"
          if (currentSegment.endsWith(".") && word === "com") {
            currentSegment = currentSegment.slice(0, -1) + word;
          } else {
            currentSegment += (currentSegment ? " " : "") + word;
          }
        } else {
          segments.push(currentSegment);
          currentSegment = word;
        }
      });
    }
  });

  // Add the last segment if it exists
  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments;
};

    const segments = splitTextIntoSegments(text, 32); // 35 words per segment
    // Function to recursively synthesize the segments
    const synthesizeSegments = () => {
      if (segments.length === 0) {
        // All segments have been synthesized
        setShowPlayPause(false);
	setIsPlaying(false);
        return;
      }

      const segment = segments.shift();
      const utterance = new SpeechSynthesisUtterance(segment.replaceAll('Response:', '').replaceAll('.', '').replaceAll('!', '').replaceAll('?', '').replaceAll(":",""));
      utterance.voice = speechSynthesis.getVoices()[5]; // Set the desired voice
      utterance.onend = synthesizeSegments; // Continue to the next segment when this one finishes
      speechSynthesis.speak(utterance);
    };

    synthesizeSegments(); // Start the process
  } else {
    console.error("Speech synthesis is not supported or not ready");
  }
};

  const stopSpeakText = () => {
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }
};

  const toggleMute = () => {
  // Invert the current state of toggle
  setToggle(prevToggle => !prevToggle);
  
  // If currently speaking, stop it.
  if (window.speechSynthesis.speaking) {
    stopSpeakText();
  }}

  const pause = () => {

    if(isPlaying){speechSynthesis.pause(); setIsPlaying(false)}
    else{resume(); setIsPlaying(true)}
   }

  const resume = () => {speechSynthesis.resume()}

  const updateConversationHistory = (newEntry) => {
    const delimiter = "|||";
    let conversationHistory = localStorage.getItem("conversationHistory");
  
    if (conversationHistory === null) {
      localStorage.setItem("conversationHistory", newEntry);
    } else {
      // Remove duplicates
      conversationHistory = conversationHistory.split(delimiter);
      conversationHistory = conversationHistory.filter(entry => !newEntry.includes(entry));
      conversationHistory = conversationHistory.join(delimiter);
  
      // Add new entry to the end of conversation history
      conversationHistory += newEntry;
      localStorage.setItem("conversationHistory", conversationHistory);
    }
  }
  
  return (
    <div className="App">
      <header className="App-header">
        <h1 style={{ color: 'lightgreen', }}>╬alkbot-βeta_llama</h1>
        <div id="dick"></div>
        <div className="buttons-container">

{windowWidth >= 468 ? (
        <button onClick={() => startRecording()} type="button">
          Start
        </button>
      ) : null}

          <button
            onClick={() => {
              stopSpeakText();
              setIsPlaying(false)
            setShowPlayPause(false)
              setRez("");
              setEnteredText("");
            }}
            type="button"
          >
            Stop
          </button>

          {isPlaying ? <button onClick={()=>{toggleMute()}} type="button">
             Mute
          </button> : '' }

          { showPlayPause ?
          <button onClick={()=>{pause();}} type="button">
             {isPlaying ? 'Pause' : 'Play'}
          </button> : ''}
        </div>
        <div className="transcript-container"></div>
        <div>
        <textarea
  ref={inputRef}
  style={{
    background: "black",
    color: "lightgreen",
    borderRadius: ".6em",
    fontWeight: 'bold',
    width: "80vw",
    height: "auto",
    minHeight: "1.2rem",  // Match the initial font size
    textAlign: "center",
    fontSize: '1.2rem',
    overflow: 'auto',
    resize: 'none',
    boxSizing: 'border-box',
  }}
  value={enteredText}
  onChange={(event) => {
    setEnteredText(event.target.value);
    setInterimTranscript("");
    setFinalTranscript("");
  }}
  placeholder="Enter your question"
  // send query on Enter key
  // onKeyDown={(event) => {
  //   if (event.key === "Enter") {
  //     handleGreeting(enteredText);
  //   }
  // }}
/>
          <br />
          <br />
          <button type='button'
            onClick={() => {
              handleGreeting(enteredText);
              console.log(enteredText)
            }}
          >
            Send
          </button>
          <button
  onClick={() => {
    const confirmClear = window.confirm(
      "Clear the conversation history?"
    );
    if (confirmClear) {
      localStorage.removeItem("conversationHistory");
      setConversationHistory("");
      setEnteredText("");
      setRez("");
      setResponse("");
      setShowPlayPause(false)
    }
  }}
>
  Reset
</button>

<button
  onClick={() => {
downloadConvo()
  }}
>
  Save
</button>
        </div>
        <div
          style={{
            color: "black",
            fontSize: "1.2rem",
            textShadow: "2px 3px 1px purple",
            textStroke: "black",
            WebkitTextStroke: "1px black",
            textStrokeWidth: "4px",
          }}
        >
         <p  style={{maxHeight: "50vh", fontSize: '1.3rem',
          overflow: "auto", width: "90vw", 
          margin: 'auto', marginTop: '1%', fontWeight: 'bold', 
          color: 'lightgreen', textAlign: 'center',  whiteSpace: 'pre-wrap'}}>
            {rez}</p>
        </div>
      </header>
    </div>
  );
}
export default App;
