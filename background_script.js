let problem_desc_sent = false;

let conversation_history = [];

let problemtitle = "";
let problem_desc = "";

let Interaction_continuation_data = {};

//function to call 
async function callMyServer(userPrompt) {
  const response = await fetch("http://localhost:3000/", {
    method: "POST",
    headers: { "Content-Type": "text/plain"},
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

             Here is the problem you need to ask the candidate about:
             
             **Problem Title:** ${problemtitle}
             **Problem Statement:** ${problem_desc}
             
             Your responsibilities:
             0. Keep the conversation or reply concise and natural dont generate too big reply if not necessary.
             1. **Begin** by greeting the candidate formally and briefly stating the problem title to set context.
             2. **Ask** the candidate to explain their understanding and thought process for solving the problem before they start coding.
             3. **Encourage** them to think out loud and clarify assumptions if needed.
             4. Once they provide their approach, **ask relevant follow-up questions** about their choices and edge cases.
             5. After they write code, **ask them to explain their code in detail**.
             6. **Evaluate their solution** critically but constructively. Point out potential issues or improvements if any.
             7. **Ask about optimizations**: time complexity, space complexity, and possible improvements.
             8. If the candidate **asks for hints**, provide guiding hints step by step **without revealing the full answer directly**.
             9. Maintain a professional, neutral, and supportive tone like a real interviewer.
             
            Continue this process until the problem is fully discussed and the candidate has optimized and justified their solution.
             
             Remember, do not give direct solutions unless it becomes essential to guide them at the end. Your goal is to test and improve their problem solving ability, critical thinking, and coding skills.
             
             Start now by greeting the candidate and asking them to explain their initial approach for the problem titled **${problemtitle}**.
            `;
            console.log(PromptWithProblemDescription);
            //pass this initial prompt to backend server for processing and getting api response
            const message = await callMyServer(PromptWithProblemDescription); //no history as of now so no need to pass history
            console.log("message background script received is" + message);
            //after getting response add it to conversation history too.
            conversation_history.push({user : PromptWithProblemDescription, model : message});
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
        Interaction_continuation_data.history = conversation_history;
        //again call api while passing the previous conversation history along with current userInteraction
        const userPrompt = `You are an expert software engineering interviewer. Your role is to test and enhance the candidate's problem solving, coding, and optimization skills in a professional and supportive manner.

        Here is the problem under discussion:
        
        **Problem Title:** ${problemtitle}
        
        ### 🔹 **Candidate's Current Code**
        
        ${Interaction_continuation_data.code}
        
        
        ### 🔹 **Candidate's Latest Message or Query**
        
        ${Interaction_continuation_data.userReply}

        
        ### 🔹 **Conversation History**
        
        ${JSON.stringify(conversation_history)};
        
        Your responsibilities remain the same:
        
        1. **Continue the conversation naturally** as a professional interviewer.
        2. Ask relevant follow-up questions about their approach, code, and optimization.
        3. Evaluate their solution critically but constructively, pointing out improvements.
        4. If the candidate asks for hints, provide guiding hints step by step **without revealing the full answer directly**.
        5. Encourage them to think aloud and explain their choices clearly.
        6. Do **not** provide direct answers unless absolutely necessary at the end.

        Continue the interview from this point, maintaining a professional, supportive, and neutral tone.`
        //and code
        console.log(userPrompt);
        const message = await callMyServer(userPrompt);
        conversation_history.push({user : data.userReply, model : message});
        console.log(message);
        sendResponse(message);
      })();
      return true;
    }
});
