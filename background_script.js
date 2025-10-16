let problem_desc_sent = false;

let conversation_history = [];

let problemtitle = "";
let problem_desc = "";

let Interaction_continuation_data = {};

//function to call 
async function callMyServer(userPrompt) {
  const response = await fetch("http://localhost:3000/", {
    method: "POST",
    headers: { "Content-Type":"text/plain"},
    body: userPrompt
  });
  if(response.ok){
    const data = await response.text();
    //console.log(data);
    return data;
  }else{
    console.log("some error occured");
  }
  
}

chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
    // pass this data to OpenAI API
    if(request.action === "sendingProblemDescription"){
          (async ()=>{
            const desc = request.data;
            problemtitle = desc.name;
            problem_desc = desc.description;
            let PromptWithProblemDescription = `You are an expert software engineering interviewer. Your role is to test and enhance the candidate's problem solving, coding, and optimization skills in a professional and supportive manner.

             Here is the problem the candidate needs to solve on leetcode platform:
             
             Problem Title: ${problemtitle}
             Problem Statement: ${problem_desc}

             IMPORTANT NOTE:
             Dont use any special symbol in renponse until it is provided in question description or it is necessary to use.
             Dont repeat the problem description in output as user can read it from his screen on leetcode's problem's page.
             
             Start now by greeting the candidate and asking them to read the problem statement by themselves and if they have any query regarding the problem titled ${problemtitle}.
            `;
            console.log(PromptWithProblemDescription);
            //pass this initial prompt to backend server for processing and getting api response
            const message = await callMyServer(PromptWithProblemDescription); //no history as of now so no need to pass history
            console.log("message background script received is" + message);
            //after getting response add it to conversation history too.
            conversation_history.push({"user":PromptWithProblemDescription,"model":message});
            problem_desc_sent = true;
            sendResponse(message);
          })();

          // Return true to indicate async response
          return true;
    }
    
    if(request.action == "sending_user_interaction_with_code"){
      (async ()=>{
        const data = request.data;
        console.log(data);
        Interaction_continuation_data = data;
        //again call api while passing the previous conversation history along with current userInteraction
        const userPrompt = `You are an expert software engineering interviewer. Your role is to test and enhance the candidate's problem solving, coding, and optimization skills in a professional and supportive manner.

        Dont use any special symbol in renponse until it is necessary to use. Specially don't use backquotes and any quotes in response.

        Here is the problem under discussion:
        
        Problem Title: ${problemtitle}
        
        Candidate's Current Code
        
        ${Interaction_continuation_data.code}
        
        
        Candidate's Latest Message or Query
        
        ${Interaction_continuation_data.userReply}

        
        Conversation History for context
        
        ${JSON.stringify(conversation_history)};

        
        Your responsibilities remain the same:
        1. Continue the conversation naturally as a professional interviewer and take context from Conversation History to know what have been previously discussed.
        2. Ask relevant follow-up questions about their approach, code, and optimization.
        3. Evaluate their solution critically but constructively, pointing out improvements.
        4. If the candidate asks for hints, provide guiding hints step by step without revealing the full answer directly.
        5. Encourage them to think aloud and explain their choices clearly.
        6. Do not provide direct answers unless absolutely necessary at the end.
        7. Keep the conversation or reply concise and natural dont generate too big reply if not necessary.
        8. Interview will end when user asks to end the interview or user has explained and coded efficient approach.
        9. Don't use backquotes and any quotes in response.

        Continue the interview from this point, look into conversation history for context(dont ask same thing over and over), maintaining a professional, supportive, and neutral tone.
        MOST IMPORTANT NOTE : End the interview when user successfully gives and codes the efficient approach and give feedback for user to improve.`
        //and code
        console.log(userPrompt);
        const message = await callMyServer(userPrompt);
        console.log("message background script received is" + message);
        conversation_history.push({"user":Interaction_continuation_data.userReply,"model":message});
        //adding logic for only having atmost 5 previous conversation history
        if(conversation_history.length > 5){
          conversation_history.shift();
        }
        console.log(conversation_history);
        //console.log(message);
        sendResponse(message);
      })();
      return true;
    }
});
