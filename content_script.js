function injectElement(){
    if(!document.getElementById("Interview_Simulator")){

    const background_element = document.createElement("div");
    background_element.id = "background_element";
    background_element.style.position = "fixed";
    background_element.style.zIndex = "5000";
    background_element.style.right = "15px";
    background_element.style.bottom = "43px";
    background_element.classList.add("hidden");
    

    const button = document.createElement("button");
    button.id = "Interview_Simulator";
    button.innerHTML = `<img id="Extension_Image" src="https://static.vecteezy.com/system/resources/previews/007/241/534/original/interview-icon-style-vector.jpg" style="border-radius : 50%"/>`;
    button.style.position = "fixed";
    button.style.bottom = "50px";
    button.style.right = "20px";
    button.style.zIndex = "9999";
    button.classList.add("circular_button");

    const start_stop_RecordingButton = document.createElement("button");
    start_stop_RecordingButton.id = "recording_button";
    start_stop_RecordingButton.classList.add("circular_button");
    start_stop_RecordingButton.style.position = "fixed";
    start_stop_RecordingButton.style.bottom = "110px";
    start_stop_RecordingButton.style.right = "20px";
    start_stop_RecordingButton.style.zIndex = "9999";
    start_stop_RecordingButton.classList.add("hidden");

    document.body.appendChild(background_element);
    document.body.appendChild(button);
    document.body.appendChild(start_stop_RecordingButton);

    console.log("injected successfully");
    }
}
injectElement();

//states

let expended = false; //variable to store whether the injectedbutton is in expended form or not

let problem_details = { //details of problem statement on page
    name : "",
    description: ""
}

let userCode = "";

//gathering details of problem
const title = document.querySelector("head > title");
problem_details.name = title.textContent;

const des = document.querySelector("head > meta:nth-child(11)");
problem_details.description = des.content;
// console.log(problem_details.name);
// console.log(problem_details.desctiption);

function getUserCode(){
    const checkEditor = setInterval(() => {
        const codeeditor = document.querySelector("#editor > div.flex.flex-1.flex-col.overflow-hidden.pb-2 > div.flex-1.overflow-hidden > div > div > div.overflow-guard > div.monaco-scrollable-element.editor-scrollable.vs-dark > div.lines-content.monaco-editor-background");

        if (codeeditor) {
            console.log("Code editor found:", codeeditor.textContent);
            userCode = codeeditor.textContent;
            clearInterval(checkEditor);
        }
    }, 1000); // checks every second
    console.log("user code is taken");
}

//accessing individual injected elements
const background_element = document.getElementById("background_element");
const mainbutton = document.getElementById("Interview_Simulator");
const recordbutton = document.getElementById("recording_button");

function collapseExpended(){
    //should hide the extra buttons
    recordbutton.classList.add("hidden");
    background_element.classList.add("hidden");
}
function expendOptions(){
    recordbutton.classList.remove("hidden");
    background_element.classList.remove("hidden");
}

function sendProblemDetails(){
    chrome.runtime.sendMessage({action:"sendingProblemDescription",data : problem_details},(response)=>{
        //background_script will pass model reply to these details which will then be uttered
        console.log("background script replied "+response);
        utter_this_sentence(response);
    });
    console.log("problem_description_sent");
}

let isProblemDescSent = false;

mainbutton.addEventListener("click",()=>{
    if(expended == true){
        collapseExpended();
        expended = false;
    }else{
        expendOptions();
        expended = true;
        //send problem_details to background script to process without codes
        if(!isProblemDescSent)sendProblemDetails();
        isProblemDescSent = true;
    }
});

let listening = false; //not listening to user speech

let userinteraction = "";

const speechRecognition = window.speechRecognition || window.webkitSpeechRecognition;
if(!speechRecognition){
    console.log("browser does not support speech recognition");
}else{
    const recognition = new speechRecognition();

    // Configurations
    recognition.continuous = true; // keep listening until stopped
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recordbutton.addEventListener("click",()=>{
    if(listening == false){
        listening = true;
        //start listening
        console.log("recogntion started");
        recognition.start();
        getUserCode();
    }else{
        listening = false;
        recognition.stop();
        console.log("recognition ended");
        chrome.runtime.sendMessage({action : "sending_user_interaction_with_code", data : {code : userCode,userReply : userinteraction}},(response)=>{
            //response will contain model reply to user query or data utter this here if received data
            console.log(response);
            utter_this_sentence(response);
            console.log("background script responded : "+response);
        });
    }
    });
    //handle result
    recognition.onresult = (event)=>{
        const transcript = event.results[0][0].transcript;
        console.log("user said : "+ transcript);
        userinteraction = transcript;
    }
    recognition.onend = ()=>{
        if(listening == true){
            console.log("Recognition ended unexpectedly, restarting...");
            recognition.start(); // auto restart if still supposed to listen
        }else{
            console.log("recognition finshed successfully");
        }
    }
    recognition.onerror = (event)=>{
        console.log("Following error occured : "+event.error);
    }
}

//logic for text to voice
function utter_this_sentence(sentence) {
    const synth = window.speechSynthesis; // ensure synth is defined
    synth.cancel(); // optional: stop previous utterances

    const utterThis = new SpeechSynthesisUtterance(sentence);
    utterThis.onpause = (event) => {
        console.log(event);
        console.log("Utterance paused");
    };

    utterThis.onend = () => console.log("Utterance ended");
    utterThis.onerror = (e) => console.error("Speech synthesis error", e);

    synth.speak(utterThis);
}

