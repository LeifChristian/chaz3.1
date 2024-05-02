import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const PWD = 8675309;
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

function App() {
  const inputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [enteredText, setEnteredText] = useState("");
  const [theResponse, setResponse] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isPasswordValidated, setPasswordValidated] = useState(false);
  const [toggle, setToggle] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayPause, setShowPlayPause] = useState(false);

  useEffect(() => {
    const inputElement = inputRef.current;
    inputElement.style.height = "auto";
    if (inputElement.scrollHeight > inputElement.clientHeight) {
      inputElement.style.height = `${inputElement.scrollHeight}px`;
    }
  }, [enteredText]);

  useEffect(() => {
    if (!isPasswordValidated) {
      const savedPassword = localStorage.getItem("appPassword");
      if (savedPassword && parseInt(savedPassword) === parseInt(PWD)) {
        setPasswordValidated(true);
      } else {
        const pwdPrompt = () => {
          const password = prompt("Enter the password");
          if (password === null) {
            pwdPrompt();
          } else if (parseInt(password) === parseInt(PWD)) {
            localStorage.setItem("appPassword", password);
            setPasswordValidated(true);
          } else {
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
        setEnteredText(result[0].transcript);
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
      stopSpeakText();
      return;
    }
    setIsRecording(true);
    recognition.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    recognition.stop();
  };

  const downloadConvo = () => {
    const existingHistory = localStorage.getItem("conversationHistory");
    if (!existingHistory) {
      console.log("Nothing to export.");
      return;
    }
    const conversationBlob = new Blob([existingHistory], { type: "text/plain;charset=utf-8" });
    const blobUrl = URL.createObjectURL(conversationBlob);
    const tempLink = document.createElement("a");
    tempLink.href = blobUrl;
    const fileName = prompt("Enter filename");
    tempLink.download = fileName ? `${fileName}.txt` : "conversation-history.txt";
    tempLink.style.display = "none";
    if (fileName === null) {
      return;
    }
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    URL.revokeObjectURL(blobUrl);
  };

  const convertToTimezoneOffset = (isoDateString) => {
    const date = new Date(isoDateString);
    const timezoneOffset = date.getTimezoneOffset() * -1;
    const localDate = new Date(date.getTime() + timezoneOffset * 60000);
    return localDate.toISOString();
  };

  const handleGreeting = async (userInput) => {
    const date = new Date();
    const isoDateString = date.toISOString();
    const localISOString = convertToTimezoneOffset(isoDateString);
    const existingHistory = localStorage.getItem("conversationHistory");
    const newMessage = !existingHistory
      ? `Question: ${userInput}`
      : `Response: ${theResponse} ${localISOString}  Question: ${userInput}`;
    let updatedHistory = existingHistory ? `${existingHistory} ${newMessage}` : `${newMessage}`;
    if (existingHistory && existingHistory.includes(newMessage)) {
      console.log("Message already exists in history");
      return;
    }
    updateConversationHistory(updatedHistory);
    const payload = updatedHistory.replaceAll(
      ' <-- Text before this sentence is conversation history so far between you and me. Do NOT include timestamps in responses, timestamps provide context for when this conversation is taking place. responses will be spoken back to user using TTS. Using this information and context, answer the following question --> ',
      ''
    ).replaceAll('Response: "Response:', 'Response:')
      ? `${updatedHistory} <-- Text before this sentence is conversation history so far between you and me. Do NOT include timestamps in responses, timestamps provide context for when this conversation is taking place. responses will be spoken back to user using TTS. Using this information and context, answer the following question -->  "${userInput}"`
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
        const responseData = await response.json();
        const reply = responseData.message;
        setResponse(reply);
        console.log('response --->', reply);
        speakText(reply);
        pause();
        let newUpdatedHistory = reply ? `${updatedHistory} Response: ${reply}` : `${updatedHistory}`;
        console.log(newUpdatedHistory, '<--- updated hist??');
        updateConversationHistory(newUpdatedHistory);
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

  const speakText = (text) => {
    function removeUrls(text) {
      const urlPattern = /https?:\/\/[^\s]+/g;
      return text.replace(urlPattern, '');
    }
    text = removeUrls(text);
    console.log(text, 'clean text');
    setShowPlayPause(true);
    if ("speechSynthesis" in window) {
      if (toggle) {
        setShowPlayPause(true);
        return;
      }
      const splitTextIntoSegments = (text) => {
        const maxWordsPerSegment = 32;
        const sentences = text.split(/([.!?:])/);
        const segments = [];
        let currentSegment = "";
        sentences.forEach((sentence) => {
          if (sentence.match(/[.!?:]/)) {
            if (currentSegment) {
              segments.push(currentSegment);
              currentSegment = "";
            }
            segments.push(sentence.trim());
          } else {
            const words = sentence.split(/\s+/);
            words.forEach((word) => {
              if (currentSegment.split(/\s+/).length < maxWordsPerSegment) {
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
        if (currentSegment) {
          segments.push(currentSegment);
        }
        return segments;
      };
      const segments = splitTextIntoSegments(text, 32);
      const synthesizeSegments = () => {
        if (segments.length === 0) {
          setShowPlayPause(false);
          setIsPlaying(false);
          return;
        }
        const segment = segments.shift();
        const utterance = new SpeechSynthesisUtterance(segment.replaceAll('Response:', '').replaceAll('.', '').replaceAll('!', '').replaceAll('?', '').replaceAll(":", ""));
        utterance.voice = speechSynthesis.getVoices()[5];
        utterance.onend = synthesizeSegments;
        speechSynthesis.speak(utterance);
      };
      synthesizeSegments();
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
    setToggle(prevToggle => !prevToggle);
    if (window.speechSynthesis.speaking) {
      stopSpeakText();
    }
  };

  const pause = () => {
    if (isPlaying) {
      speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      resume();
      setIsPlaying(true);
    }
  };

  const resume = () => {
    speechSynthesis.resume();
  };

  const updateConversationHistory = (newEntry) => {
    const delimiter = "|||";
    let conversationHistory = localStorage.getItem("conversationHistory");
    if (conversationHistory === null) {
      localStorage.setItem("conversationHistory", newEntry);
    } else {
      conversationHistory = conversationHistory.split(delimiter);
      conversationHistory = conversationHistory.filter(entry => !newEntry.includes(entry));
      conversationHistory = conversationHistory.join(delimiter);
      conversationHistory += newEntry;
      localStorage.setItem("conversationHistory", conversationHistory);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 style={{ color: 'lightgreen' }}>╬alkbot-βeta_llama</h1>
        <div id="dick"></div>
        <div className="buttons-container">
          {window.innerWidth >= 468 && (
            <button onClick={startRecording} type="button">
              Start
            </button>
          )}
          <button
            onClick={() => {
              stopSpeakText();
              setIsPlaying(false);
              setShowPlayPause(false);
              setEnteredText("");
            }}
            type="button"
          >
            Stop
          </button>
          {isPlaying && (
            <button onClick={toggleMute} type="button">
              Mute
            </button>
          )}
          {showPlayPause && (
            <button onClick={pause} type="button">
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          )}
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
              minHeight: "1.2rem",
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
            }}
            placeholder="Enter your question"
          />
          <br />
          <br />
          <button type="button" onClick={() => handleGreeting(enteredText)}>
            Send
          </button>
          <button
            onClick={() => {
              const confirmClear = window.confirm(
                "Clear the conversation history?"
              );
              if (confirmClear) {
                localStorage.removeItem("conversationHistory");
                setEnteredText("");
                setResponse("");
                setShowPlayPause(false);
              }
            }}
          >
            Reset
          </button>
          <button onClick={downloadConvo}>
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
          <p
            style={{
              maxHeight: "50vh",
              fontSize: '1.3rem',
              overflow: "auto",
              width: "90vw",
              margin: 'auto',
              marginTop: '1%',
              fontWeight: 'bold',
              color: 'lightgreen',
              textAlign: 'center',
              whiteSpace: 'pre-wrap'
            }}
          >
            {theResponse}
          </p>
        </div>
      </header>
    </div>
  );
}

export default App;