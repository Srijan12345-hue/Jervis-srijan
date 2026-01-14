const btn = document.querySelector('.talk');
const content = document.querySelector('.content');

let isSpeaking = false;
const speechQueue = [];
let continuousMode = false;
let idleTimer = null;
let conversationContext = [];
let lastInteractionTime = Date.now();

function speak(text) {
  console.log("Attempting to speak:", text);
  
  // Check if speech synthesis is available
  if (!('speechSynthesis' in window)) {
    console.error('Speech synthesis not supported');
    alert('Speech synthesis not supported in this browser');
    return;
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const text_speak = new SpeechSynthesisUtterance(text);

  text_speak.rate = 1;
  text_speak.volume = 1;
  text_speak.pitch = 1;
  text_speak.lang = 'en-US';

  text_speak.onstart = () => {
    console.log("Speech started:", text);
    isSpeaking = true;
  };

  text_speak.onend = () => {
    console.log("Speech ended:", text);
    isSpeaking = false;
    if (speechQueue.length > 0) {
      speak(speechQueue.shift());
    } else if (continuousMode) {
      // After speaking, automatically start listening again
      setTimeout(() => {
        if (continuousMode) {
          startListening();
        }
      }, 1000);
    }
  };
  
  text_speak.onerror = (event) => {
    console.error("Speech error:", event.error);
    isSpeaking = false;
  };

  if (isSpeaking) {
    speechQueue.push(text);
    console.log("Added to speech queue:", text);
  } else {
    console.log("Speaking immediately:", text);
    // Small delay to ensure speech synthesis is ready
    setTimeout(() => {
      window.speechSynthesis.speak(text_speak);
    }, 100);
  }
}

// Initialize idle conversation timer
function resetIdleTimer() {
  clearTimeout(idleTimer);
  lastInteractionTime = Date.now();
  idleTimer = setTimeout(() => {
    if (continuousMode && !isSpeaking) {
      initiateIdleConversation();
    }
  }, 30000); // 30 seconds of inactivity
}

function initiateIdleConversation() {
  const idleMessages = [
    "Is there anything else I can help you with?",
    "I'm here if you need anything, sir.",
    "Would you like me to tell you a fun fact?",
    "Shall I check the weather or news for you?",
    "I'm ready for your next command.",
    "How about we try something new? Just say 'help' to see what I can do."
  ];
  
  const randomMessage = idleMessages[Math.floor(Math.random() * idleMessages.length)];
  speak(randomMessage);
  resetIdleTimer();
}

function startListening() {
  if (!continuousMode) return;
  
  content.textContent = "Listening...";
  try {
    recognition.start();
  } catch (error) {
    console.log("Recognition already started or error:", error);
  }
}

function toggleContinuousMode() {
  continuousMode = !continuousMode;
  
  if (continuousMode) {
    speak("Continuous mode activated. I'll keep listening for your commands.");
    resetIdleTimer();
  } else {
    speak("Continuous mode deactivated.");
    clearTimeout(idleTimer);
    content.textContent = "Click here to speak";
  }
}

// Example usage (like when the page loads or on button click):
window.addEventListener("load", function () {
  console.log("Page loaded, initializing JARVIS...");
  
  // Wait a bit for everything to load, then speak
  setTimeout(() => {
    speak("Initializing JARVIS... Say 'continuous mode' to enable continuous listening.");
  }, 1000);
  
  // Also greet the user
  setTimeout(() => {
    wishMe();
  }, 3000);
});

function wishMe() {
  var day = new Date();
  var hour = day.getHours();

  if (hour >= 0 && hour < 12) {
    speak("Good Morning, Sir!");
  } else if (hour >= 12 && hour < 17) {
    speak("Good Afternoon, Sir!");
  } else {
    speak("Good Evening, Sir!");
  }
}



const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  console.error('Speech recognition not supported');
  alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
}

const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = 'en-US';

recognition.onresult = (event) => {
  const currentIndex = event.resultIndex;
  const transcript = event.results[currentIndex][0].transcript;
  content.textContent = transcript;
  
  // Add to conversation context
  conversationContext.push({ type: 'user', message: transcript, timestamp: Date.now() });
  
  // Keep only last 10 interactions for context
  if (conversationContext.length > 10) {
    conversationContext.shift();
  }
  
  takeCommand(transcript.toLowerCase());
  resetIdleTimer();
};

recognition.onerror = (event) => {
  console.log('Speech recognition error:', event.error);
  if (continuousMode && event.error !== 'aborted') {
    setTimeout(() => {
      if (continuousMode) {
        startListening();
      }
    }, 2000);
  }
};

recognition.onend = () => {
  if (continuousMode) {
    // Don't restart immediately, let the speech response finish first
    // The restart will be handled in the speak function's onend event
  } else {
    content.textContent = "Click here to speak";
  }
};

btn.addEventListener('click', () => {
  console.log("Button clicked, continuous mode:", continuousMode);
  
  if (continuousMode) {
    toggleContinuousMode();
  } else {
    content.textContent = "Listening...";
    try {
      recognition.start();
      console.log("Speech recognition started");
    } catch (error) {
      console.error("Recognition error:", error);
      content.textContent = "Error starting recognition: " + error.message;
    }
  }
});


function takeCommand(message) {
  // Add assistant response to conversation context
  let response = "";
  
  if (message.includes('continuous mode') || message.includes('keep listening')) {
    toggleContinuousMode();
    return;
  } else if (message.includes('stop continuous') || message.includes('stop listening')) {
    continuousMode = false;
    clearTimeout(idleTimer);
    speak("Continuous mode stopped. Click the button to speak again.");
    content.textContent = "Click here to speak";
    return;
  } else if (message.includes('hey') || message.includes('hello') || message.includes('hi jarvis')) {
    const greetings = [
      "Hello Sir, How May I Help You?",
      "Hi there! What can I do for you today?",
      "Greetings! I'm ready to assist you.",
      "Hello! What would you like me to help you with?"
    ];
    response = greetings[Math.floor(Math.random() * greetings.length)];
    speak(response);
  } else if (message.includes('help') || message.includes('what can you do')) {
    response = "I can open websites like Google, YouTube, Facebook,instagram,whatsapp,twitter,chatGPT,perplexity,mathgpt,blackbox,lionardo . I can search for information, tell you the time and date, open calculator, and much more. Try saying 'continuous mode' for hands-free operation!";
    speak(response);
  } else if (message.includes("open google")) {
    window.open("https://google.com","_blank", "width=800,height=600");
    response = "Opening Google... Anything specific you'd like to search for?";
    speak(response);
  } else if (message.includes("open youtube")) {
   window.open("https://youtube.com", "_blank", "width=800,height=600");
    response = "Opening YouTube... What would you like to watch today?";
    speak(response);
  } else if (message.includes("open facebook")) {
    window.open("https://facebook.com", "_blank", "width=800,height=600");
    response = "Opening Facebook... Stay connected with your friends!";
    speak(response);
  }  else if (message.includes("open instagram")) {
    window.open("https://instagram.com", "_blank", "width=800,height=600");
    response = "Opening Instagram... Stay connected with your friends!";
    speak(response);
  }  else if (message.includes("open twitter")) {
    window.open("https://twitter.com", "_blank", "width=800,height=600");
    response = "Opening Twitter... Stay connected with your friends!";
    speak(response);
  }else if (message.includes("open whatsapp")) {
    window.open("https://web.whatsapp.com/", "_blank", "width=800,height=600");
    response = "Opening WhatsApp... Stay connected with your friends!";
    speak(response);
  }  else if (message.includes("open wikipedia")) {
    window.open("https://en.wikipedia.org/wiki", "_blank", "width=800,height=600");
    response = "Opening wikipedia... Stay connected with your friends!";
    speak(response);
  }  else if (message.includes("open chatgpt")) {
    window.open("https://chatgpt.com/?openaicom_referred=true", "_blank", "width=800,height=600");
    response = "Opening chatgpt... Stay connected with your friends!";
    speak(response);
  }  else if (message.includes("open perplexcity")) {
    window.open("https://www.perplexity.ai/", "_blank", "width=800,height=600");
    response = "Opening perplexcity... Stay connected with your friends!";
    speak(response);
  }  else if (message.includes("open mathgpt")) {
    window.open("https://math-gpt.org/", "_blank", "width=800,height=600");
    response = "Opening mathgpt... Stay connected with your friends!";
    speak(response);
  }   else if (message.includes("open gimini")) {
    window.open("https://gemini.google.com/app?hl=en-IN", "_blank", "width=800,height=600");
    response = "Opening gimini... Stay connected with your friends!";
    speak(response);
  }   else if (message.includes("open blackbox")) {
    window.open("https://www.blackbox.ai/  ", "_blank", "width=800,height=600");
    response = "Opening blackbox... Stay connected with your friends!";
    speak(response);
  }  else if (message.includes("open lionardo")) {
    window.open("  https://app.leonardo.ai/", "_blank", "width=800,height=600");
    response = "Opening linardo... Stay connected with your friends!";
    speak(response);
  }else if (message.includes('what is') || message.includes('who is') || message.includes('what are')) {
    window.open(`https://www.google.com/search?q=${message.replace(" ", "+")}`, "_blank", "width=800,height=600");
    response = "This is what I found on the internet regarding " + message + ". Would you like me to search for anything else?";
    speak(response);
  } else if (message.includes('wikipedia')) {
    window.open(`https://en.wikipedia.org/wiki/${message.replace("wikipedia", "").trim()}`, "_blank", "width=800,height=600");
    response = "This is what I found on Wikipedia regarding " + message + ". Quite interesting, isn't it?";
    speak(response);
  } else if (message.includes('time')) {
    const time = new Date().toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
    response = "The current time is " + time + ". Is there anything else you need to know?";
    speak(response);
  } else if (message.includes('date')) {
    const date = new Date().toLocaleString(undefined, { month: "short", day: "numeric" });
    response = "Today's date is " + date + ". Any plans for today?";
    speak(response);
  } else if (message.includes('calculator')) {
    window.open(`https://www.google.com/search?q=${message.replace("", "+")}`, "_blank", "width=800,height=600");
    response = "Opening Calculator. Need help with some calculations?";
    speak(response);
  } else if (message.includes('thank you') || message.includes('thanks')) {
    const thankResponses = [
      "You're welcome, sir! Happy to help.",
      "My pleasure! Anything else I can do for you?",
      "Glad I could assist! What's next?",
      "Always at your service, sir!"
    ];
    response = thankResponses[Math.floor(Math.random() * thankResponses.length)];
    speak(response);
  } else if (message.includes('how are you')) {
    response = "I'm functioning perfectly, thank you for asking! How can I make your day better?";
    speak(response);
  } else {
    window.open(`https://www.google.com/search?q=${message.replace(" ", "+")}`, "_blank", "width=800,height=600");
    response = "I found some information for " + message + " on Google. Let me know if you need help with anything else!";
    speak(response);
  }
  
  // Add response to conversation context
  if (response) {
    conversationContext.push({ type: 'assistant', message: response, timestamp: Date.now() });
  }
}